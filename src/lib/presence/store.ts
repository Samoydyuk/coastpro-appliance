import type postgres from 'postgres';

/**
 * Where the business appears when it is not the website.
 *
 * A map listing, a Yelp page and an Instagram profile are the same kind of
 * thing as an ad campaign for reporting purposes: a surface somebody else owns,
 * reporting on itself, one row per day. So they live in `platform_stats`
 * alongside the ad channels rather than in tables of their own — the wide-table
 * note in the schema already argued that case and it holds here.
 *
 * The rule from that note holds too, and matters more here: what a platform
 * says about itself is never added to the first-party tables. Google's "calls"
 * is a tap on a button it rendered; `calls` is a phone that actually rang. Both
 * are worth seeing. Summing them would double-count the same customer.
 *
 * WHAT CAN AND CANNOT BE FETCHED. Half of these have no API a single-location
 * business can use, and pretending otherwise would produce importers that never
 * run and screens that are silently empty:
 *
 *   Google Business Profile — real API, needs a Cloud project and Google's
 *     approval on the Business Profile APIs. Automated once that lands.
 *   Instagram + Facebook — Meta Graph API. Automated once there is an app,
 *     a linked Page and a long-lived token.
 *   Yelp — Fusion API returns public business data, not owner analytics. The
 *     numbers exist only in the Yelp for Business dashboard. Manual.
 *   Apple Business Connect — the API is aimed at chains and aggregators. For
 *     one location, the dashboard is it. Manual.
 *
 * So every channel here declares whether it can be pulled, and the screen shows
 * how old each number is. A figure typed in three weeks ago must not look like
 * one fetched this morning.
 */

export interface PresenceMeasure {
  /** Column on `platform_stats`, or a key inside its `extra` object. */
  key: string;
  label: string;
  /** Shown under the number where the name alone would mislead. */
  hint?: string;
}

export interface PresenceChannel {
  key: string;
  name: string;
  /** False where the numbers can only be copied out of a dashboard by hand. */
  automated: boolean;
  /** What `source` its rows carry, so a stale importer is attributable. */
  source: string;
  /** Why it is manual, said on the screen rather than buried here. */
  manualReason?: string;
  measures: PresenceMeasure[];
}

/**
 * `impressions` and `clicks` map onto the table's own columns; everything else
 * is read out of `extra`. Which measure earns a column is decided by what every
 * platform has in common, not by what any one of them calls important.
 */
export const PRESENCE_CHANNELS: PresenceChannel[] = [
  {
    key: 'google_business',
    name: 'Google Business Profile',
    automated: true,
    source: 'gbp_api',
    measures: [
      { key: 'impressions', label: 'Views', hint: 'Search and Maps, desktop and mobile' },
      { key: 'calls', label: 'Calls' },
      { key: 'directions', label: 'Directions' },
      { key: 'clicks', label: 'Website clicks' },
      { key: 'bookings', label: 'Bookings' },
      { key: 'conversations', label: 'Messages' },
    ],
  },
  {
    key: 'apple_maps',
    name: 'Apple Business Connect',
    automated: false,
    source: 'manual_entry',
    manualReason: 'Apple’s API is for chains and aggregators; a single place card reports only in the dashboard.',
    measures: [
      { key: 'impressions', label: 'Views' },
      { key: 'calls', label: 'Taps to call' },
      { key: 'directions', label: 'Directions' },
      { key: 'clicks', label: 'Website taps' },
    ],
  },
  {
    key: 'yelp_profile',
    name: 'Yelp',
    automated: false,
    source: 'manual_entry',
    manualReason: 'The Fusion API returns public business data, not owner analytics. These live only in Yelp for Business.',
    measures: [
      { key: 'impressions', label: 'Page views' },
      { key: 'leads', label: 'Leads' },
      { key: 'calls', label: 'Calls' },
      { key: 'clicks', label: 'Website clicks' },
      { key: 'reviews', label: 'Reviews', hint: 'Total on the profile, not new ones' },
    ],
  },
  {
    key: 'instagram',
    name: 'Instagram',
    automated: true,
    source: 'meta_api',
    measures: [
      { key: 'impressions', label: 'Impressions' },
      { key: 'reach', label: 'Reach', hint: 'People, not views' },
      { key: 'profileViews', label: 'Profile views' },
      { key: 'clicks', label: 'Website taps' },
      { key: 'followers', label: 'Followers', hint: 'Total on the day, not new ones' },
    ],
  },
  {
    key: 'facebook',
    name: 'Facebook',
    automated: true,
    source: 'meta_api',
    measures: [
      { key: 'impressions', label: 'Impressions' },
      { key: 'reach', label: 'Reach' },
      { key: 'profileViews', label: 'Page views' },
      { key: 'clicks', label: 'Website clicks' },
      { key: 'followers', label: 'Followers' },
    ],
  },
];

