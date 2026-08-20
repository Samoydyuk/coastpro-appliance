import { requireDb } from '@/lib/db';
import type { DateRange } from '@/lib/admin/range';
import { PRESENCE_CHANNELS, type PresenceChannel } from '@/lib/presence/store';

/**
 * What the map listings, directory pages and social profiles reported.
 *
 * Read straight out of `platform_stats` at the `profile` grain, and never
 * joined to the first-party tables. The reason is the one the schema already
 * gives: Google's "calls" is a tap on a button it drew, `calls` is a phone that
 * rang. Putting them in one row would invite adding them.
 *
 * `extra` is unpacked here rather than in SQL. The interesting fields differ by
 * platform — Yelp has leads, Instagram has followers, Apple has neither — and a
 * query that knew about all of them would need editing every time one changed
 * its mind about what it reports.
 */

export interface PresenceDay {
  day: string;
  impressions: number;
  clicks: number;
  extra: Record<string, number | null>;
}

export interface PresenceChannelSummary {
  channel: PresenceChannel;
  /** Summed across the range; `followers`-style running totals take the last. */
  totals: Record<string, number>;
  previousTotals: Record<string, number>;
  days: PresenceDay[];
  /** When a row for this channel was last written, whoever wrote it. */
  lastUpdated: string | null;
  /** `gbp_api` | `meta_api` | `manual_entry`, as last recorded. */
  lastSource: string | null;
  /** Most recent day that actually has a row, which is not the same thing. */
  lastDay: string | null;
  hasData: boolean;
}

/** Measures that are a running total on the day, not a count of that day. */
const RUNNING_TOTALS = new Set(['followers', 'reviews']);

interface Row {
  channel: string;
  day: string;
  impressions: string | number;
  clicks: string | number;
  extra: Record<string, unknown> | null;
  updated_at: string;
  source: string;
}

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function accumulate(channel: PresenceChannel, days: PresenceDay[]): Record<string, number> {
  const totals: Record<string, number> = {};

  for (const measure of channel.measures) {
    if (RUNNING_TOTALS.has(measure.key)) {
      // Take the newest day that actually carries a figure. Summing follower
      // counts across thirty days would report thirty times the audience.
      const latest = [...days]
        .reverse()
        .find((d) => d.extra[measure.key] !== null && d.extra[measure.key] !== undefined);
      totals[measure.key] = latest ? num(latest.extra[measure.key]) : 0;
      continue;
    }

    totals[measure.key] = days.reduce((sum, d) => {
      if (measure.key === 'impressions') return sum + d.impressions;
      if (measure.key === 'clicks') return sum + d.clicks;
      return sum + num(d.extra[measure.key]);
    }, 0);
  }

  return totals;
}

async function fetchRows(from: Date, to: Date): Promise<Row[]> {
  const sql = requireDb();
  return (await sql`
    select channel,
           day::text            as day,
           impressions,
           clicks,
           extra,
           updated_at::text     as updated_at,
           source
    from platform_stats
    where level = 'profile'
      and day >= ${from}::date
      and day <  ${to}::date
    order by channel, day
  `) as unknown as Row[];
}

function toDays(rows: Row[]): PresenceDay[] {
  return rows.map((row) => ({
    day: row.day,
    impressions: num(row.impressions),
    clicks: num(row.clicks),
    extra: (row.extra ?? {}) as Record<string, number | null>,
  }));
}

export async function getPresence(range: DateRange): Promise<PresenceChannelSummary[]> {
  const [current, previous] = await Promise.all([
    fetchRows(range.from, range.to),
    fetchRows(range.previousFrom, range.previousTo),
  ]);

  return PRESENCE_CHANNELS.map((channel) => {
    const mine = current.filter((r) => r.channel === channel.key);
    const theirs = previous.filter((r) => r.channel === channel.key);
    const days = toDays(mine);

    // Freshness is about the whole channel, not this range: a listing last
    // written three weeks ago is stale even when the range is last week.
    const newest = mine.length ? mine[mine.length - 1] : null;

    return {
      channel,
      totals: accumulate(channel, days),
      previousTotals: accumulate(channel, toDays(theirs)),
      days,
      lastUpdated: newest?.updated_at ?? null,
      lastSource: newest?.source ?? null,
      lastDay: newest?.day ?? null,
      hasData: mine.length > 0,
    };
  });
}

/** The last time each automated importer ran, and whether it complained. */
export async function getPresenceImportRuns(limit = 8) {
  const sql = requireDb();
  return (await sql`
    select source,
           started_at::text  as started_at,
           finished_at::text as finished_at,
           rows_written,
           error
    from import_runs
    where source in ('gbp_api', 'meta_api', 'manual_entry')
    order by started_at desc
    limit ${limit}
  `) as unknown as Array<{
    source: string;
    started_at: string;
    finished_at: string | null;
    rows_written: number | null;
    error: string | null;
  }>;
}
