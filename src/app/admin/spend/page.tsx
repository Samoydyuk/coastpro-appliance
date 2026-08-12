import { parseRange } from '@/lib/admin/range';
import { getChannels, getDailySeries, getSpend } from '@/lib/admin/queries';
import { count, money, shortDate } from '@/lib/admin/format';
import { channelLabel } from '@/lib/attribution';
import { Empty, Hint, Panel, SetupNotice, StatTile, Table, Td, Th } from '@/components/admin/ui';
import { SpendEditor } from '@/components/admin/SpendEditor';
import { TimeSeries } from '@/components/admin/charts';
import { SERIES } from '@/components/admin/palette';

export const dynamic = 'force-dynamic';

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

  try {
    const [rows, channels, series] = await Promise.all([
      getSpend(range),
      getChannels(range),
      getDailySeries(range),
    ]);

    const spendRows = rows as Record<string, string | number | Date | null>[];
    const totalSpend = channels.reduce((sum, row) => sum + row.spendCents, 0);
    const totalRevenue = channels.reduce((sum, row) => sum + row.revenueCents, 0);
    const totalRequests = channels.reduce((sum, row) => sum + row.leads + row.calls, 0);
    const totalWon = channels.reduce((sum, row) => sum + row.won, 0);

    const points = series.map((day) => ({
      label: shortDate(day.day),
      values: { spend: day.spendCents / 100, revenue: day.revenueCents / 100 },
    }));

    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-xl font-bold uppercase tracking-label text-ink">
            Ad spend
          </h1>
          <p className="mt-1 text-sm text-gray-600">{range.label}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Spent" value={money(totalSpend)} higherIsBetter={false} />
          <StatTile
            label="Cost per request"
            value={totalRequests ? money(totalSpend / totalRequests) : '—'}
            higherIsBetter={false}
            hint={`${count(totalRequests)} leads + calls`}
          />
          <StatTile
            label="Cost per job"
            value={totalWon ? money(totalSpend / totalWon) : '—'}
            higherIsBetter={false}
            hint={`${count(totalWon)} won`}
          />
          <StatTile
            label="Return"
            value={totalSpend ? `${(totalRevenue / totalSpend).toFixed(2)}×` : '—'}
            hint={`${money(totalRevenue)} revenue`}
          />
        </div>

        <Panel title="Add spend" subtitle="One row per day per campaign — saving again overwrites it">
          <SpendEditor />
          <Hint>
            Take the figures straight off the platform&apos;s own reporting. Entering campaign-level
            rows is optional but it is what makes the per-campaign cost per lead work; leave the
            campaign blank to record a whole channel&apos;s daily total.
          </Hint>
        </Panel>

        <Panel title="Spend against revenue" subtitle="Daily">
          <TimeSeries
            points={points}
            series={[
              { key: 'spend', label: 'Spend', color: SERIES[1] },
              { key: 'revenue', label: 'Revenue from won jobs', color: SERIES[2] },
            ]}
              format="money"
          />
          <Hint>
            Revenue is dated to when the lead arrived, not when the invoice was paid — so a recent
            day can look thin simply because those jobs have not been done yet.
          </Hint>
        </Panel>

        <Panel title="Recorded spend">
          {spendRows.length === 0 ? (
            <Empty>Nothing recorded for this period.</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Day</Th>
                  <Th>Channel</Th>
                  <Th>Campaign</Th>
                  <Th numeric>Cost</Th>
                  <Th numeric>Clicks</Th>
                  <Th numeric>Cost / click</Th>
                  <Th numeric>Impressions</Th>
                  <Th>Source</Th>
                </tr>
              </thead>
              <tbody>
                {spendRows.map((row) => {
                  const clicks = Number(row.clicks ?? 0);
                  const cost = Number(row.cost_cents ?? 0);
                  return (
                    <tr key={String(row.id)}>
                      <Td className="whitespace-nowrap">
                        {new Date(row.day as Date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          timeZone: 'UTC',
                        })}
                      </Td>
                      <Td>{channelLabel(row.channel as string)}</Td>
                      <Td>{(row.campaign as string) || '—'}</Td>
                      <Td numeric>{money(cost)}</Td>
                      <Td numeric>{clicks ? count(clicks) : '—'}</Td>
                      <Td numeric>{clicks ? money(cost / clicks) : '—'}</Td>
                      <Td numeric>{row.impressions ? count(Number(row.impressions)) : '—'}</Td>
                      <Td className="capitalize">{row.source as string}</Td>
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
