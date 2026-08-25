import { writePresenceRows, lookbackWindow, type PresenceRow } from './store';
import { getGoogleConnection, type GoogleConnection } from './credentials';
import type postgres from 'postgres';

/**
 * Google Business Profile — the only listing here with a usable API.
 *
 * Separate OAuth credentials from the Google Ads ones in `conversions.ts`, and
 * deliberately so: this needs the `business.manage` scope on an account that
 * manages the listing, which is a different consent to the one that writes
 * conversions into an ad account. Sharing a refresh token between them would
 * mean one revocation taking out both.
 *
 * ACCESS. The Business Profile APIs are not on by default. They need a Cloud
 * project, the APIs enabled, and a request through Google's access form, which
 * has historically taken days to weeks. Until that lands every call here comes
 * back 403, so the importer reports "not configured" rather than throwing — a
 * missing approval is a normal state for months, not an incident.
 *
 * WHAT THE NUMBERS ARE. `CALL_CLICKS` is a tap on the call button, not a
 * conversation: Google cannot see whether the phone was answered. The `calls`
 * table can. Both are kept, and they are not the same number.
 */

const PERFORMANCE_API = 'https://businessprofileperformance.googleapis.com/v1';

/**
 * Impressions are reported split four ways and are only useful added up; the
 * split is kept in `extra` for anyone who wants to know whether the listing is
 * found in Maps or in Search, which is a genuinely different question.
 */
const IMPRESSION_METRICS = [
  'BUSINESS_IMPRESSIONS_DESKTOP_MAPS',
  'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH',
  'BUSINESS_IMPRESSIONS_MOBILE_MAPS',
  'BUSINESS_IMPRESSIONS_MOBILE_SEARCH',
] as const;

const ACTION_METRICS = [
  'CALL_CLICKS',
  'WEBSITE_CLICKS',
  'BUSINESS_DIRECTION_REQUESTS',
  'BUSINESS_BOOKINGS',
  'BUSINESS_CONVERSATIONS',
] as const;

const ALL_METRICS = [...IMPRESSION_METRICS, ...ACTION_METRICS];

interface DatedValue {
  date?: { year?: number; month?: number; day?: number };
  /** Omitted entirely on zero days, which is why it is optional. */
  value?: string;
}

interface MetricSeries {
  dailyMetric?: string;
  timeSeries?: { datedValues?: DatedValue[] };
}

export interface ImportOutcome {
  ok: boolean;
  channel: string;
  rows: number;
  /** Set when the importer could not run at all, as opposed to running empty. */
  skipped?: string;
  error?: string;
  /** Anything worth reading in the run log — what a run did beyond the count. */
  note?: string;
}

async function accessToken(connection: GoogleConnection): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GBP_CLIENT_ID ?? '',
      client_secret: process.env.GBP_CLIENT_SECRET ?? '',
      refresh_token: connection.refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const body = (await response.json()) as { access_token?: string; error_description?: string };
  if (!response.ok || !body.access_token) {
    // `invalid_grant` here means the consent was withdrawn or the password
    // changed. Named, because the fix is pressing Connect again and no amount
    // of waiting will do it.
    throw new Error(
      `Google token exchange failed: ${body.error_description ?? response.status}. Reconnect the account from the Presence screen.`
    );
  }
  return body.access_token;
}

function dateParts(day: string) {
  const [year, month, date] = day.split('-').map(Number);
  return { year, month, day: date };
}

/** A dated value with no `value` field means zero, not missing. */
function seriesToDays(series: MetricSeries[]): Map<string, Record<string, number>> {
  const byDay = new Map<string, Record<string, number>>();

  for (const entry of series) {
    const metric = entry.dailyMetric;
    if (!metric) continue;
    for (const point of entry.timeSeries?.datedValues ?? []) {
      const { year, month, day } = point.date ?? {};
      if (!year || !month || !day) continue;
      const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const row = byDay.get(key) ?? {};
      row[metric] = Number(point.value ?? 0) || 0;
      byDay.set(key, row);
    }
  }

  return byDay;
}

export async function importGoogleBusinessProfile(
  sql: postgres.Sql,
  days?: number
): Promise<ImportOutcome> {
  const connection = await getGoogleConnection();
  if (!connection) {
    return {
      ok: true,
      channel: 'google_business',
      rows: 0,
      skipped: 'No Business Profile account connected — use Connect on the Presence screen.',
    };
  }

  try {
    const { from, to } = lookbackWindow(days);
    const token = await accessToken(connection);
    const locationPath = () => connection.locationId;

    const params = new URLSearchParams();
    ALL_METRICS.forEach((metric) => params.append('dailyMetrics', metric));
    const start = dateParts(from);
    const end = dateParts(to);
    params.set('dailyRange.start_date.year', String(start.year));
    params.set('dailyRange.start_date.month', String(start.month));
    params.set('dailyRange.start_date.day', String(start.day));
    params.set('dailyRange.end_date.year', String(end.year));
    params.set('dailyRange.end_date.month', String(end.month));
    params.set('dailyRange.end_date.day', String(end.day));

    const url = `${PERFORMANCE_API}/${locationPath()}:fetchMultiDailyMetricsTimeSeries?${params}`;
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

    if (!response.ok) {
      const detail = await response.text();
      // 403 while the access request is still queued is the expected state,
      // not a failure worth alarming about.
      if (response.status === 403) {
        return {
          ok: true,
          channel: 'google_business',
          rows: 0,
          skipped: 'Google returned 403 — the Business Profile API access request is probably still pending.',
        };
      }
      throw new Error(`Performance API ${response.status}: ${detail.slice(0, 300)}`);
    }

    const body = (await response.json()) as {
      multiDailyMetricTimeSeries?: Array<{ dailyMetricTimeSeries?: MetricSeries[] }>;
    };

    const series = (body.multiDailyMetricTimeSeries ?? []).flatMap(
      (entry) => entry.dailyMetricTimeSeries ?? []
    );
    const byDay = seriesToDays(series);

    const rows: PresenceRow[] = [];
    for (const [day, metrics] of byDay) {
      const impressions = IMPRESSION_METRICS.reduce((sum, m) => sum + (metrics[m] ?? 0), 0);
      rows.push({
        day,
        channel: 'google_business',
        entityId: locationPath(),
        entityName: 'Google Business Profile',
        impressions,
        clicks: metrics.WEBSITE_CLICKS ?? 0,
        extra: {
          calls: metrics.CALL_CLICKS ?? 0,
          directions: metrics.BUSINESS_DIRECTION_REQUESTS ?? 0,
          bookings: metrics.BUSINESS_BOOKINGS ?? 0,
          conversations: metrics.BUSINESS_CONVERSATIONS ?? 0,
          impressionsMapsMobile: metrics.BUSINESS_IMPRESSIONS_MOBILE_MAPS ?? 0,
          impressionsMapsDesktop: metrics.BUSINESS_IMPRESSIONS_DESKTOP_MAPS ?? 0,
          impressionsSearchMobile: metrics.BUSINESS_IMPRESSIONS_MOBILE_SEARCH ?? 0,
          impressionsSearchDesktop: metrics.BUSINESS_IMPRESSIONS_DESKTOP_SEARCH ?? 0,
        },
        source: 'gbp_api',
      });
    }

    const written = await writePresenceRows(sql, rows);
    return { ok: true, channel: 'google_business', rows: written };
  } catch (error) {
    return {
      ok: false,
      channel: 'google_business',
      rows: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