export const PRESENCE_CHANNEL_KEYS = PRESENCE_CHANNELS.map((c) => c.key);

export function presenceChannel(key: string): PresenceChannel | undefined {
  return PRESENCE_CHANNELS.find((c) => c.key === key);
}

/** One day of one profile. `level` is always `profile` for these. */
export interface PresenceRow {
  day: string;
  channel: string;
  /** The platform's location or account id. Empty where there is only one. */
  entityId?: string;
  entityName?: string;
  impressions?: number;
  clicks?: number;
  /** Everything the platform reports that is peculiar to it. */
  extra?: Record<string, number | string | null>;
  source: string;
}

const whole = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : 0;
};

/**
 * Upsert into `platform_stats`.
 *
 * Shared with the push endpoint rather than written twice: the conflict clause
 * is the part that has to stay identical, because a re-sent day must overwrite
 * and never accumulate. Platforms restate the last day or two after the fact,
 * and every importer here deliberately re-fetches a rolling window.
 */
export interface PlatformStatRow {
  day: string;
  channel: string;
  level: string;
  entity_id: string;
  entity_name: string | null;
  parent_name: string | null;
  segment: string;
  impressions: number;
  clicks: number;
  cost_cents: number;
  conversions: number;
  conversion_value_cents: number;
  // Whatever `sql.json(...)` hands back — the driver's own parameter wrapper,
  // not a plain object. Named through the driver rather than widened to
  // `unknown`, because `sql(rows, ...columns)` will not take a column it cannot
  // serialise and that error is much clearer here than at the call site.
  extra: ReturnType<postgres.Sql['json']> | null;
  source: string;
}

export async function upsertPlatformStats(
  sql: postgres.Sql,
  rows: PlatformStatRow[]
): Promise<number> {
  if (!rows.length) return 0;

  const columns = [
    'day',
    'channel',
    'level',
    'entity_id',
    'entity_name',
    'parent_name',
    'segment',
    'impressions',
    'clicks',
    'cost_cents',
    'conversions',
    'conversion_value_cents',
    'extra',
    'source',
  ] as const;

  // Chunked so a single statement never carries thousands of parameters.
  for (let start = 0; start < rows.length; start += 500) {
    const chunk = rows.slice(start, start + 500);
    await sql`
      insert into platform_stats ${sql(chunk, ...columns)}
      on conflict (day, channel, level, entity_id, segment) do update set
        entity_name            = excluded.entity_name,
        parent_name            = excluded.parent_name,
        impressions            = excluded.impressions,
        clicks                 = excluded.clicks,
        cost_cents             = excluded.cost_cents,
        conversions            = excluded.conversions,
        conversion_value_cents = excluded.conversion_value_cents,
        extra                  = excluded.extra,
        source                 = excluded.source,
        updated_at             = now()
    `;
  }

  return rows.length;
}

/** Turn the friendly shape above into the table's shape. */
export async function writePresenceRows(
  sql: postgres.Sql,
  rows: PresenceRow[]
): Promise<number> {
  return upsertPlatformStats(
    sql,
    rows.map((row) => ({
      day: row.day,
      channel: row.channel,
      level: 'profile',
      entity_id: (row.entityId ?? '').slice(0, 300),
      entity_name: row.entityName ?? null,
      parent_name: null,
      segment: '',
      impressions: whole(row.impressions),
      clicks: whole(row.clicks),
      // A listing has no spend of its own. Advertising on the same platform
      // arrives on its own channel — `yelp_ads` is not `yelp_profile` — so
      // these stay zero rather than borrowing a number from next door.
      cost_cents: 0,
      conversions: 0,
      conversion_value_cents: 0,
      extra: row.extra ? sql.json(row.extra as Record<string, never>) : null,
      source: row.source,
    }))
  );
}

/** Days back to re-fetch each run, because platforms restate recent figures. */
export const PRESENCE_LOOKBACK_DAYS = 30;

/** `YYYY-MM-DD` for a date offset from today, in UTC. */
export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function lookbackWindow(days = PRESENCE_LOOKBACK_DAYS, now = new Date()) {
  const to = new Date(now);
  const from = new Date(now);
  from.setUTCDate(from.getUTCDate() - days);
  return { from: dayKey(from), to: dayKey(to) };
}
