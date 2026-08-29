import Link from 'next/link';
import { parseRange, SHOP_TIMEZONE } from '@/lib/admin/range';
import { getChannels, getDailySeries, getFunnel, getOverview } from '@/lib/admin/queries';
import { count, delta, duration, money, percent, shortDate } from '@/lib/admin/format';
import { channelLabel, isPaidChannel } from '@/lib/attribution';
import { numberLocale, type TranslationKey } from '@/lib/i18n';
import { serverTranslator } from '@/lib/i18n/server';
import { Empty, Hint, Panel, SetupNotice, StatTile, Table, Td, Th, Warning } from '@/components/admin/ui';
import { Funnel, RankedBars, TimeSeries } from '@/components/admin/charts';
import { SERIES, channelColor } from '@/components/admin/palette';
import { rangeLabel } from '@/lib/i18n/range';

export const dynamic = 'force-dynamic';

/**
 * The heading names the window the same way the buttons above it do, through
 * the dictionary rather than through the English label `parseRange` carries.
 * Trimming "Last 30 days" down to "30 days" in code would be a no-op in
 * Ukrainian; the picker already has both words.
 */
export default async function OverviewPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const t = serverTranslator();
  const range = parseRange({
    range: searchParams.range as string,
    from: searchParams.from as string,
    to: searchParams.to as string,
  });


  // Through Intl, or these are the only two numbers on the screen still written
  // with a full stop while every figure beside them uses a comma.
  const fixed = (value: number, digits: number) =>
    value.toLocaleString(numberLocale(t.lang), {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });

  try {
    const [{ current, previous }, series, channels, funnel] = await Promise.all([
      getOverview(range),
      getDailySeries(range),
      getChannels(range),
      getFunnel(range),
    ]);

    const requests = current.qualityLeads + current.answeredCalls;
    const previousRequests = previous.qualityLeads + previous.answeredCalls;

    const costPerLead = requests ? current.spendCents / requests : null;
    const previousCostPerLead = previousRequests ? previous.spendCents / previousRequests : null;
    // Based on what the work was actually invoiced for, not on the value
    // somebody typed when they marked the lead won. Both numbers survive; only
    // the one the return is judged on has changed.
    const roas = current.spendCents ? current.invoicedCents / current.spendCents : null;
    const leadRate = current.sessions ? current.leads / current.sessions : 0;
    const previousLeadRate = previous.sessions ? previous.leads / previous.sessions : 0;

    // How a visit actually went, which is the part a visit count never says.
    // Named `snapshot` rather than `t`, which now belongs to the translator.
    const per = (snapshot: typeof current) => ({
      pages: snapshot.sessions ? snapshot.pageviews / snapshot.sessions : 0,
      seconds: snapshot.sessions ? snapshot.engagedSeconds / snapshot.sessions : 0,
      bounce: snapshot.sessions ? snapshot.bouncedSessions / snapshot.sessions : 0,
    });
    const shape = per(current);
    const previousShape = per(previous);

    const paidWithoutSpend = channels.filter(
      (row) => isPaidChannel(row.channel) && row.spendCents === 0 && row.sessions > 0
    );

    const points = series.map((day) => ({
      label: shortDate(day.day, t.lang),
      values: {
        sessions: day.sessions,
        leads: day.leads,
        calls: day.calls,
        spend: day.spendCents / 100,
        revenue: day.invoicedCents / 100,
      },
    }));

    const junkLeads = current.leads - current.qualityLeads;

    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-xl font-bold uppercase tracking-label text-ink">
            {t('overview.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {t('overview.subtitle', {
              range: rangeLabel(range, t),
              days: t.plural(range.days, 'plural.day'),
            })}
          </p>
        </div>

        {paidWithoutSpend.length > 0 && (
          <Warning>
            {t('overview.paidNoSpend', {
              channels: paidWithoutSpend.map((row) => channelLabel(row.channel)).join(', '),
            })}{' '}
            <Link href="/admin/spend" className="underline">
              {t('overview.paidNoSpendLink')}
            </Link>
            .
          </Warning>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label={t('overview.requests')}
            value={count(requests, t.lang)}
            change={delta(requests, previousRequests)}
            hint={t('overview.requestsHint')}
            emphasis
          />
          <StatTile
            label={t('overview.costPerRequest')}
            value={costPerLead === null ? '—' : money(costPerLead, t.lang)}
            change={
              costPerLead !== null && previousCostPerLead !== null
                ? delta(costPerLead, previousCostPerLead)
                : null
            }
            higherIsBetter={false}
            hint={
              current.spendCents
                ? t('overview.costPerRequestHint', { amount: money(current.spendCents, t.lang) })
                : t('overview.noSpend')
            }
            emphasis
          />
          <StatTile
            label={t('overview.jobsWon')}
            value={count(current.won, t.lang)}
            change={delta(current.won, previous.won)}
            hint={t('overview.jobsWonHint', {
              marked: money(current.revenueCents, t.lang),
              invoiced: money(current.invoicedCents, t.lang),
            })}
            emphasis
          />
          <StatTile
            label={t('overview.roas')}
            value={roas === null ? '—' : `${fixed(roas, 2)}×`}
            hint={roas === null ? t('overview.roasNeeds') : t('overview.roasHint')}
            emphasis
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label={t('overview.visits')}
            value={count(current.sessions, t.lang)}
            change={delta(current.sessions, previous.sessions)}
            hint={t.plural(current.visitors, 'overview.person')}
          />
          <StatTile
            label={t('overview.formLeads')}
            value={count(current.leads, t.lang)}
            change={delta(current.leads, previous.leads)}
            hint={junkLeads > 0 ? t.plural(junkLeads, 'overview.dupe') : t('overview.allClean')}
          />
          <StatTile
            label={t('overview.calls')}
            value={count(current.calls, t.lang)}
            change={delta(current.calls, previous.calls)}
            hint={t('overview.callsHint', { n: count(current.answeredCalls, t.lang) })}
          />
          <StatTile
            label={t('overview.visitToRequest')}
            value={percent(leadRate, 1, t.lang)}
            change={delta(leadRate, previousLeadRate)}
            hint={t('overview.visitToRequestHint')}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label={t('overview.pagesPerVisit')}
            value={current.sessions ? fixed(shape.pages, 1) : '—'}
            change={delta(shape.pages, previousShape.pages)}
            hint={t('overview.pagesSeen', { pages: t.plural(current.pageviews, 'overview.page') })}
          />
          <StatTile
            label={t('overview.timeOnSite')}
            value={current.sessions ? duration(shape.seconds) : '—'}
            change={delta(shape.seconds, previousShape.seconds)}
            hint={t('overview.timeOnSiteHint')}
          />
          <StatTile
            label={t('overview.bounced')}
            value={current.sessions ? percent(shape.bounce, 0, t.lang) : '—'}
            change={delta(shape.bounce, previousShape.bounce)}
            higherIsBetter={false}
            hint={t('overview.bouncedHint')}
          />
          <StatTile
            label={t('overview.engagedVisits')}
            value={count(current.engagedSessions, t.lang)}
            change={delta(current.engagedSessions, previous.engagedSessions)}
            hint={t('overview.engagedVisitsHint')}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title={t('overview.panel.visits')} subtitle={t('overview.panel.visitsSub')}>
            <TimeSeries
              points={points}
              series={[{ key: 'sessions', label: t('overview.series.visits'), color: SERIES[0] }]}
            />
          </Panel>

          <Panel title={t('overview.panel.requests')} subtitle={t('overview.panel.requestsSub')}>
            <TimeSeries
              points={points}
              series={[
                { key: 'leads', label: t('overview.series.formLeads'), color: SERIES[0] },
                { key: 'calls', label: t('overview.series.calls'), color: SERIES[1] },
              ]}
            />
            <Hint>{t('overview.twoChartsHint')}</Hint>
          </Panel>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title={t('overview.panel.money')} subtitle={t('overview.panel.moneySub')}>
            <TimeSeries
              points={points}
              series={[
                { key: 'spend', label: t('overview.series.spend'), color: SERIES[1] },
                { key: 'revenue', label: t('overview.series.invoiced'), color: SERIES[2] },
              ]}
              format="money"
            />
          </Panel>

          <Panel title={t('overview.panel.sources')} subtitle={t('overview.panel.sourcesSub')}>
            <RankedBars
              items={channels
                .filter((row) => row.leads + row.calls > 0)
                .slice(0, 8)
                .map((row) => ({
                  label: channelLabel(row.channel),
                  value: row.leads + row.calls,
                  color: channelColor(row.channel),
                  note: row.spendCents
                    ? t('overview.each', {
                        amount: money(
                          row.spendCents / Math.max(1, row.leads + row.calls),
                          t.lang
                        ),
                      })
                    : undefined,
                }))}
            />
          </Panel>
        </div>

        <Panel
          title={t('overview.panel.funnel')}
          subtitle={t('overview.panel.funnelSub')}
          action={
            <Link
              href={`/admin/funnel?range=${range.key}`}
              className="font-heading text-[10px] uppercase tracking-label text-gray-500 hover:text-ink"
            >
              {t('common.detail')} →
            </Link>
          }
        >
          <Funnel stages={funnel} />
        </Panel>

        <Panel
          title={t('overview.panel.channels')}
          subtitle={t('overview.panel.channelsSub')}
          action={
            <Link
              href={`/admin/channels?range=${range.key}`}
              className="font-heading text-[10px] uppercase tracking-label text-gray-500 hover:text-ink"
            >
              {t('common.detail')} →
            </Link>
          }
        >
          {channels.length === 0 ? (
            <Empty>{t('overview.noTraffic')}</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>{t('overview.col.channel')}</Th>
                  <Th numeric>{t('overview.col.visits')}</Th>
                  <Th numeric>{t('overview.col.leads')}</Th>
                  <Th numeric>{t('overview.col.calls')}</Th>
                  <Th numeric>{t('overview.col.booked')}</Th>
                  <Th numeric>{t('overview.col.won')}</Th>
                  <Th numeric>{t('overview.col.spend')}</Th>
                  <Th numeric>{t('overview.col.costPerRequest')}</Th>
                  <Th numeric>{t('overview.col.revenue')}</Th>
                  <Th numeric>{t('overview.col.roas')}</Th>
                </tr>
              </thead>
              <tbody>
                {channels.map((row) => {
                  const rowRequests = row.leads + row.calls;
                  const rowRoas = row.spendCents ? row.revenueCents / row.spendCents : null;
                  return (
                    <tr key={row.channel}>
                      <Td>
                        <span className="inline-flex items-center gap-2">
                          <span
                            aria-hidden
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: channelColor(row.channel) }}
                          />
                          {channelLabel(row.channel)}
                        </span>
                      </Td>
                      <Td numeric>{count(row.sessions, t.lang)}</Td>
                      <Td numeric>{count(row.leads, t.lang)}</Td>
                      <Td numeric>{count(row.calls, t.lang)}</Td>
                      <Td numeric>{count(row.booked, t.lang)}</Td>
                      <Td numeric>{count(row.won, t.lang)}</Td>
                      <Td numeric>{row.spendCents ? money(row.spendCents, t.lang) : '—'}</Td>
                      <Td numeric>
                        {row.spendCents && rowRequests
                          ? money(row.spendCents / rowRequests, t.lang)
                          : '—'}
                      </Td>
                      <Td numeric>{row.revenueCents ? money(row.revenueCents, t.lang) : '—'}</Td>
                      <Td numeric>{rowRoas === null ? '—' : `${fixed(rowRoas, 2)}×`}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
          <Hint>{t('overview.channelsHint')}</Hint>
        </Panel>
      </div>
    );
  } catch (error) {
    return <SetupNotice error={error} />;
  }
}
