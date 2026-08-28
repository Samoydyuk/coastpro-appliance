import crypto from 'node:crypto';

/**
 * Time-based one-time codes — RFC 6238, the flavour Google Authenticator,
 * 1Password and Apple Passwords all speak: SHA-1, six digits, thirty seconds.
 *
 * Ported from the JobPocket admin console, where it has been carrying the same
 * job against the RFC's own reference vectors. Kept dependency-free on purpose:
 * a second factor is not worth handing to a package that can be taken over.
 *
 * Node-only — the Edge middleware never verifies a code, it only checks the
 * signed cookie that a successful verification produced.
 */

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export const TOTP_STEP_SECONDS = 30;
const TOTP_DIGITS = 6;

function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = '';

  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/=+$/, '').replace(/\s/g, '');
  let bits = 0;
  let value = 0;
  const out: number[] = [];

  for (const char of clean) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) throw new Error('Invalid base32 character in TOTP secret');
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

/** 160-bit shared secret, base32-encoded — the size RFC 4226 recommends. */
export function generateTotpSecret(): string {
  return base32Encode(crypto.randomBytes(20));
}

function hotp(secret: Buffer, counter: number): string {
  const counterBuf = Buffer.alloc(8);
  // Counter is 64-bit but stays well inside 2^53 for any realistic clock.
  counterBuf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  counterBuf.writeUInt32BE(counter >>> 0, 4);

  const digest = crypto.createHmac('sha1', secret).update(counterBuf).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  return String(binary % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, '0');
}

export function currentTotpCounter(now: number = Date.now()): number {
  return Math.floor(now / 1000 / TOTP_STEP_SECONDS);
}

/** The code for a given time-step — exported so tests can generate valid input. */
export function generateTotp(secret: string, counter: number = currentTotpCounter()): string {
  return hotp(base32Decode(secret), counter);
}

export interface TotpVerifyOptions {
  /** Steps of clock drift tolerated either side. Default 1 = ±30s. */
  window?: number;
  /** Reject any counter at or below this — blocks replay of a still-valid code. */
  minCounter?: number | null;
  now?: number;
}

/**
 * Returns the matched time-step so the caller can persist it as `minCounter`
 * for the next attempt, or null when the code is wrong or replayed.
 */
export function verifyTotp(
  token: string,
  secret: string,
  options: TotpVerifyOptions = {}
): number | null {
  const { window = 1, minCounter = null, now = Date.now() } = options;

  const normalized = token.replace(/\s/g, '');
  if (!/^\d{6}$/.test(normalized)) return null;

  let secretBuf: Buffer;
  try {
    secretBuf = base32Decode(secret);
  } catch {
    return null;
  }

  const center = currentTotpCounter(now);
  const candidate = Buffer.from(normalized);

  for (let offset = -window; offset <= window; offset++) {
    const counter = center + offset;
    if (counter < 0) continue;
    if (minCounter !== null && counter <= minCounter) continue;

    const expected = Buffer.from(hotp(secretBuf, counter));
    if (crypto.timingSafeEqual(candidate, expected)) return counter;
  }
  return null;
}

/** otpauth:// URI — paste into a QR generator, or type the secret in by hand. */
export function totpEnrollmentUri(
  account: string,
  secret: string,
  issuer = 'CoastPro Console'
): string {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: String(TOTP_DIGITS),
    period: String(TOTP_STEP_SECONDS),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}
