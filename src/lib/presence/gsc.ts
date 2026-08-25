import { createSign } from 'node:crypto';
import type postgres from 'postgres';
import { upsertPlatformStats, type PlatformStatRow } from '@/lib/presence/store';
import {
  getSearchConsoleConnection,
  getSearchConsoleServiceAccount,
  searchConsoleApp,
  type SearchConsoleConnection,
  type ServiceAccountKey,
} from '@/lib/presence/credentials';
import type { ImportOutcome } from '@/lib/presence/gbp';

/**
 * What Google's search results did with this site.
 *
 * This is the half of the picture the analytics tables cannot see. A session
 * only exists once somebody has already clicked; everything before that — which
 * query, how many people saw us, how far down the page we sat — happens inside
 * Google and is only ever visible through this API. Positions, impressions and
 * the queries themselves have no first-party equivalent and never will.
 *
 * The two sides stay in separate tables on purpose. Search Console counts a
 * click, `sessions` counts an arrival, and the numbers legitimately disagree:
 * Google deduplicates differently, drops queries below a privacy threshold, and
 * counts a click the visitor abandoned before the page loaded. Averaging them
 * into one number would produce something that is not true of either.
 *
 * WHY A TRAILING WINDOW RATHER THAN NEW DAYS ONLY. Search Console revises. A
 * day first appears partial and is restated for about three days afterwards,
 * and the queries under it change as the privacy threshold is applied. Fetching
 * only what is new would freeze the first, wrong version of every day. The
 * primary key on `platform_stats` makes re-writing the same days free, so the
 * importer simply re-reads the whole window each run.
 */

const API = 'https://www.googleapis.com/webmasters/v3';

/** Google's cap for one response. Paged past with `startRow` when reached. */
const PAGE_SIZE = 25_000;

const CHANNEL = 'google_search';
const SOURCE = 'gsc_api';

/**
 * How far back to keep reaching, and how much of it to take per night.
 *
 * Google keeps sixteen months and then drops the oldest day permanently, so
 * anything not collected inside that window is gone for good — this is the one
 * part of the console where waiting actually destroys data.
 *
 * Taken in chunks rather than in one run because a single request for sixteen
 * months would sit well past the sixty seconds the function is allowed. Each
 * night takes the fresh window plus one older slice, so the history fills
 * itself in over about five nights and then stops widening on its own. Nobody
 * has to remember to run anything, which was the point.
 */
const HISTORY_TARGET_DAYS = 480;
const BACKFILL_CHUNK_DAYS = 90;

interface SearchRow {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
}

const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * A service account proves who it is by signing, not by being handed a token.
 *
 * The assertion is a JWT signed with the account's private key, which Google
 * trades for an access token good for an hour. Nothing here expires in the way
 * a refresh token does — the key is the credential, and it is valid until
 * somebody deletes it in the Cloud console.
 *
 * Signed with the built-in crypto module rather than a JWT library. This is one
 * header, one claim set and one signature, and it is not worth a dependency.
 */
