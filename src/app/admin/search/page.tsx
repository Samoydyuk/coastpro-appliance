import Link from 'next/link';
import { parseRange } from '@/lib/admin/range';
import { getSearchReport, type SearchTermRow } from '@/lib/admin/search-queries';
import { count, delta, percent, shortDate } from '@/lib/admin/format';
import {
  Empty,
  Hint,
  Panel,
  SetupNotice,
  StatTile,
  Table,
  Td,
  Th,
  Warning,
} from '@/components/admin/ui';
import { TimeSeries } from '@/components/admin/charts';
import { SERIES, STATUS } from '@/components/admin/palette';

export const dynamic = 'force-dynamic';

/**
 * Everything that happens before a visit exists.
 *
 * The rest of this console starts at the moment somebody arrives. This screen
 * is the only one that can see the far larger number of people who searched,
 * were shown the site, and went elsewhere — and which words they used. Losing
 * at position 38 and never being shown at all look identical from the traffic
 * side; here they are different problems with different fixes.
 *
 * The panel that earns the screen is "closest to the first page". Impressions
 * spread thinly across a hundred queries at position 40 are not worth chasing;
 * a query already at 9 with real volume is one or two links away from being
 * worth several times its current traffic. That distinction is invisible in
 * every other view.
 */

/** Search positions run backwards — 3 is better than 30, so movement inverts. */
function positionMove(row: SearchTermRow): { text: string; colour?: string } | null {
  if (row.position === null || row.previousPosition === null) return null;
  const move = row.previousPosition - row.position;
  if (Math.abs(move) < 0.5) return { text: 'held' };
  return move > 0
    ? { text: `up ${move.toFixed(1)}`, colour: STATUS.good }
    : { text: `down ${Math.abs(move).toFixed(1)}`, colour: STATUS.critical };
}

function TermTable({ rows, heading }: { rows: SearchTermRow[]; heading: string }) {
  if (rows.length === 0) return <Empty>Nothing recorded for this period yet.</Empty>;

  return (
    <Table>
      <thead>
        <tr>
          <Th>{heading}</Th>
          <Th numeric>Shown</Th>
          <Th numeric>Clicks</Th>
          <Th numeric>Click rate</Th>
          <Th numeric>Position</Th>
          <Th numeric>Change</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const move = positionMove(row);
          return (
            <tr key={row.term}>
              <Td className="max-w-[340px] truncate">{row.term}</Td>
              <Td numeric>{count(row.impressions)}</Td>
              <Td numeric>{count(row.clicks)}</Td>
              <Td numeric>{percent(row.ctr, 1)}</Td>
              <Td numeric>{row.position === null ? '—' : row.position.toFixed(1)}</Td>
              <Td numeric>
                {move ? (
                  <span style={{ color: move.colour }}>{move.text}</span>
                ) : (
                  <span className="text-gray-400">new</span>
                )}
              </Td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const range = parseRange({
    range: searchParams.range as string,
    from: searchParams.from as string,
    to: searchParams.to as string,
  });

  try {
    const report = await getSearchReport(range);
    const { totals, previousTotals } = report;

    // Already on the board, not yet on the first page. Below four there is
    // little left to win, and past twenty-five a single query is not moving
    // without work this panel cannot tell you about.
    const nearlyThere = report.queries
      .filter((row) => row.position !== null && row.position >= 4 && row.position <= 25)
      .filter((row) => row.impressions >= 5)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 15);

    /**
     * Google reports search data two to three days behind, so a range sitting
     * inside that gap shows near-zero and reads as a catastrophe. Naming it is
     * the difference between a lag and a panic — and on "Today" the whole range
     * is inside the gap, which is worth saying more loudly than on a month.
     */
    const LAG_DAYS = 3;
    const lagEdge = new Date(Date.now() - LAG_DAYS * 86_400_000);
    const lagged: 'all' | 'edge' | null =
      range.from >= lagEdge ? 'all' : range.to >= lagEdge ? 'edge' : null;

    const points = report.days.map((day) => ({
      label: shortDate(day.day),
      values: { impressions: day.impressions, clicks: day.clicks },
    }));

    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-xl font-bold uppercase tracking-label text-ink">
            Search
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {range.label}
            {report.lastDay ? ` · Google has data through ${report.lastDay}` : ''}
          </p>
        </div>

        {report.connected && lagged !== null && (
          <Warning>
            {lagged === 'all'
              ? 'Google reports search data two to three days late, and this range is almost entirely inside that gap — the near-zero figures below are the lag, not a collapse in traffic. Pick a wider range to see anything meaningful.'
              : 'The last two or three days of this range are still filling in. Google restates them as it finalises, so the right-hand edge of the chart will rise over the next few days.'}
          </Warning>
        )}

        {!report.connected && (
          <Warning>
            Search Console is not connected, so none of this has any numbers behind it yet. Connect
            it on{' '}
            <Link href="/admin/presence" className="underline">
              Presence
            </Link>
            .
          </Warning>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Times shown"
            value={count(totals.impressions)}
            change={delta(totals.impressions, previousTotals.impressions)}
            hint="appearances in search results"
            emphasis
          />
          <StatTile
            label="Clicks from search"
            value={count(totals.clicks)}
            change={delta(totals.clicks, previousTotals.clicks)}
            hint="people who chose us"
            emphasis
          />
          <StatTile
            label="Average position"
            value={totals.position === null ? '—' : totals.position.toFixed(1)}
            change={
              totals.position !== null && previousTotals.position !== null
                ? delta(previousTotals.position, totals.position)
                : null
            }
            hint="weighted by how often each query ran"
            emphasis
          />
          <StatTile
            label="Click rate"
            value={percent(totals.ctr, 2)}
            change={delta(totals.ctr, previousTotals.ctr)}
            hint={`${report.seenNeverClicked} queries shown but never clicked`}
            emphasis
          />
        </div>

        <Panel title="Shown and clicked" subtitle="Day by day, straight from Google">
          {points.length === 0 ? (
            <Empty>No days imported yet.</Empty>
          ) : (
            <TimeSeries
              points={points}
              series={[
                { key: 'impressions', label: 'Shown', color: SERIES[0] },
                { key: 'clicks', label: 'Clicks', color: SERIES[1] },
              ]}
            />
          )}
          <Hint>
            Google restates the last few days as it finalises them, so the right-hand edge of this
            chart moves for about seventy-two hours after it first appears.
          </Hint>
        </Panel>

        <Panel
          title="Closest to the first page"
          subtitle="Real volume, positions 4 to 25 — where a small push pays"
        >
          <TermTable rows={nearlyThere} heading="Query" />
          <Hint>
            These are already ranking, just not high enough to be chosen. Almost all clicks go to
            the first page, so a query sitting at 12 with a few hundred impressions is worth far
            more attention than a new page targeting a query the site has never appeared for at
            all.
          </Hint>
        </Panel>

        <Panel title="Every query" subtitle="What people typed, most shown first">
          <TermTable rows={report.queries} heading="Query" />
          <Hint>
            Google withholds queries used by too few people to stay anonymous, which is why these
            rarely add up to the totals above. The gap is real traffic, not a fault.
          </Hint>
        </Panel>

        <Panel title="Pages earning impressions" subtitle="Which addresses search actually shows">
          <TermTable rows={report.pages} heading="Page" />
          <Hint>
            A page published and never listed here is a page Google has not found worth showing for
            anything — a different problem from one shown often and clicked rarely.
          </Hint>
        </Panel>
      </div>
    );
  } catch (error) {
    return <SetupNotice error={error} />;
  }
}
