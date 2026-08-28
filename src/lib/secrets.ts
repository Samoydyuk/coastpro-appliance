import crypto from 'node:crypto';

/**
 * Secrets that have to live in the database.
 *
 * The integration keys belong in `settings` rather than an environment variable
 * for a good reason — they are minted on the JobPocket side and the old one dies
 * the instant it is replaced, so rotation has to be paste-and-done rather than
 * edit-the-project-and-redeploy. But a row in `settings` is also a row in every
 * backup, every `pg_dump`, and every screenshot of a database client.
 *
 * So the value is sealed with a key that lives only in the environment. A stolen
 * copy of the database is then a copy of some ciphertext: the two halves have to
 * be taken from two different places before it means anything.
 *
 * AES-256-GCM, because it authenticates as well as encrypts — a tampered
 * ciphertext fails to open rather than decrypting to something attacker-chosen.
 */

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12; // 96 bits, the size GCM is specified for
const PREFIX = 'enc.v1';

export class SecretsNotConfiguredError extends Error {
  constructor() {
    super(
      'SETTINGS_ENCRYPTION_KEY is not set. Generate one with ' +
        '`openssl rand -base64 32` and add it to the project.'
    );
    this.name = 'SecretsNotConfiguredError';
  }
}

/**
 * The 32-byte key, from base64 or hex.
 *
 * Deliberately not derived from some other secret with a fixed salt: that would
 * mean rotating the session secret silently shredded every stored key.
 */
function encryptionKey(): Buffer {
  const raw = process.env.SETTINGS_ENCRYPTION_KEY;
  if (!raw) throw new SecretsNotConfiguredError();

  const key = /^[0-9a-f]{64}$/i.test(raw)
    ? Buffer.from(raw, 'hex')
    : Buffer.from(raw, 'base64');

  if (key.length !== 32) {
    throw new Error(
      `SETTINGS_ENCRYPTION_KEY must decode to 32 bytes, got ${key.length}. ` +
        'Generate one with `openssl rand -base64 32`.'
    );
  }
  return key;
}

export function secretsConfigured(): boolean {
  try {
    encryptionKey();
    return true;
  } catch {
    return false;
  }
}

/** `enc.v1.<iv>.<tag>.<ciphertext>`, all base64url. */
export function sealSecret(plaintext: string): string {
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    PREFIX,
    iv.toString('base64url'),
    tag.toString('base64url'),
    ciphertext.toString('base64url'),
  ].join('.');
}

/**
 * Opens a sealed value. Anything that is not sealed is returned as-is, so a key
 * pasted in before this existed keeps working until it is next saved — an
 * upgrade nobody has to be told about.
 */
export function openSecret(stored: string): string {
  if (!stored.startsWith(`${PREFIX}.`)) return stored;

  // The prefix has a dot of its own, so it comes off by length rather than by
  // splitting — counting fields from the left would shift every part by one.
  const [ivPart, tagPart, dataPart] = stored.slice(PREFIX.length + 1).split('.');
  if (!ivPart || !tagPart || !dataPart) {
    throw new Error('Stored secret is malformed');
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    encryptionKey(),
    Buffer.from(ivPart, 'base64url')
  );
  decipher.setAuthTag(Buffer.from(tagPart, 'base64url'));

  return Buffer.concat([
    decipher.update(Buffer.from(dataPart, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}

export function isSealed(stored: string): boolean {
  return stored.startsWith(`${PREFIX}.`);
}

/**
 * What a key looks like when it is shown back to somebody.
 *
 * Enough to tell two keys apart and to check you pasted the right one; not
 * enough to use. The full value never leaves the server after it is saved.
 */
export function maskKey(plaintext: string): string {
  const [head] = plaintext.split('.');
  const last4 = plaintext.slice(-4);
  return `${head ?? ''}…${last4}`;
}
