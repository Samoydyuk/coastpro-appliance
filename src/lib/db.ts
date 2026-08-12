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
 * 2. Nothing here is allowed to take the public site down. If the database is
 *    unusable the accessors return null and every caller degrades to "we just
 *    don't record it" — a visitor must never see an error because analytics is
 *    misconfigured. Only the admin console, which cannot degrade, is told why.
 */

const connectionString = process.env.DATABASE_URL;

declare global {
  // eslint-disable-next-line no-var
  var __coastproSql: postgres.Sql | undefined;
}

/**
 * Why the connection string is unusable, if it is — worked out once, up front,
 * so the console can name the problem instead of showing a DNS error.
 *
 * The `railway.internal` case is the mistake that actually gets made: Railway
 * shows both DATABASE_URL and DATABASE_PUBLIC_URL, and the internal one is the
 * tempting copy. It resolves only inside Railway's own network, so from Vercel
 * it fails as `getaddrinfo ENOTFOUND` — and because every ingest write goes
 * through `quietly()`, the site would look perfectly healthy while recording
 * nothing at all. That is the worst failure this system can have, so it is
 * caught by name. RAILWAY_ENVIRONMENT is set only when running inside Railway,
 * where the internal host is the correct choice.
 */
const configError: string | null = !connectionString
  ? 'DATABASE_URL is not set — the admin panel needs a database.'
  : connectionString.includes('.railway.internal') && !process.env.RAILWAY_ENVIRONMENT
    ? 'DATABASE_URL points at a railway.internal host, which resolves only inside ' +
      "Railway's private network. This site runs on Vercel — use Railway's " +
      'DATABASE_PUBLIC_URL instead.'
    : null;

export const isDbConfigured = configError === null;

/**
 * True only for a database on this machine, where TLS is neither present nor
 * needed. It inspects the host rather than the whole string: the password lives
 * in that string too, and a rotated password that happened to contain
 * "localhost" must not be able to turn encryption off.
 */
function isLocal(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
  } catch {
    return false;
  }
}

function create(): postgres.Sql {
  const url = connectionString as string;

  return postgres(url, {
    // Railway is a plain Postgres server behind a TCP proxy — no pgbouncer in
    // the path — so prepared statements survive for the life of the connection.
    // Left at the default (on). Measured against this database with the two
    // settings interleaved, so network drift hit both equally, mean ms per
    // call over 40 pairs:
    //
    //     simple select   43 off → 39 on
    //     aggregate       47 off → 41 on
    //     bulk insert    191 off → 140 on
    //
    // The ingest endpoint runs that bulk insert on every beacon, so this is
    // where it earns its keep. If a transaction-mode pooler is ever put in
    // front of this database, this is the line to revisit: prepared statements
    // break there, which is why Supabase needed them off.

    // Five per function instance: the dashboard fires four aggregations through
    // Promise.all and one of them would otherwise queue. max_connections on
    // this server is 500 with 3 reserved, and the server is CoastPro's alone,
    // so the ceiling is nowhere near.
    max: 5,
    // Opening a connection costs about half a second — TCP, then a TLS
    // handshake, then authentication, across the country. A warm function
    // instance should not pay that again between requests, so idle connections
    // are held for a minute rather than dropped after twenty seconds.
    idle_timeout: 60,
    connect_timeout: 15,
    // Railway's Postgres serves a certificate it generated for itself, so the
    // chain cannot be checked against a public CA and verify-full fails
    // outright. 'require' encrypts without demanding one. It must never be
    // dropped: this server also accepts unencrypted connections, and this
    // connection crosses the public internet carrying the credentials and every
    // visitor's hashed address.
    ssl: isLocal(url) ? false : 'require',
    connection: {
      // Railway sets no statement_timeout at all, and there is no dashboard to
      // kill a runaway query — it would have to be found by hand over psql.
      // Fifteen seconds is longer than any real query here and shorter than the
      // function timeout, so a stuck query surfaces as an error instead of a
      // hang. Verified against the live database: it does fire.
      statement_timeout: 15_000,
      idle_in_transaction_session_timeout: 30_000,
      // So a human reading pg_stat_activity can tell the web app apart from the
      // nightly conversions cron and from their own psql session.
      application_name: 'coastpro-web',
    },
    onnotice: () => {},
  });
}

/** The handle, or null when the site is running without a usable database. */
export function db(): postgres.Sql | null {
  if (configError) return null;
  if (!global.__coastproSql) global.__coastproSql = create();
  return global.__coastproSql;
}

/** The handle, or a thrown error. For admin routes, which cannot degrade. */
export function requireDb(): postgres.Sql {
  if (configError) throw new Error(configError);
  return db() as postgres.Sql;
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
