/**
 * The customer's session: one proved phone number, signed.
 *
 * Same shape and the same Web Crypto HMAC as `admin-token.ts`, and for the same
 * reason — there is no session table, the signature is the whole check. What
 * differs is what the cookie contains and how long it lasts.
 *
 * It contains a phone number and nothing else. Not a JobPocket portal token,
 * though the code exchange hands one back: that token opens JobPocket's own
 * portal for a client's entire record, dispatcher work included, and parking it
 * in a browser would quietly undo the partition this whole feature is built
 * around. The number on its own is useless to anybody who cannot also present
 * the operations key, which never leaves the server.
 *
 * A separate secret from the admin one, deliberately. They protect different
 * things — the admin cookie opens the schedule and the customer book, this one
 * opens one household's own repair history — and a shared secret would mean a
 * leak of either is a leak of both.
 */

const encoder = new TextEncoder();

function secret(): string {
  const value = process.env.CUSTOMER_SESSION_SECRET;
  if (!value || value.length < 16) {
    throw new Error('CUSTOMER_SESSION_SECRET must be set to at least 16 characters.');
  }
  return value;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]!);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function key(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export interface CustomerClaims {
  /** E.164, exactly as it was proved. */
  phone: string;
  exp: number;
}

export async function signCustomerToken(claims: CustomerClaims): Promise<string> {
  const payload = toBase64Url(encoder.encode(JSON.stringify(claims)));
  const signature = await crypto.subtle.sign('HMAC', await key(), encoder.encode(payload));
  return `${payload}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function readCustomerToken(
  token: string | undefined
): Promise<CustomerClaims | null> {
  if (!token) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;

  let ok: boolean;
  try {
    ok = await crypto.subtle.verify(
      'HMAC',
      await key(),
      fromBase64Url(signature) as unknown as BufferSource,
      encoder.encode(payload) as unknown as BufferSource
    );
  } catch {
    return null;
  }
  if (!ok) return null;

  try {
    const claims = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as CustomerClaims;
    if (typeof claims.phone !== 'string' || !claims.phone) return null;
    if (typeof claims.exp !== 'number' || claims.exp * 1000 < Date.now()) return null;
    return claims;
  } catch {
    return null;
  }
}

/**
 * Best-effort E.164, matching what JobPocket's own normaliser does for the
 * numbers this business sees. Returns null rather than a half-normalised
 * string: a wrong normalisation would look up somebody else's repairs.
 */
export function toE164(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 0) return null;

  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (trimmed.startsWith('+') && digits.length >= 11 && digits.length <= 15) return `+${digits}`;
  return null;
}
