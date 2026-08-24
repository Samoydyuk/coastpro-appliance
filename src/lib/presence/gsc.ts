import type postgres from 'postgres';
import { upsertPlatformStats, type PlatformStatRow } from '@/lib/presence/store';
import {
  getSearchConsoleConnection,
  searchConsoleApp,
  type SearchConsoleConnection,
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

interface SearchRow {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
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

export async function importSearchConsole(
  sql: postgres.Sql,
  days = 30
): Promise<ImportOutcome> {
  const connection = await getSearchConsoleConnection();
  if (!connection) {
    return {
      ok: false,
      channel: CHANNEL,
      rows: 0,
      skipped: 'Search Console is not connected.',
    };
  }

  const end = new Date();
  const start = new Date(end.getTime() - days * 86_400_000);

  try {
    const token = await searchConsoleAccessToken(connection);

    // Three reads rather than one three-dimensional read. Google applies its
    // privacy threshold per request, so date+query and date+page each keep rows
    // that a combined date+query+page request would drop, and the site total is
    // the only figure that includes the queries withheld from both.
    const [totals, queries, pages] = await Promise.all([
      query(token, connection.siteUrl, ['date'], isoDay(start), isoDay(end)),
      query(token, connection.siteUrl, ['date', 'query'], isoDay(start), isoDay(end)),
      query(token, connection.siteUrl, ['date', 'page'], isoDay(start), isoDay(end)),
    ]);

    const written = await upsertPlatformStats(sql, [
      ...toStatRows(sql, totals, 'search_total', false),
      ...toStatRows(sql, queries, 'search_query', true),
      ...toStatRows(sql, pages, 'search_page', true),
    ]);

    return { ok: true, channel: CHANNEL, rows: written };
  } catch (error) {
    return {
      ok: false,
      channel: CHANNEL,
      rows: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
