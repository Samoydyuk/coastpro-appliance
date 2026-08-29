import Link from 'next/link';
import { parseRange } from '@/lib/admin/range';
import { getSearchReport, type SearchTermRow } from '@/lib/admin/search-queries';
import { count, delta, percent, shortDate } from '@/lib/admin/format';
import { serverTranslator } from '@/lib/i18n/server';
import { numberLocale, type Lang, type Translator } from '@/lib/i18n';
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
import { SearchRefresh } from '@/components/admin/SearchRefresh';
import { SERIES, STATUS } from '@/components/admin/palette';
import { rangeLabel } from '@/lib/i18n/range';

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

/** A position like `12,4`. Through `Intl` so the decimal mark follows the language. */
function place(value: number, lang: Lang): string {
  return value.toLocaleString(numberLocale(lang), {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

/** Search positions run backwards — 3 is better than 30, so movement inverts. */
function positionMove(row: SearchTermRow, t: Translator): { text: string; colour?: string } | null {
  if (row.position === null || row.previousPosition === null) return null;
  const move = row.previousPosition - row.position;
  if (Math.abs(move) < 0.5) return { text: t('marketing.search.held') };
  return move > 0
    ? { text: t('marketing.search.up', { n: place(move, t.lang) }), colour: STATUS.good }
    : {
        text: t('marketing.search.down', { n: place(Math.abs(move), t.lang) }),
        colour: STATUS.critical,
      };
}

function TermTable({
  rows,
  heading,
  t,
}: {
  rows: SearchTermRow[];
  heading: string;
  t: Translator;
}) {
  if (rows.length === 0) return <Empty>{t('marketing.search.nothingYet')}</Empty>;

  return (
    <Table>
      <thead>
        <tr>
          <Th>{heading}</Th>
          <Th numeric>{t('marketing.col.shown')}</Th>
          <Th numeric>{t('marketing.col.clicks')}</Th>
          <Th numeric>{t('marketing.col.clickRate')}</Th>
          <Th numeric>{t('marketing.col.position')}</Th>
          <Th numeric>{t('marketing.col.change')}</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const move = positionMove(row, t);
          return (
            <tr key={row.term}>
              <Td className="max-w-[340px] truncate">{row.term}</Td>
              <Td numeric>{count(row.impressions, t.lang)}</Td>
              <Td numeric>{count(row.clicks, t.lang)}</Td>
              <Td numeric>{percent(row.ctr, 1, t.lang)}</Td>
              <Td numeric>{row.position === null ? '—' : place(row.position, t.lang)}</Td>
              <Td numeric>
                {move ? (
                  <span style={{ color: move.colour }}>{move.text}</span>
                ) : (
                  <span className="text-gray-400">{t('marketing.search.new')}</span>
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
  const t = serverTranslator();

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
      label: shortDate(day.day, t.lang),
      values: { impressions: day.impressions, clicks: day.clicks },
    }));

    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-xl font-bold uppercase tracking-label text-ink">
            {t('marketing.search.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {rangeLabel(range, t)}
            {report.lastDay ? t('marketing.search.dataThrough', { day: report.lastDay }) : ''}
          </p>
        </div>

        <SearchRefresh lastDay={report.lastDay} />

        {report.connected && lagged !== null && (
          <Warning>
            {lagged === 'all'
              ? t('marketing.search.laggedAll')
              : t('marketing.search.laggedEdge')}
          </Warning>
        )}

        {!report.connected && (
          <Warning>
            {t('marketing.search.notConnectedBefore')}
            <Link href="/admin/presence" className="underline">
              {t('marketing.search.notConnectedLink')}
            </Link>
            {t('marketing.search.notConnectedAfter')}
          </Warning>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label={t('marketing.search.timesShown')}
            value={count(totals.impressions, t.lang)}
            change={delta(totals.impressions, previousTotals.impressions)}
            hint={t('marketing.search.timesShownHint')}
            emphasis
          />
          <StatTile
            label={t('marketing.search.clicksFrom')}
            value={count(totals.clicks, t.lang)}
            change={delta(totals.clicks, previousTotals.clicks)}
            hint={t('marketing.search.clicksHint')}
            emphasis
          />
          <StatTile
            label={t('marketing.search.avgPosition')}
            value={totals.position === null ? '—' : place(totals.position, t.lang)}
            change={
              totals.position !== null && previousTotals.position !== null
                ? delta(previousTotals.position, totals.position)
                : null
            }
            hint={t('marketing.search.avgPositionHint')}
            emphasis
          />
          <StatTile
            label={t('marketing.col.clickRate')}
            value={percent(totals.ctr, 2, t.lang)}
            change={delta(totals.ctr, previousTotals.ctr)}
            hint={t('marketing.search.clickRateHint', {
              queries: t.plural(report.seenNeverClicked, 'marketing.plural.query'),
            })}
            emphasis
          />
        </div>

        <Panel
          title={t('marketing.search.shownAndClicked')}
          subtitle={t('marketing.search.shownAndClickedSub')}
        >
          {points.length === 0 ? (
            <Empty>{t('marketing.search.noDays')}</Empty>
          ) : (
            <TimeSeries
              points={points}
              series={[
                { key: 'impressions', label: t('marketing.col.shown'), color: SERIES[0] },
                { key: 'clicks', label: t('marketing.col.clicks'), color: SERIES[1] },
              ]}
            />
          )}
          <Hint>{t('marketing.search.restatesHint')}</Hint>
        </Panel>

        <Panel
          title={t('marketing.search.nearly')}
          subtitle={t('marketing.search.nearlySub')}
        >
          <TermTable rows={nearlyThere} heading={t('marketing.col.query')} t={t} />
          <Hint>{t('marketing.search.nearlyHint')}</Hint>
        </Panel>

        <Panel title={t('marketing.search.every')} subtitle={t('marketing.search.everySub')}>
          <TermTable rows={report.queries} heading={t('marketing.col.query')} t={t} />
          <Hint>{t('marketing.search.everyHint')}</Hint>
        </Panel>

        <Panel title={t('marketing.search.pages')} subtitle={t('marketing.search.pagesSub')}>
          <TermTable rows={report.pages} heading={t('marketing.col.page')} t={t} />
          <Hint>{t('marketing.search.pagesHint')}</Hint>
        </Panel>
      </div>
    );
  } catch (error) {
    return <SetupNotice error={error} />;
  }
}
