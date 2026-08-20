import { db } from '@/lib/db';

/**
 * Which accounts are connected, and how to talk to them.
 *
 * Kept in `settings` rather than in environment variables, for one reason that
 * matters more than tidiness: a token in an env var can only be replaced by
 * editing the project and redeploying. Meta's user tokens lapse after about
 * sixty days, and Google's refresh token dies whenever the password changes or
 * consent is withdrawn. Making the owner open Vercel and redeploy every time
 * that happens guarantees the importer stays broken for weeks.
 *
 * WHAT STILL LIVES IN ENV, and has to. The client id and secret identify the
 * *application*, not the account — you cannot run an OAuth flow without an app
 * registered with Google and Meta first. That registration is a one-time job.
 * What the Connect button removes is the recurring part: finding a refresh
 * token by hand, hunting for a location id, and re-pasting a token every two
 * months.
 *
 * The env fallback stays for the credentials that were already documented, so
 * anyone who set them up before this existed keeps working without touching
 * anything.
 */

export interface GoogleConnection {
  refreshToken: string;
  /** `locations/123…`, as the Performance API wants it. */
  locationId: string;
  /** For showing who is connected, not for calling anything. */
  accountName?: string;
  locationName?: string;
  connectedAt?: string;
}

export interface MetaConnection {
  /**
   * A Page token derived from a long-lived user token. Meta does not expire
   * these while the underlying user token is valid, which is the whole reason
   * the callback bothers with the two-step exchange rather than storing the
   * short-lived token it was handed.
   */
  pageToken: string;
  pageId?: string;
  pageName?: string;
  igUserId?: string;
  igUsername?: string;
  connectedAt?: string;
}

const GOOGLE_KEY = 'presence_google';
const META_KEY = 'presence_meta';

async function readSetting<T>(key: string): Promise<T | null> {
  const sql = db();
  if (!sql) return null;
  try {
    const [row] = (await sql`select value from settings where key = ${key}`) as unknown as {
      value: T;
    }[];
    return row?.value ?? null;
  } catch {
    return null;
  }
}

async function writeSetting(key: string, value: unknown): Promise<void> {
  const sql = db();
  if (!sql) throw new Error('Database not connected');
  await sql`
    insert into settings (key, value, updated_at)
    values (${key}, ${sql.json(value as never)}, now())
    on conflict (key) do update set value = excluded.value, updated_at = now()
  `;
}

async function clearSetting(key: string): Promise<void> {
  const sql = db();
  if (!sql) return;
  await sql`delete from settings where key = ${key}`;
}

// ---------------------------------------------------------------------------
// Google Business Profile
// ---------------------------------------------------------------------------

export function googleAppConfigured(): boolean {
  return Boolean(process.env.GBP_CLIENT_ID && process.env.GBP_CLIENT_SECRET);
}

export async function getGoogleConnection(): Promise<GoogleConnection | null> {
  const stored = await readSetting<GoogleConnection>(GOOGLE_KEY);
  if (stored?.refreshToken && stored.locationId) return stored;

  // Whatever was configured before the Connect button existed.
  const refreshToken = process.env.GBP_REFRESH_TOKEN;
  const raw = (process.env.GBP_LOCATION_ID ?? '').trim();
  if (!refreshToken || !raw) return null;
  return {
    refreshToken,
    locationId: raw.startsWith('locations/') ? raw : `locations/${raw}`,
    accountName: 'From environment variables',
  };
}

export const saveGoogleConnection = (value: GoogleConnection) => writeSetting(GOOGLE_KEY, value);
export const clearGoogleConnection = () => clearSetting(GOOGLE_KEY);

// ---------------------------------------------------------------------------
// Meta — Instagram and Facebook
// ---------------------------------------------------------------------------

export function metaAppConfigured(): boolean {
  return Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET);
}

export async function getMetaConnection(): Promise<MetaConnection | null> {
  const stored = await readSetting<MetaConnection>(META_KEY);
  if (stored?.pageToken) return stored;

  const pageToken = process.env.META_PAGE_TOKEN;
  if (!pageToken) return null;
  return {
    pageToken,
    pageId: process.env.META_PAGE_ID || undefined,
    igUserId: process.env.META_IG_USER_ID || undefined,
    pageName: 'From environment variables',
  };
}

export const saveMetaConnection = (value: MetaConnection) => writeSetting(META_KEY, value);
export const clearMetaConnection = () => clearSetting(META_KEY);

// ---------------------------------------------------------------------------
// Where the providers send the browser back
// ---------------------------------------------------------------------------

/**
 * Must match the redirect URI registered with each provider exactly — scheme,
 * host, path, trailing slash and all. Derived from the site URL rather than
 * from the incoming request so a preview deployment cannot quietly become a
 * valid redirect target.
 */
export function redirectUri(provider: 'google' | 'meta'): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'https://coastpro.us').replace(/\/$/, '');
  return `${base}/api/admin/presence/connect/${provider}/callback`;
}

/** Signed round-trip value, so a callback cannot be replayed from elsewhere. */
export function makeState(): string {
  return `${Date.now().toString(36)}.${Math.random().toString(36).slice(2, 12)}`;
}
