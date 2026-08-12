import Link from 'next/link';
import { parseRange } from '@/lib/admin/range';
import { getChannels, getDailySeries, getFunnel, getOverview } from '@/lib/admin/queries';
import { count, delta, money, percent, shortDate } from '@/lib/admin/format';
import { channelLabel, isPaidChannel } from '@/lib/attribution';
import { Empty, Hint, Panel, SetupNotice, StatTile, Table, Td, Th, Warning } from '@/components/admin/ui';
import { Funnel, RankedBars, TimeSeries } from '@/components/admin/charts';
import { SERIES, channelColor } from '@/components/admin/palette';

export const dynamic = 'force-dynamic';

export default async function OverviewPage({
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
    const roas = current.spendCents ? current.revenueCents / current.spendCents : null;
    const leadRate = current.sessions ? current.leads / current.sessions : 0;
    const previousLeadRate = previous.sessions ? previous.leads / previous.sessions : 0;

    const paidWithoutSpend = channels.filter(
      (row) => isPaidChannel(row.channel) && row.spendCents === 0 && row.sessions > 0
    );

    const points = series.map((day) => ({
      label: shortDate(day.day),
      values: {
        sessions: day.sessions,
        leads: day.leads,
        calls: day.calls,
        spend: day.spendCents / 100,
        revenue: day.revenueCents / 100,
      },
    }));

    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-xl font-bold uppercase tracking-label text-ink">
            Overview
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {range.label} · compared with the {range.days} days before it
          </p>
        </div>

        {paidWithoutSpend.length > 0 && (
          <Warning>
            {paidWithoutSpend.map((row) => channelLabel(row.channel)).join(', ')} sent traffic but
            has no cost recorded for this period, so its cost per lead is blank. Add it under{' '}
            <Link href="/admin/spend" className="underline">
              Spend
            </Link>
            .
          </Warning>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Service requests"
            value={count(requests)}
            change={delta(requests, previousRequests)}
            hint="forms + answered calls"
            emphasis
          />
          <StatTile
            label="Cost per request"
            value={costPerLead === null ? '—' : money(costPerLead)}
            change={
              costPerLead !== null && previousCostPerLead !== null
                ? delta(costPerLead, previousCostPerLead)
                : null
            }
            higherIsBetter={false}
            hint={current.spendCents ? `on ${money(current.spendCents)} spent` : 'no spend recorded'}
            emphasis
          />
          <StatTile
            label="Jobs won"
            value={count(current.won)}
            change={delta(current.won, previous.won)}
            hint={`${money(current.revenueCents)} booked revenue`}
            emphasis
          />
          <StatTile
            label="Return on ad spend"
            value={roas === null ? '—' : `${roas.toFixed(2)}×`}
            hint={roas === null ? 'needs spend + won jobs' : 'revenue ÷ spend'}
            emphasis
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Visits"
            value={count(current.sessions)}
            change={delta(current.sessions, previous.sessions)}
            hint={`${count(current.visitors)} people`}
          />
          <StatTile
            label="Form leads"
            value={count(current.leads)}
            change={delta(current.leads, previous.leads)}
            hint={current.leads - current.qualityLeads > 0 ? `${current.leads - current.qualityLeads} duplicate/spam` : 'all clean'}
          />
          <StatTile
            label="Phone calls"
            value={count(current.calls)}
            change={delta(current.calls, previous.calls)}
            hint={`${count(current.answeredCalls)} answered`}
          />
          <StatTile
            label="Visit → request"
            value={percent(leadRate)}
            change={delta(leadRate, previousLeadRate)}
            hint="share of visits that ask for service"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Visits" subtitle="Bots excluded">
            <TimeSeries
              points={points}
              series={[{ key: 'sessions', label: 'Visits', color: SERIES[0] }]}
            />
          </Panel>

          <Panel title="Requests" subtitle="Forms and calls, day by day">
            <TimeSeries
              points={points}
              series={[
                { key: 'leads', label: 'Form leads', color: SERIES[0] },
                { key: 'calls', label: 'Calls', color: SERIES[1] },
              ]}
            />
            <Hint>
              Visits and requests are drawn separately on purpose. Put them on one chart and the
              two scales have to be forced together, which makes the shapes say whatever the scale
              was chosen to make them say.
            </Hint>
          </Panel>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Money" subtitle="Ad spend against revenue from won jobs">
            <TimeSeries
              points={points}
              series={[
                { key: 'spend', label: 'Spend', color: SERIES[1] },
                { key: 'revenue', label: 'Revenue', color: SERIES[2] },
              ]}
              format="money"
            />
          </Panel>

          <Panel title="Where requests come from" subtitle="Leads and calls by channel">
            <RankedBars
              items={channels
                .filter((row) => row.leads + row.calls > 0)
                .slice(0, 8)
                .map((row) => ({
                  label: channelLabel(row.channel),
                  value: row.leads + row.calls,
                  color: channelColor(row.channel),
                  note: row.spendCents
                    ? `${money(row.spendCents / Math.max(1, row.leads + row.calls))} each`
                    : undefined,
                }))}
            />
          </Panel>
        </div>

        <Panel
          title="Funnel"
          subtitle="Where people stop"
          action={
            <Link
              href={`/admin/funnel?range=${range.key}`}
              className="font-heading text-[10px] uppercase tracking-label text-gray-500 hover:text-ink"
            >
              Detail →
            </Link>
          }
        >
          <Funnel stages={funnel} />
        </Panel>

        <Panel
          title="Channels"
          subtitle="Everything that brought traffic or cost money"
          action={
            <Link
              href={`/admin/channels?range=${range.key}`}
              className="font-heading text-[10px] uppercase tracking-label text-gray-500 hover:text-ink"
            >
              Detail →
            </Link>
          }
        >
          {channels.length === 0 ? (
            <Empty>No traffic recorded in this period yet.</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Channel</Th>
                  <Th numeric>Visits</Th>
                  <Th numeric>Leads</Th>
                  <Th numeric>Calls</Th>
                  <Th numeric>Booked</Th>
                  <Th numeric>Won</Th>
                  <Th numeric>Spend</Th>
                  <Th numeric>Cost / request</Th>
                  <Th numeric>Revenue</Th>
                  <Th numeric>ROAS</Th>
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
                      <Td numeric>{count(row.sessions)}</Td>
                      <Td numeric>{count(row.leads)}</Td>
                      <Td numeric>{count(row.calls)}</Td>
                      <Td numeric>{count(row.booked)}</Td>
                      <Td numeric>{count(row.won)}</Td>
                      <Td numeric>{row.spendCents ? money(row.spendCents) : '—'}</Td>
                      <Td numeric>
                        {row.spendCents && rowRequests ? money(row.spendCents / rowRequests) : '—'}
                      </Td>
                      <Td numeric>{row.revenueCents ? money(row.revenueCents) : '—'}</Td>
                      <Td numeric>{rowRoas === null ? '—' : `${rowRoas.toFixed(2)}×`}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
          <Hint>
            Cost per request divides spend by leads plus answered calls, not by leads alone.
            Judging a phone-heavy channel on form fills only would make it look several times
            worse than it is.
          </Hint>
        </Panel>
      </div>
    );
  } catch (error) {
    return <SetupNotice error={error} />;
  }
}
