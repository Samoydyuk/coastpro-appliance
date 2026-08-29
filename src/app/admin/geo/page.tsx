import { parseRange } from '@/lib/admin/range';
import { getGeo } from '@/lib/admin/queries';
import { count, money, percent } from '@/lib/admin/format';
import { serverTranslator } from '@/lib/i18n/server';
import { serviceAreas } from '@/data/service-areas';
import { Empty, Hint, Panel, SetupNotice, Table, Td, Th, Warning } from '@/components/admin/ui';
import { RankedBars } from '@/components/admin/charts';
import { UsMap } from '@/components/admin/UsMap';
import { SERIES } from '@/components/admin/palette';
import { rangeLabel } from '@/lib/i18n/range';

export const dynamic = 'force-dynamic';

export default async function GeoPage({
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

  try {
    const { cities, zips, points } = await getGeo(range);

    const served = new Set(serviceAreas.map((area) => area.name.toLowerCase()));
    // 'Unknown' is what the query puts in the column when the edge could not
    // place the visit — a stored value, matched here and labelled below.
    const outside = cities.filter(
      (row) => row.city !== 'Unknown' && !served.has(row.city.toLowerCase())
    );
    const outsideShare =
      cities.reduce((sum, row) => sum + row.sessions, 0) > 0
        ? outside.reduce((sum, row) => sum + row.sessions, 0) /
          cities.reduce((sum, row) => sum + row.sessions, 0)
        : 0;

    const townName = (city: string) => (city === 'Unknown' ? t('website.geo.unknownCity') : city);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-xl font-bold uppercase tracking-label text-ink">
            {t('website.geo.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-600">{rangeLabel(range, t)}</p>
        </div>

        {outsideShare > 0.25 && (
          <Warning>
            {t('website.geo.outsideWarning', { pct: percent(outsideShare, 0, t.lang) })}
          </Warning>
        )}

        <Panel title={t('website.geo.map')} subtitle={t('website.geo.mapSub')}>
          {points.length === 0 ? (
            <Empty>{t('website.geo.mapEmpty')}</Empty>
          ) : (
            <UsMap points={points} initialView={searchParams.view === 'oc' ? 'oc' : 'us'} />
          )}
          <Hint>{t('website.geo.mapHint')}</Hint>
        </Panel>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title={t('website.geo.byTown')} subtitle={t('website.geo.byTownSub')}>
            {cities.length === 0 ? (
              <Empty>{t('website.geo.noVisits')}</Empty>
            ) : (
              <RankedBars
                items={cities.slice(0, 15).map((row) => ({
                  label: `${townName(row.city)}${row.region ? `, ${row.region}` : ''}`,
                  value: row.sessions,
                  color: served.has(row.city.toLowerCase()) ? SERIES[0] : '#a9a196',
                  note: row.conversions
                    ? t('website.geo.convertedNote', { n: count(row.conversions, t.lang) })
                    : undefined,
                }))}
              />
            )}
            <Hint>{t('website.geo.byTownHint')}</Hint>
          </Panel>

          <Panel title={t('website.geo.byZip')} subtitle={t('website.geo.byZipSub')}>
            {zips.length === 0 ? (
              <Empty>{t('website.geo.noZips')}</Empty>
            ) : (
              <Table className="min-w-0">
                <thead>
                  <tr>
                    <Th>{t('website.geo.zip')}</Th>
                    <Th>{t('website.geo.town')}</Th>
                    <Th numeric>{t('website.geo.leads')}</Th>
                    <Th numeric>{t('website.geo.won')}</Th>
                    <Th numeric>{t('website.geo.revenue')}</Th>
                  </tr>
                </thead>
                <tbody>
                  {zips.map((row) => (
                    <tr key={`${row.zip}-${row.city}`}>
                      <Td className="font-mono text-xs">{row.zip}</Td>
                      <Td>{row.city || '—'}</Td>
                      <Td numeric>{count(row.leads, t.lang)}</Td>
                      <Td numeric>{count(row.won, t.lang)}</Td>
                      <Td numeric>{row.revenueCents ? money(row.revenueCents, t.lang) : '—'}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
            <Hint>{t('website.geo.byZipHint')}</Hint>
          </Panel>
        </div>

        <Panel title={t('website.geo.everyTown')} subtitle={t('website.geo.everyTownSub')}>
          {cities.length === 0 ? (
            <Empty>{t('website.geo.noVisits')}</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>{t('website.geo.town')}</Th>
                  <Th>{t('website.geo.region')}</Th>
                  <Th numeric>{t('website.geo.visits')}</Th>
                  <Th numeric>{t('website.geo.converted')}</Th>
                  <Th numeric>{t('website.geo.rate')}</Th>
                  <Th>{t('website.geo.served')}</Th>
                </tr>
              </thead>
              <tbody>
                {cities.map((row) => (
                  <tr key={`${row.city}-${row.region}`}>
                    <Td>{townName(row.city)}</Td>
                    <Td>{row.region || '—'}</Td>
                    <Td numeric>{count(row.sessions, t.lang)}</Td>
                    <Td numeric>{count(row.conversions, t.lang)}</Td>
                    <Td numeric>
                      {row.sessions ? percent(row.conversions / row.sessions, 1, t.lang) : '—'}
                    </Td>
                    <Td>{served.has(row.city.toLowerCase()) ? t('website.geo.servedYes') : '—'}</Td>
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
