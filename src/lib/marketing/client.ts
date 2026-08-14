import { db, quietly } from '@/lib/db';

/**
 * Reading finished work out of JobPocket, for content.
 *
 * The other end is deliberately narrow: `/v1/marketing` returns the technical
 * shape of a repair — appliance, brand, model, error code, what was found, what
 * was replaced, city and state — and has no code path that can return a name, a
 * phone number, a street or a coordinate. It also refuses a booking key, so the
 * key here is a second one, issued for reading and nothing else.
 *
 * Everything below trusts that boundary and does not try to reproduce it. The
 * one thing this side must not do is widen it: no field is stored that the API
 * does not send, and photos are proxied rather than linked, so a picture is
 * never fetched from a bucket URL that skips the metadata stripping.
 */

const DEFAULT_BASE_URL = 'https://portal.jobpocket.app';

/**
 * A console request, not a visitor's page load, so it can afford to wait —
 * but not forever: the refresh runs while somebody watches a spinner.
 */
const TIMEOUT_MS = 10_000;

export interface MarketingConfig {
  baseUrl: string;
  apiKey: string;
}

let cached: { at: number; value: MarketingConfig | null } | null = null;
const CONFIG_TTL_MS = 60_000;

/**
 * The key, from the environment or from the settings table.
 *
 * Same shape and same reasoning as the booking key in `lib/jobpocket.ts`:
 * re-enabling the integration in JobPocket mints a new secret and kills the old
 * one on the spot, so the key has to be replaceable without a redeploy. A
 * separate row from the booking key because it is a separate key — the whole
 * point of the marketing scope is that one cannot do the other's job.
 */
export async function marketingConfig(): Promise<MarketingConfig | null> {
  if (cached && Date.now() - cached.at < CONFIG_TTL_MS) return cached.value;

  const baseUrl = process.env.JOBPOCKET_API_BASE || DEFAULT_BASE_URL;
  const envKey = process.env.JOBPOCKET_MARKETING_KEY;
  if (envKey) {
    const value = { baseUrl, apiKey: envKey };
    cached = { at: Date.now(), value };
    return value;
  }

  const sql = db();
  if (!sql) return null;

  const value = await quietly(async () => {
    const [row] = (await sql`
      select value from settings where key = 'jobpocket_marketing'
    `) as unknown as { value: { apiKey?: string; baseUrl?: string } }[];
    if (!row?.value?.apiKey) return null;
    return { baseUrl: row.value.baseUrl || baseUrl, apiKey: row.value.apiKey };
  });

  cached = { at: Date.now(), value: value ?? null };
  return value ?? null;
}

/** Called after the key is changed in the console, so the next read sees it. */
export function forgetMarketingConfig() {
  cached = null;
}

// ---------------------------------------------------------------------------
// The dataset
// ---------------------------------------------------------------------------

export interface MarketingPhoto {
  id: string;
  caption: string | null;
  category: string | null;
  /** A path on the JobPocket API — proxied, never linked to directly. */
  url: string;
}

export interface MarketingJob {
  jobId: string;
  status: string;
  completionDate: string | null;
  createdAt: string;
  updatedAt: string;

  applianceType: string | null;
  manufacturer: string | null;
  model: string | null;

  diagnosis: string | null;
  repairPerformed: string | null;
  publicTechnicianNotes: string | null;
  errorCodes: string[];
  replacedParts: Array<{ description: string; partNumber: string | null }>;

  city: string | null;
  state: string | null;

  photos: MarketingPhoto[];
  /** Labels of what the redactor removed on the way out. Never the values. */
  redacted: string[];
}

export class MarketingApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

async function get<T>(path: string): Promise<T> {
  const config = await marketingConfig();
  if (!config) {
    throw new MarketingApiError(
      0,
      'No marketing key. Enable the Marketing integration in JobPocket and paste the key into Settings.'
    );
  }

  const res = await fetch(`${config.baseUrl}/v1/marketing${path}`, {
    headers: { authorization: `Bearer ${config.apiKey}`, accept: 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: 'no-store',
  });

  if (!res.ok) {
    // The two that mean something specific, named rather than left as a code:
    // a rotated key and a key issued for the wrong thing look identical
    // otherwise, and the fix is different.
    const reason =
      res.status === 401
        ? 'JobPocket rejected the marketing key — it was probably rotated.'
        : res.status === 403
          ? 'That key is not allowed to read marketing data. It is likely the booking key.'
          : `JobPocket returned ${res.status}.`;
    throw new MarketingApiError(res.status, reason);
  }

  return (await res.json()) as T;
}

/** One page of publishable jobs, newest first. */
export async function fetchMarketingJobs(
  options: { limit?: number; offset?: number } = {}
): Promise<{ jobs: MarketingJob[]; hasMore: boolean }> {
  const params = new URLSearchParams({
    limit: String(options.limit ?? 100),
    offset: String(options.offset ?? 0),
  });
  return get<{ jobs: MarketingJob[]; hasMore: boolean }>(`/jobs?${params}`);
}

/** One job. A 404 here means it was never released, or belongs to someone else. */
export async function fetchMarketingJob(jobId: string): Promise<MarketingJob | null> {
  try {
    const { job } = await get<{ job: MarketingJob }>(`/jobs/${encodeURIComponent(jobId)}`);
    return job;
  } catch (error) {
    if (error instanceof MarketingApiError && error.status === 404) return null;
    throw error;
  }
}

/**
 * A photo, fetched with the key so the console can show it.
 *
 * Returns the upstream response so the proxy route can stream the bytes
 * through without buffering an image in memory. The stripping of the EXIF has
 * already happened on the JobPocket side; nothing here re-encodes it.
 */
export async function fetchMarketingPhoto(photoId: string): Promise<Response | null> {
  const config = await marketingConfig();
  if (!config) return null;

  const res = await fetch(
    `${config.baseUrl}/v1/marketing/photos/${encodeURIComponent(photoId)}`,
    {
      headers: { authorization: `Bearer ${config.apiKey}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: 'no-store',
    }
  );

  return res.ok ? res : null;
}
