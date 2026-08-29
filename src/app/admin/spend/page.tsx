import { parseRange } from '@/lib/admin/range';
import { getChannels, getDailySeries, getSpend } from '@/lib/admin/queries';
import { count, money, shortDate } from '@/lib/admin/format';
import { CHANNEL_LABELS, channelLabel } from '@/lib/attribution';
import { serverTranslator } from '@/lib/i18n/server';
import { numberLocale, type Lang, type TranslationKey } from '@/lib/i18n';
import { Empty, Hint, Panel, SetupNotice, StatTile, Table, Td, Th } from '@/components/admin/ui';
import { SpendEditor } from '@/components/admin/SpendEditor';
import { TimeSeries } from '@/components/admin/charts';
import { SERIES } from '@/components/admin/palette';
import { MoneyBasisLine } from '@/components/admin/MoneyBasis';
import { rangeLabel } from '@/lib/i18n/range';

export const dynamic = 'force-dynamic';

/**
 * A return like `2,40×`. Through `Intl` rather than `toFixed`, or it is the one
 * number on a Ukrainian screen still written with a full stop.
 */
function ratio(value: number, lang: Lang): string {
  return value.toLocaleString(numberLocale(lang), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default async function SpendPage({
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

  // The slug is a JOIN key and never moves; only what the reader sees does.
  const channelName = (channel: string | null | undefined) =>
    channel && channel in CHANNEL_LABELS
      ? t(`marketing.channel.${channel}` as TranslationKey)
      : channelLabel(channel);

  try {
    const [rows, channels, series] = await Promise.all([
      getSpend(range),
      getChannels(range),
      getDailySeries(range),
    ]);

    const spendRows = rows as Record<string, string | number | Date | null>[];
    const totalSpend = channels.reduce((sum, row) => sum + row.spendCents, 0);
    const totalRevenue = channels.reduce((sum, row) => sum + row.invoicedCents, 0);
    const totalMarked = channels.reduce((sum, row) => sum + row.revenueCents, 0);
    const totalRequests = channels.reduce((sum, row) => sum + row.leads + row.calls, 0);
    const totalWon = channels.reduce((sum, row) => sum + row.won, 0);

    const points = series.map((day) => ({
      label: shortDate(day.day, t.lang),
      values: { spend: day.spendCents / 100, revenue: day.invoicedCents / 100 },
    }));

    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-xl font-bold uppercase tracking-label text-ink">
            {t('marketing.spend.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-600">{rangeLabel(range, t)}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label={t('marketing.spend.spent')}
            value={money(totalSpend, t.lang)}
            higherIsBetter={false}
          />
          <StatTile
            label={t('marketing.spend.costPerRequest')}
            value={totalRequests ? money(totalSpend / totalRequests, t.lang) : '—'}
            higherIsBetter={false}
            hint={t('marketing.spend.costPerRequestHint', { n: count(totalRequests, t.lang) })}
          />
          <StatTile
            label={t('marketing.spend.costPerJob')}
            value={totalWon ? money(totalSpend / totalWon, t.lang) : '—'}
            higherIsBetter={false}
            hint={t('marketing.spend.costPerJobHint', { n: count(totalWon, t.lang) })}
          />
          <StatTile
            label={t('marketing.spend.return')}
            value={totalSpend ? `${ratio(totalRevenue / totalSpend, t.lang)}×` : '—'}
            hint={t('marketing.spend.returnHint', { amount: money(totalRevenue, t.lang) })}
          />
        </div>

        <Panel title={t('marketing.spend.add')} subtitle={t('marketing.spend.addSub')}>
          <SpendEditor />
          <Hint>{t('marketing.spend.addHint')}</Hint>
        </Panel>

        <MoneyBasisLine attributedCents={totalRevenue} reportedCents={totalMarked} />

        <Panel title={t('marketing.spend.vsRevenue')} subtitle={t('marketing.spend.daily')}>
          <TimeSeries
            points={points}
            series={[
              { key: 'spend', label: t('marketing.spend.seriesSpend'), color: SERIES[1] },
              { key: 'revenue', label: t('marketing.spend.seriesRevenue'), color: SERIES[2] },
            ]}
              format="money"
          />
          <Hint>{t('marketing.spend.chartHint')}</Hint>
        </Panel>

        <Panel title={t('marketing.spend.recorded')}>
          {spendRows.length === 0 ? (
            <Empty>{t('marketing.spend.nothing')}</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>{t('marketing.col.day')}</Th>
                  <Th>{t('marketing.col.channel')}</Th>
                  <Th>{t('marketing.col.campaign')}</Th>
                  <Th numeric>{t('marketing.col.cost')}</Th>
                  <Th numeric>{t('marketing.col.clicks')}</Th>
                  <Th numeric>{t('marketing.col.costPerClick')}</Th>
                  <Th numeric>{t('marketing.col.impressions')}</Th>
                  <Th>{t('marketing.col.source')}</Th>
                </tr>
              </thead>
              <tbody>
                {spendRows.map((row) => {
                  const clicks = Number(row.clicks ?? 0);
                  const cost = Number(row.cost_cents ?? 0);
                  return (
                    <tr key={String(row.id)}>
                      <Td className="whitespace-nowrap">
                        {/* A date somebody reads, so it follows the language.
                            The UTC zone stays: `day` is a date-only column. */}
                        {new Date(row.day as Date).toLocaleDateString(numberLocale(t.lang), {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          timeZone: 'UTC',
                        })}
                      </Td>
                      <Td>{channelName(row.channel as string)}</Td>
                      <Td>{(row.campaign as string) || '—'}</Td>
                      <Td numeric>{money(cost, t.lang)}</Td>
                      <Td numeric>{clicks ? count(clicks, t.lang) : '—'}</Td>
                      <Td numeric>{clicks ? money(cost / clicks, t.lang) : '—'}</Td>
                      <Td numeric>
                        {row.impressions ? count(Number(row.impressions), t.lang) : '—'}
                      </Td>
                      <Td className="capitalize">
                        {/* `source` is a value the importers write, not a label:
                            the one the owner types is named, the rest stand. */}
                        {row.source === 'manual'
                          ? t('marketing.spend.source.manual')
                          : (row.source as string)}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Panel>
      </div>
    );
  } catch (error) {
    return <SetupNotice error={error} />;
  }
}