async function serviceAccountToken(key: ServiceAccountKey): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: key.client_email,
    scope: SCOPE,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const signingInput = `${base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${base64url(
    JSON.stringify(claims)
  )}`;

  const signer = createSign('RSA-SHA256');
  signer.update(signingInput);
  signer.end();

  let signature: string;
  try {
    signature = base64url(signer.sign(key.private_key));
  } catch (error) {
    throw new Error(
      `The service account key could not sign anything — it is probably malformed. (${
        error instanceof Error ? error.message : String(error)
      })`
    );
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${signingInput}.${signature}`,
    }),
  });

  const body = (await response.json()) as { access_token?: string; error_description?: string };
  if (!response.ok || !body.access_token) {
    throw new Error(
      `Google would not accept the service account: ${body.error_description ?? response.status}`
    );
  }
  return body.access_token;
}

/**
 * Which property this account can read.
 *
 * Discovered rather than configured, because the failure it prevents is the
 * quiet one: a service account that has been created but never added as a user
 * in Search Console authenticates perfectly and returns nothing at all. Asking
 * Google what it can see turns that into a sentence naming the address to add.
 */
async function discoverSite(token: string): Promise<string> {
  const configured = (process.env.GSC_SITE_URL ?? '').trim();
  if (configured) return configured;

  const response = await fetch(`${API}/sites`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`Could not list Search Console properties: ${(await response.text()).slice(0, 200)}`);
  }

  const body = (await response.json()) as {
    siteEntry?: Array<{ siteUrl?: string; permissionLevel?: string }>;
  };
  const entries = (body.siteEntry ?? []).filter(
    (entry) => entry.siteUrl && entry.permissionLevel !== 'siteUnverifiedUser'
  );
  if (!entries.length) {
    throw new Error(
      'The service account signed in but can see no properties. Add its address as a user in Search Console under Settings → Users and permissions.'
    );
  }

  const host = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://coastpro.us').hostname.replace(
    /^www\./,
    ''
  );
  const mine = entries.filter((entry) => (entry.siteUrl ?? '').includes(host));
  const pool = mine.length ? mine : entries;
  // A domain property covers www, the bare host and both schemes at once; a
  // URL-prefix property covers exactly one of them, which is how a site ends up
  // with real traffic and an empty report.
  return (pool.find((entry) => entry.siteUrl?.startsWith('sc-domain:')) ?? pool[0])
    .siteUrl as string;
}

export async function searchConsoleAccessToken(
  connection: SearchConsoleConnection
): Promise<string> {
  const { clientId, clientSecret } = searchConsoleApp();
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: connection.refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const body = (await response.json()) as { access_token?: string; error_description?: string };
  if (!response.ok || !body.access_token) {
    throw new Error(
      `Google token exchange failed: ${body.error_description ?? response.status}. Reconnect Search Console from the Presence screen.`
    );
  }
  return body.access_token;
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * One dimension set, paged to exhaustion.
 *
 * `date` is always the first dimension so a single request covers the whole
 * window — asking day by day would multiply the request count by thirty for
 * exactly the same rows.
 */
async function query(
  token: string,
  siteUrl: string,
  dimensions: string[],
  startDate: string,
  endDate: string
): Promise<SearchRow[]> {
  const rows: SearchRow[] = [];
  let startRow = 0;

  for (;;) {
    const response = await fetch(
      `${API}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate,
          dimensions,
          rowLimit: PAGE_SIZE,
          startRow,
          dataState: 'all',
        }),
      }
    );

    if (!response.ok) {
      const detail = await response.text();
      if (response.status === 403) {
        throw new Error(
          `Google refused ${dimensions.join('+')}: the connected account may no longer have access to ${siteUrl}.`
        );
      }
      throw new Error(`Search Console rejected ${dimensions.join('+')}: ${detail.slice(0, 200)}`);
    }

    const body = (await response.json()) as { rows?: SearchRow[] };
    const batch = body.rows ?? [];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    startRow += batch.length;
  }

  return rows;
}

/**
 * Position is an average and clicks are a count, so they cannot be stored the
 * same way. Impressions and clicks go in the real columns where they can be
 * summed; position goes to `extra`, where nothing will be tempted to add it up.
 */
function toStatRows(
  sql: postgres.Sql,
  rows: SearchRow[],
  level: string,
  hasEntity: boolean
): PlatformStatRow[] {
  return rows
    .filter((row) => row.keys?.length)
    .map((row) => {
      const [day, entity] = row.keys as string[];
      return {
        day,
        channel: CHANNEL,
        level,
        entity_id: hasEntity ? (entity ?? '') : '',
        entity_name: hasEntity ? (entity ?? null) : null,
        parent_name: null,
        segment: '',
        impressions: Math.round(row.impressions ?? 0),
        clicks: Math.round(row.clicks ?? 0),
        cost_cents: 0,
        conversions: 0,
        conversion_value_cents: 0,
        extra: sql.json({
          position: row.position ? Number(row.position.toFixed(2)) : null,
          ctr: row.ctr ? Number((row.ctr * 100).toFixed(2)) : 0,
        } as never),
        source: SOURCE,
      };
    });
}

