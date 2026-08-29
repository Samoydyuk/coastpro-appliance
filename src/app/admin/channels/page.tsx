import Link from 'next/link';
import { parseRange } from '@/lib/admin/range';
import { getCampaigns, getChannels } from '@/lib/admin/queries';
import { count, money, percent } from '@/lib/admin/format';
import { channelLabel, isPaidChannel } from '@/lib/attribution';
import { Empty, Hint, Panel, SetupNotice, Table, Td, Th } from '@/components/admin/ui';
import { RankedBars } from '@/components/admin/charts';
import { channelColor } from '@/components/admin/palette';
import { MoneyBasisLine } from '@/components/admin/MoneyBasis';

export const dynamic = 'force-dynamic';

const GROUPINGS = [
  { key: 'campaign', label: 'Campaign' },
  { key: 'content', label: 'Ad / creative' },
  { key: 'term', label: 'Keyword' },
] as const;

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
              Channels
            </h1>
            <p className="mt-1 text-sm text-gray-600">{range.label}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-heading text-[10px] uppercase tracking-label text-gray-500">
              Credit the
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
                {mode === 'last' ? 'Last click' : 'First click'}
              </Link>
            ))}
          </div>
        </header>

        <Hint>
          Last click credits whichever channel was in play when the person got in touch. First
          click credits whatever introduced them, which is often weeks earlier — usually an ad,
          even when the visit that converted came from a Google search for the business name.
          Switching between the two is the fastest way to see which channels are being quietly
          underpaid by the ad platforms&apos; own reporting.
        </Hint>

        <MoneyBasisLine attributedCents={totalRevenue} reportedCents={totalMarked} />

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Spend" subtitle="Where the money went">
            {totalSpend === 0 ? (
              <Empty>
                No spend recorded for this period.{' '}
                <Link href="/admin/spend" className="underline">
                  Add it
                </Link>{' '}
                to unlock cost per lead and ROAS.
              </Empty>
            ) : (
              <RankedBars
                items={paid.map((row) => ({
                  label: channelLabel(row.channel),
                  value: row.spendCents / 100,
                  color: channelColor(row.channel),
                  note: percent(row.spendCents / totalSpend, 0),
                }))}
                format="money"
              />
            )}
          </Panel>

          <Panel title="Revenue" subtitle="Invoiced in JobPocket, for work that began as an enquiry">
            {totalRevenue === 0 ? (
              <Empty>No won jobs with a value recorded yet.</Empty>
            ) : (
              <RankedBars
                items={channels
                  .filter((row) => row.invoicedCents > 0)
                  .map((row) => ({
                    label: channelLabel(row.channel),
                    value: row.invoicedCents / 100,
                    color: channelColor(row.channel),
                    note: percent(row.invoicedCents / totalRevenue, 0),
                  }))}
                format="money"
              />
            )}
          </Panel>
        </div>

        <Panel title="Every channel" subtitle="Traffic, requests, cost and what came back">
          {channels.length === 0 ? (
            <Empty>Nothing recorded in this period.</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Channel</Th>
                  <Th numeric>Visits</Th>
                  <Th numeric>Leads</Th>
                  <Th numeric>Calls</Th>
                  <Th numeric>Conv. rate</Th>
                  <Th numeric>Booked</Th>
                  <Th numeric>Won</Th>
                  <Th numeric>Close rate</Th>
                  <Th numeric>Spend</Th>
                  <Th numeric>Cost / request</Th>
                  <Th numeric>Cost / job</Th>
                  <Th numeric>Invoiced</Th>
                  <Th numeric>Marked</Th>
                  <Th numeric>ROAS</Th>
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
                          {channelLabel(row.channel)}
                        </span>
                      </Td>
                      <Td numeric>{count(row.sessions)}</Td>
                      <Td numeric>{count(row.leads)}</Td>
                      <Td numeric>{count(row.calls)}</Td>
                      <Td numeric>{row.sessions ? percent(requests / row.sessions) : '—'}</Td>
                      <Td numeric>{count(row.booked)}</Td>
                      <Td numeric>{count(row.won)}</Td>
                      <Td numeric>{requests ? percent(row.won / requests) : '—'}</Td>
                      <Td numeric>{row.spendCents ? money(row.spendCents) : '—'}</Td>
                      <Td numeric>
                        {row.spendCents && requests ? money(row.spendCents / requests) : '—'}
                      </Td>
                      <Td numeric>{row.spendCents && row.won ? money(row.spendCents / row.won) : '—'}</Td>
                      <Td numeric>{row.invoicedCents ? money(row.invoicedCents) : '—'}</Td>
                      <Td numeric className="text-gray-500">
                        {row.revenueCents ? money(row.revenueCents) : '—'}
                      </Td>
                      <Td numeric>
                        {roas === null ? (
                          '—'
                        ) : (
                          <span style={{ color: roas >= 1 ? '#006300' : '#d03b3b' }}>
                            {roas.toFixed(2)}×
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
          title="Inside the channels"
          subtitle="The same numbers, one level down"
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
                  {entry.label}
                </Link>
              ))}
            </div>
          }
        >
          {campaigns.length === 0 ? (
            <Empty>Nothing tagged at this level yet.</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Channel</Th>
                  <Th>{GROUPINGS.find((entry) => entry.key === groupBy)?.label}</Th>
                  <Th numeric>Visits</Th>
                  <Th numeric>Leads</Th>
                  <Th numeric>Booked</Th>
                  <Th numeric>Won</Th>
                  <Th numeric>Spend</Th>
                  <Th numeric>Cost / lead</Th>
                  <Th numeric>Revenue</Th>
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
                        {channelLabel(row.channel)}
                      </span>
                    </Td>
                    <Td className="max-w-[280px] truncate">{row.label}</Td>
                    <Td numeric>{count(row.sessions)}</Td>
                    <Td numeric>{count(row.leads)}</Td>
                    <Td numeric>{count(row.booked)}</Td>
                    <Td numeric>{count(row.won)}</Td>
                    <Td numeric>{row.spendCents ? money(row.spendCents) : '—'}</Td>
                    <Td numeric>
                      {row.spendCents && row.leads ? money(row.spendCents / row.leads) : '—'}
                    </Td>
                    <Td numeric>{row.revenueCents ? money(row.revenueCents) : '—'}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
          <Hint>
            Keyword and creative rows only appear for traffic that arrived tagged. Google Ads
            auto-tagging supplies the click id but not the keyword, so add{' '}
            <code className="rounded bg-cream-dark px-1 py-0.5">
              utm_term={'{keyword}'}&amp;utm_content={'{creative}'}
            </code>{' '}
            to the tracking template if you want this level filled in.
          </Hint>
        </Panel>
      </div>
    );
  } catch (error) {
    return <SetupNotice error={error} />;
  }
}
