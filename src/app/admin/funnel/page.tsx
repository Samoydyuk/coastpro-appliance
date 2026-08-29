import { parseRange } from '@/lib/admin/range';
import { getDevices, getFunnel, getFunnelDetail, getHourHeatmap } from '@/lib/admin/queries';
import { count, duration, percent } from '@/lib/admin/format';
import { serverTranslator } from '@/lib/i18n/server';
import type { Translator } from '@/lib/i18n';
import { Empty, Hint, Panel, SetupNotice, Table, Td, Th } from '@/components/admin/ui';
import { Funnel, Heatmap, RankedBars } from '@/components/admin/charts';
import { SERIES, STATUS } from '@/components/admin/palette';
import { rangeLabel } from '@/lib/i18n/range';

export const dynamic = 'force-dynamic';

/** The value in the database stays 'mobile' / 'tablet' / 'desktop'. */
function deviceLabel(t: Translator, device: string): string {
  switch (device) {
    case 'mobile':
      return t('website.device.mobile');
    case 'tablet':
      return t('website.device.tablet');
    case 'desktop':
      return t('website.device.desktop');
    case 'unknown':
      return t('website.device.unknown');
    default:
      return device;
  }
}

export default async function FunnelPage({
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
          <h1 className="font-heading text-xl font-bold uppercase tracking-label text-ink">
            {t('website.funnel.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-600">{rangeLabel(range, t)}</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
          <Panel title={t('website.funnel.stages')} subtitle={t('website.funnel.stagesSub')}>
            <Funnel stages={stages} />
            <Hint>{t('website.funnel.stagesHint')}</Hint>
          </Panel>

          <div className="space-y-4">
            <Panel title={t('website.funnel.howFast')}>
              <p className="font-heading text-3xl font-bold tabular-nums text-ink">
                {detail.medianTimeToLead === null ? '—' : duration(detail.medianTimeToLead)}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                {t('website.funnel.medianLine', {
                  leads: t.plural(detail.measuredLeads, 'website.plural.lead'),
                })}
              </p>
              <Hint>{t('website.funnel.howFastHint')}</Hint>
            </Panel>

            <Panel title={t('website.funnel.byDevice')}>
              {byDevice.size === 0 ? (
                <Empty>{t('website.funnel.noVisits')}</Empty>
              ) : (
                <Table className="min-w-0">
                  <thead>
                    <tr>
                      <Th>{t('website.funnel.device')}</Th>
                      <Th numeric>{t('website.funnel.visits')}</Th>
                      <Th numeric>{t('website.funnel.converted')}</Th>
                      <Th numeric>{t('website.funnel.rate')}</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...byDevice.entries()]
                      .sort((a, b) => b[1].sessions - a[1].sessions)
                      .map(([device, entry]) => (
                        // Keyed on the stored value, not on the label, so the
                        // rows survive a change of language.
                        <tr key={device}>
                          <Td>{deviceLabel(t, device)}</Td>
                          <Td numeric>{count(entry.sessions, t.lang)}</Td>
                          <Td numeric>{count(entry.conversions, t.lang)}</Td>
                          <Td numeric>
                            {entry.sessions
                              ? percent(entry.conversions / entry.sessions, 1, t.lang)
                              : '—'}
                          </Td>
                        </tr>
                      ))}
                  </tbody>
                </Table>
              )}
            </Panel>
          </div>
        </div>

        <Panel title={t('website.funnel.whenAsk')} subtitle={t('website.funnel.whenAskSub')}>
          <Heatmap cells={heatmap} />
          <Hint>{t('website.funnel.whenAskHint')}</Hint>
        </Panel>

        <div className="grid gap-4 lg:grid-cols-3">
          <Panel title={t('website.funnel.abandoned')} subtitle={t('website.funnel.abandonedSub')}>
            {detail.lastField.length === 0 ? (
              <Empty>{t('website.funnel.abandonedEmpty')}</Empty>
            ) : (
              <RankedBars
                items={detail.lastField.map((row) => ({
                  // The label is the form field's own name, recorded by the
                  // site as it happened — data, not console wording.
                  label: row.label,
                  value: row.abandoned,
                  color: SERIES[1],
                }))}
              />
            )}
          </Panel>

          <Panel title={t('website.funnel.complaints')} subtitle={t('website.funnel.complaintsSub')}>
            {detail.errors.length === 0 ? (
              <Empty>{t('website.funnel.complaintsEmpty')}</Empty>
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

          <Panel title={t('website.funnel.friction')} subtitle={t('website.funnel.frictionSub')}>
            {detail.friction.length === 0 ? (
              <Empty>{t('website.funnel.frictionEmpty')}</Empty>
            ) : (
              <RankedBars
                items={detail.friction.map((row) => ({
                  label: `${
                    row.type === 'rage_click' ? t('website.funnel.rage') : t('website.funnel.error')
                  } · ${row.path}`,
                  value: row.total,
                  color: STATUS.critical,
                }))}
              />
            )}
            <Hint>{t('website.funnel.frictionHint')}</Hint>
          </Panel>
        </div>
      </div>
    );
  } catch (error) {
    return <SetupNotice error={error} />;
  }
}
