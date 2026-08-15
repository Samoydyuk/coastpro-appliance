import { parseRange } from '@/lib/admin/range';
import { getGeo } from '@/lib/admin/queries';
import { count, money, percent } from '@/lib/admin/format';
import { serviceAreas } from '@/data/service-areas';
import { Empty, Hint, Panel, SetupNotice, Table, Td, Th, Warning } from '@/components/admin/ui';
import { RankedBars } from '@/components/admin/charts';
import { UsMap } from '@/components/admin/UsMap';
import { SERIES } from '@/components/admin/palette';

export const dynamic = 'force-dynamic';

export default async function GeoPage({
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
    const { cities, zips, points } = await getGeo(range);

    const served = new Set(serviceAreas.map((area) => area.name.toLowerCase()));
    const outside = cities.filter(
      (row) => row.city !== 'Unknown' && !served.has(row.city.toLowerCase())
    );
    const outsideShare =
      cities.reduce((sum, row) => sum + row.sessions, 0) > 0
        ? outside.reduce((sum, row) => sum + row.sessions, 0) /
          cities.reduce((sum, row) => sum + row.sessions, 0)
        : 0;

    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-xl font-bold uppercase tracking-label text-ink">
            Geography
          </h1>
          <p className="mt-1 text-sm text-gray-600">{range.label}</p>
        </div>

        {outsideShare > 0.25 && (
          <Warning>
            {percent(outsideShare, 0)} of visits come from towns outside the listed service areas.
            On a paid campaign that is money spent on people who cannot be served — tighten the
            location targeting, or add the towns to the service area list if they should be
            covered.
          </Warning>
        )}

        <Panel
          title="Where the visits were"
          subtitle="Every located visit, on one map. Area is the number of visits."
        >
          {points.length === 0 ? (
            <Empty>No located visits in this window.</Empty>
          ) : (
            <UsMap points={points} initialView={searchParams.view === 'oc' ? 'oc' : 'us'} />
          )}
          <Hint>
            The shape matters more than any single dot. A cluster around the HQ mark is demand
            somebody can drive to; a scatter across the country is traffic that can never become
            a job, and on a paid campaign it is money leaving.
          </Hint>
        </Panel>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Visits by town" subtitle="Resolved from the visitor's address at the edge">
            {cities.length === 0 ? (
              <Empty>No visits recorded yet.</Empty>
            ) : (
              <RankedBars
                items={cities.slice(0, 15).map((row) => ({
                  label: `${row.city}${row.region ? `, ${row.region}` : ''}`,
                  value: row.sessions,
                  color: served.has(row.city.toLowerCase()) ? SERIES[0] : '#a9a196',
                  note: row.conversions ? `${row.conversions} converted` : undefined,
                }))}
              />
            )}
            <Hint>
              Grey bars are towns not on the service area list. Blue ones are places the business
              says it covers.
            </Hint>
          </Panel>

          <Panel title="Leads by ZIP" subtitle="Taken from what people typed, not from their IP">
            {zips.length === 0 ? (
              <Empty>No leads with a ZIP code yet.</Empty>
            ) : (
              <Table className="min-w-0">
                <thead>
                  <tr>
                    <Th>ZIP</Th>
                    <Th>Town</Th>
                    <Th numeric>Leads</Th>
                    <Th numeric>Won</Th>
                    <Th numeric>Revenue</Th>
                  </tr>
                </thead>
                <tbody>
                  {zips.map((row) => (
                    <tr key={`${row.zip}-${row.city}`}>
                      <Td className="font-mono text-xs">{row.zip}</Td>
                      <Td>{row.city || '—'}</Td>
                      <Td numeric>{count(row.leads)}</Td>
                      <Td numeric>{count(row.won)}</Td>
                      <Td numeric>{row.revenueCents ? money(row.revenueCents) : '—'}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
            <Hint>
              A ZIP that produces plenty of leads but no won jobs is usually a drive time problem,
              not a marketing one.
            </Hint>
          </Panel>
        </div>

        <Panel title="Every town" subtitle="Including the ones outside the service area">
          {cities.length === 0 ? (
            <Empty>No visits recorded yet.</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Town</Th>
                  <Th>Region</Th>
                  <Th numeric>Visits</Th>
                  <Th numeric>Converted</Th>
                  <Th numeric>Rate</Th>
                  <Th>Served</Th>
                </tr>
              </thead>
              <tbody>
                {cities.map((row) => (
                  <tr key={`${row.city}-${row.region}`}>
                    <Td>{row.city}</Td>
                    <Td>{row.region || '—'}</Td>
                    <Td numeric>{count(row.sessions)}</Td>
                    <Td numeric>{count(row.conversions)}</Td>
                    <Td numeric>
                      {row.sessions ? percent(row.conversions / row.sessions) : '—'}
                    </Td>
                    <Td>{served.has(row.city.toLowerCase()) ? 'Yes' : '—'}</Td>
                  </tr>
                ))}
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
