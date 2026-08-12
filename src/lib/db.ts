import postgres from 'postgres';

/**
 * Postgres handle for the Railway database.
 *
 * The database is a Railway Postgres service reached over Railway's TCP proxy,
 * because the site runs on Vercel and Vercel is not inside Railway's private
 * network. The proxy speaks TLS 1.3, so the credentials and the traffic are
 * encrypted across the public internet.
 *
 * Two rules shape this file:
 *
 * 1. The connection is created lazily and cached on `globalThis`, because in
 *    development Next.js re-evaluates modules on every edit and would otherwise
 *    open a new pool on each one.
 * 2. Nothing here is allowed to take the public site down. If `DATABASE_URL` is
 *    missing the accessors return null and every caller degrades to "we just
 *    don't record it" — a visitor must never see an error because analytics is
 *    misconfigured.
 */

const connectionString = process.env.DATABASE_URL;

declare global {
  // eslint-disable-next-line no-var
  var __coastproSql: postgres.Sql | undefined;
}

export const isDbConfigured = Boolean(connectionString);

const isLocal = /localhost|127\.0\.0\.1/.test(connectionString ?? '');

function create(): postgres.Sql {
  return postgres(connectionString as string, {
    // Railway Postgres is a plain server with no pgbouncer in front, so named
    // prepared statements would work. Measured against the real database they
    // made no difference — at ~40ms of network round trip per query, parse time
    // is lost in the noise. Left off so that putting a transaction-mode pooler
    // in front later cannot break anything.
    prepare: false,
    // Railway allows 500 connections and reserves 3. Three per function
    // instance leaves room for far more concurrency than this site will see,
    // while still letting the admin screens run their four aggregations at
    // once rather than one after another.
    max: 3,
    // Opening a connection costs about half a second — TCP, then a TLS
    // handshake, then authentication, across the country. A warm function
    // instance should not pay that again between requests, so idle connections
    // are held for a minute rather than dropped after twenty seconds.
    idle_timeout: 60,
    connect_timeout: 15,
    // Railway's Postgres presents a self-signed certificate, so 'require'
    // rather than 'verify-full': the traffic is encrypted, the certificate is
    // not checked against a public CA. A database on localhost is not crossing
    // a network at all, and demanding TLS there only breaks local work.
    ssl: isLocal ? false : 'require',
    onnotice: () => {},
  });
}

/** The handle, or null when the site is running without a database. */
export function db(): postgres.Sql | null {
  if (!connectionString) return null;
  if (!global.__coastproSql) global.__coastproSql = create();
  return global.__coastproSql;
}

/** The handle, or a thrown error. For admin routes, which cannot degrade. */
export function requireDb(): postgres.Sql {
  const handle = db();
  if (!handle) {
    throw new Error('DATABASE_URL is not set — the admin panel needs a database.');
  }
  return handle;
}

/**
 * Run a write that is nice to have but never worth an error page. Used by the
 * ingestion path, where losing one pageview beats breaking the visit.
 */
export async function quietly<T>(work: () => Promise<T>): Promise<T | null> {
  try {
    return await work();
  } catch (error) {
    console.error('[analytics] write failed:', error);
    return null;
  }
}
