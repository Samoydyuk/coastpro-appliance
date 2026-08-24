import { requireDb } from '@/lib/db';
import type { DateRange } from '@/lib/admin/range';

/**
 * Reading what Search Console wrote.
 *
 * ONE THING MATTERS MORE THAN THE REST OF THIS FILE: average position is a
 * weighted average, and `avg(position)` gives the wrong answer. A query seen
 * 400 times at position 8 and one seen twice at position 60 do not average to
 * 34 — that is what a naive mean says, and it would make the site look far
 * worse than it is. The right figure weights each row by the impressions
 * behind it, which is `sum(impressions * position) / sum(impressions)`, and it
 * is what Search Console itself reports.
 *
 * The same trap applies to click-through rate. It is total clicks over total
 * impressions, never the mean of per-row rates.
 *
 * Rows arrive from `platform_stats` at three levels written by the importer —
 * `search_total`, `search_query` and `search_page`. The totals are read
 * separately rather than summed from the queries, because Google withholds
 * low-volume queries for privacy and the query rows genuinely do not add up to
 * the site figure. Summing them would under-report, quietly and permanently.
 */

export interface SearchTotals {
  impressions: number;
  clicks: number;
  /** Impression-weighted, as above. Null when there were no impressions. */
  position: number | null;
  ctr: number;
}

export interface SearchTermRow {
  term: string;
  impressions: number;
  clicks: number;
  position: number | null;
  ctr: number;
  /** Same figure over the previous window, for movement. Null when new. */
  previousPosition: number | null;
  previousImpressions: number;
}

export interface SearchDay {
  day: string;
  impressions: number;
  clicks: number;
  position: number | null;
}

export interface SearchReport {
  connected: boolean;
  totals: SearchTotals;
  previousTotals: SearchTotals;
  queries: SearchTermRow[];
  pages: SearchTermRow[];
  days: SearchDay[];
  lastDay: string | null;
  lastUpdated: string | null;
  /** Queries with impressions but no clicks — seen, never chosen. */
  seenNeverClicked: number;
}

interface RawRow {
  entity_id: string;
  impressions: string | number;
  clicks: string | number;
  position: number | null;
}

const num = (value: string | number | null | undefined): number => {
  const n = typeof value === 'string' ? Number(value) : (value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

/**
 * `position` lives inside `extra` because it is an average and does not belong
 * in a column anything might sum. Pulled out here as a number so the weighting
 * can happen in SQL rather than over thousands of rows in memory.
 */
async function levelRows(level: string, from: Date, to: Date): Promise<RawRow[]> {
  const sql = requireDb();
  return (await sql`
    select entity_id,
           sum(impressions)::bigint                                    as impressions,
           sum(clicks)::bigint                                         as clicks,
           case
             when sum(impressions) filter (where extra ->> 'position' is not null) > 0
             then round(
               sum(impressions * (extra ->> 'position')::numeric)
                 filter (where extra ->> 'position' is not null)
               / sum(impressions) filter (where extra ->> 'position' is not null),
               1
             )::float8
             else null
           end                                                         as position
    from platform_stats
    where channel = 'google_search'
      and level = ${level}
      and day >= ${from}::date
      and day <  ${to}::date
    group by entity_id
    order by impressions desc
  `) as unknown as RawRow[];
}

function totalsOf(rows: RawRow[]): SearchTotals {
  let impressions = 0;
  let clicks = 0;
  let weighted = 0;
  let weight = 0;

  for (const row of rows) {
    const shown = num(row.impressions);
    impressions += shown;
    clicks += num(row.clicks);
    if (row.position !== null && shown > 0) {
      weighted += row.position * shown;
      weight += shown;
    }
  }

  return {
    impressions,
    clicks,
    position: weight > 0 ? Number((weighted / weight).toFixed(1)) : null,
    ctr: impressions > 0 ? clicks / impressions : 0,
  };
}

function toTerms(current: RawRow[], previous: RawRow[], limit: number): SearchTermRow[] {
  const before = new Map(previous.map((row) => [row.entity_id, row]));

  return current.slice(0, limit).map((row) => {
    const impressions = num(row.impressions);
    const clicks = num(row.clicks);
    const was = before.get(row.entity_id);
    return {
      term: row.entity_id,
      impressions,
      clicks,
      position: row.position,
      ctr: impressions > 0 ? clicks / impressions : 0,
      previousPosition: was?.position ?? null,
      previousImpressions: was ? num(was.impressions) : 0,
    };
  });
}

async function dailyRows(from: Date, to: Date): Promise<SearchDay[]> {
  const sql = requireDb();
  const rows = (await sql`
    select day::text                        as day,
           impressions,
           clicks,
           (extra ->> 'position')::float8   as position
    from platform_stats
    where channel = 'google_search'
      and level = 'search_total'
      and day >= ${from}::date
      and day <  ${to}::date
    order by day
  `) as unknown as Array<{
    day: string;
    impressions: string | number;
    clicks: string | number;
    position: number | null;
  }>;

  return rows.map((row) => ({
    day: row.day,
    impressions: num(row.impressions),
    clicks: num(row.clicks),
    position: row.position,
  }));
}

export async function getSearchReport(range: DateRange, limit = 50): Promise<SearchReport> {
  const sql = requireDb();

  const [
    totalRows,
    previousTotalRows,
    queryRows,
    previousQueryRows,
    pageRows,
    previousPageRows,
    days,
    meta,
  ] = await Promise.all([
    levelRows('search_total', range.from, range.to),
    levelRows('search_total', range.previousFrom, range.previousTo),
    levelRows('search_query', range.from, range.to),
    levelRows('search_query', range.previousFrom, range.previousTo),
    levelRows('search_page', range.from, range.to),
    levelRows('search_page', range.previousFrom, range.previousTo),
    dailyRows(range.from, range.to),
    sql`
      select max(day)::text        as last_day,
             max(updated_at)::text as last_updated
      from platform_stats
      where channel = 'google_search'
    ` as unknown as Promise<Array<{ last_day: string | null; last_updated: string | null }>>,
  ]);

  return {
    connected: Boolean(meta[0]?.last_day),
    totals: totalsOf(totalRows),
    previousTotals: totalsOf(previousTotalRows),
    queries: toTerms(queryRows, previousQueryRows, limit),
    pages: toTerms(pageRows, previousPageRows, limit),
    days,
    lastDay: meta[0]?.last_day ?? null,
    lastUpdated: meta[0]?.last_updated ?? null,
    seenNeverClicked: queryRows.filter((row) => num(row.impressions) > 0 && num(row.clicks) === 0)
      .length,
  };
}
