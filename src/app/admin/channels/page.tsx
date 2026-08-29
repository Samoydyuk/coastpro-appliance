import Link from 'next/link';
import { parseRange } from '@/lib/admin/range';
import { getCampaigns, getChannels } from '@/lib/admin/queries';
import { count, money, percent } from '@/lib/admin/format';
import { CHANNEL_LABELS, channelLabel, isPaidChannel } from '@/lib/attribution';
import { serverTranslator } from '@/lib/i18n/server';
import { numberLocale, type Lang, type TranslationKey } from '@/lib/i18n';
import { Empty, Hint, Panel, SetupNotice, Table, Td, Th } from '@/components/admin/ui';
import { RankedBars } from '@/components/admin/charts';
import { channelColor } from '@/components/admin/palette';
import { MoneyBasisLine } from '@/components/admin/MoneyBasis';
import { rangeLabel } from '@/lib/i18n/range';

export const dynamic = 'force-dynamic';

// `key` is the query-string value and stays English; only the label moves.
const GROUPINGS = [
  { key: 'campaign', labelKey: 'marketing.channels.group.campaign' },
  { key: 'content', labelKey: 'marketing.channels.group.content' },
  { key: 'term', labelKey: 'marketing.channels.group.term' },
] as const;

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

export default async function ChannelsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const range = parseRange({
    range: searchParams.range as string,
    from: searchParams.from as string,
    to: searchParams.to as string,
  });
  const attribution = (searchParams.attribution as string) === 'first' ? 'first' : 'last';
  const groupBy = (GROUPINGS.find((entry) => entry.key === searchParams.group)?.key ??
    'campaign') as 'campaign' | 'content' | 'term';
  const t = serverTranslator();

  // The slug is a JOIN key and never moves; only what the reader sees does.
  // A channel the dictionary has not heard of keeps the name attribution.ts
  // gives it rather than showing a raw key.
  const channelName = (channel: string | null | undefined) =>
    channel && channel in CHANNEL_LABELS
      ? t(`marketing.channel.${channel}` as TranslationKey)
      : channelLabel(channel);

  try {
    const [channels, campaigns] = await Promise.all([
      getChannels(range, attribution),
      getCampaigns(range, groupBy),
    ]);

    const paid = channels.filter((row) => isPaidChannel(row.channel));
    const totalSpend = paid.reduce((sum, row) => sum + row.spendCents, 0);
    const totalRevenue = channels.reduce((sum, row) => sum + row.invoicedCents, 0);
    const totalMarked = channels.reduce((sum, row) => sum + row.revenueCents, 0);

    return (
      <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-xl font-bold uppercase tracking-label text-ink">
              {t('marketing.channels.title')}
            </h1>
            <p className="mt-1 text-sm text-gray-600">{rangeLabel(range, t)}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-heading text-[10px] uppercase tracking-label text-gray-500">
              {t('marketing.channels.creditThe')}
            </span>
            {(['last', 'first'] as const).map((mode) => (
              <Link
                key={mode}
                href={`/admin/channels?range=${range.key}&attribution=${mode}&group=${groupBy}`}
                className={`rounded-card border px-2.5 py-1 font-heading text-[10px] font-semibold uppercase tracking-label ${
                  attribution === mode
                    ? 'border-ink bg-ink text-cream'
                    : 'border-primary-500/25 text-gray-600 hover:border-ink hover:text-ink'
                }`}
              >
                {mode === 'last'
                  ? t('marketing.channels.lastClick')
                  : t('marketing.channels.firstClick')}
              </Link>
            ))}
          </div>
        </header>

        <Hint>{t('marketing.channels.attributionHint')}</Hint>

        <MoneyBasisLine attributedCents={totalRevenue} reportedCents={totalMarked} />

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel
            title={t('marketing.channels.spend')}
            subtitle={t('marketing.channels.spendSub')}
          >
            {totalSpend === 0 ? (
              <Empty>
                {t('marketing.channels.noSpendBefore')}{' '}
                <Link href="/admin/spend" className="underline">
                  {t('marketing.channels.noSpendLink')}
                </Link>
                {t('marketing.channels.noSpendAfter')}
              </Empty>
            ) : (
              <RankedBars
                items={paid.map((row) => ({
                  label: channelName(row.channel),
                  value: row.spendCents / 100,
                  color: channelColor(row.channel),
                  note: percent(row.spendCents / totalSpend, 0, t.lang),
                }))}
                format="money"
              />
            )}
          </Panel>

          <Panel
            title={t('marketing.channels.revenue')}
            subtitle={t('marketing.channels.revenueSub')}
          >
            {totalRevenue === 0 ? (
              <Empty>{t('marketing.channels.noWon')}</Empty>
            ) : (
              <RankedBars
                items={channels
                  .filter((row) => row.invoicedCents > 0)
                  .map((row) => ({
                    label: channelName(row.channel),
                    value: row.invoicedCents / 100,
                    color: channelColor(row.channel),
                    note: percent(row.invoicedCents / totalRevenue, 0, t.lang),
                  }))}
                format="money"
              />
            )}
          </Panel>
        </div>

        <Panel
          title={t('marketing.channels.every')}
          subtitle={t('marketing.channels.everySub')}
        >
          {channels.length === 0 ? (
            <Empty>{t('marketing.channels.nothing')}</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>{t('marketing.col.channel')}</Th>
                  <Th numeric>{t('marketing.col.visits')}</Th>
                  <Th numeric>{t('marketing.col.leads')}</Th>
                  <Th numeric>{t('marketing.col.calls')}</Th>
                  <Th numeric>{t('marketing.col.convRate')}</Th>
                  <Th numeric>{t('marketing.col.booked')}</Th>
                  <Th numeric>{t('marketing.col.won')}</Th>
                  <Th numeric>{t('marketing.col.closeRate')}</Th>
                  <Th numeric>{t('marketing.col.spend')}</Th>
                  <Th numeric>{t('marketing.col.costPerRequest')}</Th>
                  <Th numeric>{t('marketing.col.costPerJob')}</Th>
                  <Th numeric>{t('marketing.col.invoiced')}</Th>
                  <Th numeric>{t('marketing.col.marked')}</Th>
                  <Th numeric>{t('marketing.col.roas')}</Th>
                </tr>
              </thead>
              <tbody>
                {channels.map((row) => {
                  const requests = row.leads + row.calls;
                  const roas = row.spendCents ? row.invoicedCents / row.spendCents : null;
                  return (
                    <tr key={row.channel}>
                      <Td>
                        <span className="inline-flex items-center gap-2">
                          <span
                            aria-hidden
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: channelColor(row.channel) }}
                          />
                          {channelName(row.channel)}
                        </span>
                      </Td>
                      <Td numeric>{count(row.sessions, t.lang)}</Td>
                      <Td numeric>{count(row.leads, t.lang)}</Td>
                      <Td numeric>{count(row.calls, t.lang)}</Td>
                      <Td numeric>
                        {row.sessions ? percent(requests / row.sessions, 1, t.lang) : '—'}
                      </Td>
                      <Td numeric>{count(row.booked, t.lang)}</Td>
                      <Td numeric>{count(row.won, t.lang)}</Td>
                      <Td numeric>{requests ? percent(row.won / requests, 1, t.lang) : '—'}</Td>
                      <Td numeric>{row.spendCents ? money(row.spendCents, t.lang) : '—'}</Td>
                      <Td numeric>
                        {row.spendCents && requests
                          ? money(row.spendCents / requests, t.lang)
                          : '—'}
                      </Td>
                      <Td numeric>
                        {row.spendCents && row.won ? money(row.spendCents / row.won, t.lang) : '—'}
                      </Td>
                      <Td numeric>{row.invoicedCents ? money(row.invoicedCents, t.lang) : '—'}</Td>
                      <Td numeric className="text-gray-500">
                        {row.revenueCents ? money(row.revenueCents, t.lang) : '—'}
                      </Td>
                      <Td numeric>
                        {roas === null ? (
                          '—'
                        ) : (
                          <span style={{ color: roas >= 1 ? '#006300' : '#d03b3b' }}>
                            {ratio(roas, t.lang)}×
                          </span>
                        )}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Panel>

        <Panel
          title={t('marketing.channels.inside')}
          subtitle={t('marketing.channels.insideSub')}
          action={
            <div className="flex gap-1">
              {GROUPINGS.map((entry) => (
                <Link
                  key={entry.key}
                  href={`/admin/channels?range=${range.key}&attribution=${attribution}&group=${entry.key}`}
                  className={`rounded-card border px-2.5 py-1 font-heading text-[10px] font-semibold uppercase tracking-label ${
                    groupBy === entry.key
                      ? 'border-ink bg-ink text-cream'
                      : 'border-primary-500/25 text-gray-600 hover:border-ink hover:text-ink'
                  }`}
                >
                  {t(entry.labelKey)}
                </Link>
              ))}
            </div>
          }
        >
          {campaigns.length === 0 ? (
            <Empty>{t('marketing.channels.untagged')}</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>{t('marketing.col.channel')}</Th>
                  <Th>
                    {t(
                      GROUPINGS.find((entry) => entry.key === groupBy)?.labelKey ??
                        'marketing.channels.group.campaign'
                    )}
                  </Th>
                  <Th numeric>{t('marketing.col.visits')}</Th>
                  <Th numeric>{t('marketing.col.leads')}</Th>
                  <Th numeric>{t('marketing.col.booked')}</Th>
                  <Th numeric>{t('marketing.col.won')}</Th>
                  <Th numeric>{t('marketing.col.spend')}</Th>
                  <Th numeric>{t('marketing.col.costPerLead')}</Th>
                  <Th numeric>{t('marketing.col.revenue')}</Th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((row) => (
                  <tr key={`${row.channel}-${row.label}`}>
                    <Td>
                      <span className="inline-flex items-center gap-2">
                        <span
                          aria-hidden
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: channelColor(row.channel) }}
                        />
                        {channelName(row.channel)}
                      </span>
                    </Td>
                    <Td className="max-w-[280px] truncate">{row.label}</Td>
                    <Td numeric>{count(row.sessions, t.lang)}</Td>
                    <Td numeric>{count(row.leads, t.lang)}</Td>
                    <Td numeric>{count(row.booked, t.lang)}</Td>
                    <Td numeric>{count(row.won, t.lang)}</Td>
                    <Td numeric>{row.spendCents ? money(row.spendCents, t.lang) : '—'}</Td>
                    <Td numeric>
                      {row.spendCents && row.leads
                        ? money(row.spendCents / row.leads, t.lang)
                        : '—'}
                    </Td>
                    <Td numeric>{row.revenueCents ? money(row.revenueCents, t.lang) : '—'}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
          <Hint>
            {t('marketing.channels.taggingHintBefore')}
            <code className="rounded bg-cream-dark px-1 py-0.5">
              utm_term={'{keyword}'}&amp;utm_content={'{creative}'}
            </code>
            {t('marketing.channels.taggingHintAfter')}
          </Hint>
        </Panel>
      </div>
    );
  } catch (error) {
    return <SetupNotice error={error} />;
  }
}
