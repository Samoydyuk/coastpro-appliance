import { parseRange } from '@/lib/admin/range';
import { getDevices, getFunnel, getFunnelDetail, getHourHeatmap } from '@/lib/admin/queries';
import { count, duration, percent } from '@/lib/admin/format';
import { Empty, Hint, Panel, SetupNotice, Table, Td, Th } from '@/components/admin/ui';
import { Funnel, Heatmap, RankedBars } from '@/components/admin/charts';
import { SERIES, STATUS } from '@/components/admin/palette';

export const dynamic = 'force-dynamic';

export default async function FunnelPage({
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
    const [stages, detail, heatmap, devices] = await Promise.all([
      getFunnel(range),
      getFunnelDetail(range),
      getHourHeatmap(range),
      getDevices(range),
    ]);

    const byDevice = new Map<string, { sessions: number; conversions: number }>();
    devices.forEach((row) => {
      const entry = byDevice.get(row.device) ?? { sessions: 0, conversions: 0 };
      entry.sessions += row.sessions;
      entry.conversions += row.conversions;
      byDevice.set(row.device, entry);
    });

    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-xl font-bold uppercase tracking-label text-ink">Funnel</h1>
          <p className="mt-1 text-sm text-gray-600">{range.label}</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
          <Panel title="Stages" subtitle="Measured per visit, not per click">
            <Funnel stages={stages} />
            <Hint>
              A visitor who taps the phone number four times counts once. Counting the taps would
              make the funnel look far healthier than it is.
            </Hint>
          </Panel>

          <div className="space-y-4">
            <Panel title="How fast people decide">
              <p className="font-heading text-3xl font-bold tabular-nums text-ink">
                {detail.medianTimeToLead === null ? '—' : duration(detail.medianTimeToLead)}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                median time from landing to getting in touch, across {count(detail.measuredLeads)}{' '}
                leads
              </p>
              <Hint>
                Short is normal here — a broken fridge is an emergency purchase. If this number
                climbs, the page is making people hunt for something.
              </Hint>
            </Panel>

            <Panel title="By device">
              {byDevice.size === 0 ? (
                <Empty>No visits yet.</Empty>
              ) : (
                <Table className="min-w-0">
                  <thead>
                    <tr>
                      <Th>Device</Th>
                      <Th numeric>Visits</Th>
                      <Th numeric>Converted</Th>
                      <Th numeric>Rate</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...byDevice.entries()]
                      .sort((a, b) => b[1].sessions - a[1].sessions)
                      .map(([device, entry]) => (
                        <tr key={device}>
                          <Td className="capitalize">{device}</Td>
                          <Td numeric>{count(entry.sessions)}</Td>
                          <Td numeric>{count(entry.conversions)}</Td>
                          <Td numeric>
                            {entry.sessions ? percent(entry.conversions / entry.sessions) : '—'}
                          </Td>
                        </tr>
                      ))}
                  </tbody>
                </Table>
              )}
            </Panel>
          </div>
        </div>

        <Panel
          title="When people ask for service"
          subtitle="Leads and calls by weekday and hour, in California time"
        >
          <Heatmap cells={heatmap} />
          <Hint>
            Both Google Ads and Meta let you bid differently by hour and day. This grid is the
            evidence for that schedule — and for when somebody needs to be free to answer the phone.
          </Hint>
        </Panel>

        <div className="grid gap-4 lg:grid-cols-3">
          <Panel title="Where forms are abandoned" subtitle="Last field touched before leaving">
            {detail.lastField.length === 0 ? (
              <Empty>No abandoned forms recorded.</Empty>
            ) : (
              <RankedBars
                items={detail.lastField.map((row) => ({
                  label: row.label,
                  value: row.abandoned,
                  color: SERIES[1],
                }))}
              />
            )}
          </Panel>

          <Panel title="Validation complaints" subtitle="What the form rejected">
            {detail.errors.length === 0 ? (
              <Empty>No form errors recorded.</Empty>
            ) : (
              <RankedBars
                items={detail.errors.map((row) => ({
                  label: row.label,
                  value: row.total,
                  color: STATUS.serious,
                }))}
              />
            )}
          </Panel>

          <Panel title="Friction" subtitle="Rage clicks and script errors">
            {detail.friction.length === 0 ? (
              <Empty>Nothing broken recorded — good.</Empty>
            ) : (
              <RankedBars
                items={detail.friction.map((row) => ({
                  label: `${row.type === 'rage_click' ? 'Rage' : 'Error'} · ${row.path}`,
                  value: row.total,
                  color: STATUS.critical,
                }))}
              />
            )}
            <Hint>
              A rage click is three hits on the same spot within a second — something looked
              clickable and was not.
            </Hint>
          </Panel>
        </div>
      </div>
    );
  } catch (error) {
    return <SetupNotice error={error} />;
  }
}