/**
 * The key wins over the Connect button when both are present.
 *
 * Not a preference so much as an ordering that cannot surprise anybody: a
 * service account has no expiry and no consent to withdraw, so if one has been
 * configured it is the connection that will still be working in six months.
 * Leaving a stale OAuth token in front of it would mean the integration breaks
 * on a schedule for no reason anyone could see.
 */
async function authorise(): Promise<{ token: string; siteUrl: string; via: string }> {
  const key = getSearchConsoleServiceAccount();
  if (key) {
    const token = await serviceAccountToken(key);
    return { token, siteUrl: await discoverSite(token), via: `service account ${key.client_email}` };
  }

  const connection = await getSearchConsoleConnection();
  if (!connection) throw new Error('Search Console is not connected.');
  return {
    token: await searchConsoleAccessToken(connection),
    siteUrl: connection.siteUrl,
    via: 'connected account',
  };
}

/** Oldest day already collected, so a run knows whether to keep reaching back. */
async function earliestStoredDay(sql: postgres.Sql): Promise<string | null> {
  const [row] = (await sql`
    select min(day)::text as day from platform_stats where channel = ${CHANNEL}
  `) as unknown as { day: string | null }[];
  return row?.day ?? null;
}

/** One window of every dimension, ready to be written. */
async function readWindow(
  sql: postgres.Sql,
  token: string,
  siteUrl: string,
  startDate: string,
  endDate: string
): Promise<PlatformStatRow[]> {
  // Three reads rather than one three-dimensional read. Google applies its
  // privacy threshold per request, so date+query and date+page each keep rows
  // that a combined date+query+page request would drop, and the site total is
  // the only figure that includes the queries withheld from both.
  const [totals, queries, pages] = await Promise.all([
    query(token, siteUrl, ['date'], startDate, endDate),
    query(token, siteUrl, ['date', 'query'], startDate, endDate),
    query(token, siteUrl, ['date', 'page'], startDate, endDate),
  ]);

  return [
    ...toStatRows(sql, totals, 'search_total', false),
    ...toStatRows(sql, queries, 'search_query', true),
    ...toStatRows(sql, pages, 'search_page', true),
  ];
}

export async function importSearchConsole(
  sql: postgres.Sql,
  days = 30
): Promise<ImportOutcome> {
  if (!getSearchConsoleServiceAccount() && !(await getSearchConsoleConnection())) {
    return {
      ok: false,
      channel: CHANNEL,
      rows: 0,
      skipped: 'Search Console is not connected.',
    };
  }

  const today = new Date();
  const dayBefore = (n: number) => isoDay(new Date(today.getTime() - n * 86_400_000));

  try {
    const { token, siteUrl } = await authorise();

    // The recent window every night, because Google restates it.
    let rows = await readWindow(sql, token, siteUrl, dayBefore(days), dayBefore(0));

    // And one slice further back, until sixteen months are in hand.
    let note: string | undefined;
    const earliest = await earliestStoredDay(sql);
    const horizon = dayBefore(HISTORY_TARGET_DAYS);

    if (earliest && earliest > horizon) {
      const chunkEnd = earliest;
      const chunkStart =
        isoDay(new Date(Date.parse(earliest) - BACKFILL_CHUNK_DAYS * 86_400_000)) < horizon
          ? horizon
          : isoDay(new Date(Date.parse(earliest) - BACKFILL_CHUNK_DAYS * 86_400_000));

      rows = rows.concat(await readWindow(sql, token, siteUrl, chunkStart, chunkEnd));
      note =
        chunkStart === horizon
          ? `Filled history back to ${chunkStart} — the full sixteen months Google keeps.`
          : `Reached back to ${chunkStart}; still filling towards ${horizon}.`;
    }

    const written = await upsertPlatformStats(sql, rows);
    return { ok: true, channel: CHANNEL, rows: written, note };
  } catch (error) {
    return {
      ok: false,
      channel: CHANNEL,
      rows: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
