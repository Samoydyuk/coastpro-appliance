/**
 * The admin session cookie: a signed, self-contained token.
 *
 * Written against Web Crypto only, because the middleware that checks it runs
 * on the Edge runtime where Node's `crypto` module does not exist. There is no
 * server-side session table — the signature is the whole check, which keeps the
 * guard a pure function and costs no database round trip on every page.
 */

const encoder = new TextEncoder();

function secret(): string {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value || value.length < 16) {
    throw new Error('ADMIN_SESSION_SECRET must be set to at least 16 characters.');
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

/**
 * Returns a typed array rather than its underlying ArrayBuffer. The Edge
 * runtime sandbox checks arguments against its own realm's constructors, and an
 * ArrayBuffer handed across that boundary fails the check — a TypedArray does
 * not. The cast is because TypeScript's BufferSource does not accept the
 * generic Uint8Array shape newer versions produce.
 */
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

export interface AdminClaims {
  sub: string;
  exp: number;
}

export async function signAdminToken(claims: AdminClaims): Promise<string> {
  const payload = toBase64Url(encoder.encode(JSON.stringify(claims)));
  const signature = await crypto.subtle.sign('HMAC', await key(), encoder.encode(payload));
  return `${payload}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function readAdminToken(token: string | undefined): Promise<AdminClaims | null> {
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
    const claims = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as AdminClaims;
    if (typeof claims.exp !== 'number' || claims.exp * 1000 < Date.now()) return null;
    return claims;
  } catch {
    return null;
  }
}

export async function verifyAdminToken(token: string | undefined): Promise<boolean> {
  return (await readAdminToken(token)) !== null;
}
