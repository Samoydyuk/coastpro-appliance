import { parseRange } from '@/lib/admin/range';
import { getVitals } from '@/lib/admin/queries';
import { count, percent } from '@/lib/admin/format';
import { numberLocale, type TranslationKey, type Translator } from '@/lib/i18n';
import { serverTranslator } from '@/lib/i18n/server';
import { Empty, Hint, Panel, SetupNotice, Table, Td, Th } from '@/components/admin/ui';
import { STATUS } from '@/components/admin/palette';
import { rangeLabel } from '@/lib/i18n/range';

export const dynamic = 'force-dynamic';

/**
 * The metric keys — LCP, INP, CLS — are what the browser reports and what the
 * table is keyed on. Only the name and the explanation are words, so those
 * live in the dictionary and the thresholds stay here.
 */
const METRICS: Record<
  string,
  { nameKey: TranslationKey; explainKey: TranslationKey; good: number; poor: number; ms: boolean }
> = {
  LCP: {
    nameKey: 'website.speed.lcp',
    explainKey: 'website.speed.lcpWhat',
    good: 2500,
    poor: 4000,
    ms: true,
  },
  INP: {
    nameKey: 'website.speed.inp',
    explainKey: 'website.speed.inpWhat',
    good: 200,
    poor: 500,
    ms: true,
  },
  CLS: {
    nameKey: 'website.speed.cls',
    explainKey: 'website.speed.clsWhat',
    good: 0.1,
    poor: 0.25,
    ms: false,
  },
  FCP: {
    nameKey: 'website.speed.fcp',
    explainKey: 'website.speed.fcpWhat',
    good: 1800,
    poor: 3000,
    ms: true,
  },
  TTFB: {
    nameKey: 'website.speed.ttfb',
    explainKey: 'website.speed.ttfbWhat',
    good: 800,
    poor: 1800,
    ms: true,
  },
};

function verdict(t: Translator, metric: string, value: number) {
  const spec = METRICS[metric];
  if (!spec) return { label: t('website.speed.verdictUnknown'), color: STATUS.warning };
  if (value <= spec.good) return { label: t('website.speed.verdictGood'), color: '#006300' };
  if (value <= spec.poor) return { label: t('website.speed.verdictNeedsWork'), color: STATUS.warning };
  return { label: t('website.speed.verdictPoor'), color: STATUS.critical };
}

/** Whole milliseconds and fractional layout shifts both, in the reader's number format. */
function figure(value: number, t: Translator): string {
  return value.toLocaleString(numberLocale(t.lang), { maximumFractionDigits: 3 });
}

export default async function SpeedPage({
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
    const { overall, byPage } = await getVitals(range);

    const pages = new Map<string, Record<string, number>>();
    byPage.forEach((row) => {
      const entry = pages.get(row.path) ?? {};
      entry[row.metric] = row.p75;
      entry.samples = Math.max(entry.samples ?? 0, row.samples);
      pages.set(row.path, entry);
    });

    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-xl font-bold uppercase tracking-label text-ink">
            {t('website.speed.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {t('website.speed.subtitle', { range: rangeLabel(range, t) })}
          </p>
        </div>

        <Hint>{t('website.speed.hint')}</Hint>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Object.keys(METRICS).map((metric) => {
            const row = overall.find((entry) => entry.metric === metric);
            const spec = METRICS[metric]!;
            const state = row ? verdict(t, metric, row.p75) : null;
            return (
              <div
                key={metric}
                className="rounded-card border border-primary-500/20 bg-[#fcfcfb] px-5 py-4"
              >
                <p className="font-heading text-[10px] font-semibold uppercase tracking-label text-gray-500">
                  {t(spec.nameKey)}
                </p>
                <p className="mt-2 font-heading text-2xl font-bold tabular-nums text-ink">
                  {row ? `${figure(row.p75, t)}${spec.ms ? t('website.speed.ms') : ''}` : '—'}
                </p>
                {state && (
                  <p className="mt-1 text-xs font-semibold" style={{ color: state.color }}>
                    {state.label}
                  </p>
                )}
                <p className="mt-2 text-xs leading-snug text-gray-500">{t(spec.explainKey)}</p>
                {row && (
                  <p className="mt-1 text-[11px] text-gray-400">
                    {t('website.speed.samplesLine', {
                      samples: t.plural(row.samples, 'website.plural.sample'),
                      pct: percent(row.good / row.samples, 0, t.lang),
                    })}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <Panel title={t('website.speed.byPage')} subtitle={t('website.speed.byPageSub')}>
          {pages.size === 0 ? (
            <Empty>{t('website.speed.noMeasurements')}</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>{t('website.speed.page')}</Th>
                  <Th numeric>{t('website.speed.colLcp')}</Th>
                  <Th numeric>{t('website.speed.colInp')}</Th>
                  <Th numeric>{t('website.speed.colCls')}</Th>
                  <Th numeric>{t('website.speed.colSamples')}</Th>
                </tr>
              </thead>
              <tbody>
                {[...pages.entries()]
                  .sort((a, b) => (b[1].LCP ?? 0) - (a[1].LCP ?? 0))
                  .map(([path, metrics]) => (
                    <tr key={path}>
                      <Td className="max-w-[320px] truncate font-mono text-xs">{path}</Td>
                      <Td numeric>
                        {metrics.LCP ? (
                          <span style={{ color: verdict(t, 'LCP', metrics.LCP).color }}>
                            {count(metrics.LCP, t.lang)}
                            {t('website.speed.ms')}
                          </span>
                        ) : (
                          '—'
                        )}
                      </Td>
                      <Td numeric>
                        {metrics.INP ? (
                          <span style={{ color: verdict(t, 'INP', metrics.INP).color }}>
                            {count(metrics.INP, t.lang)}
                            {t('website.speed.ms')}
                          </span>
                        ) : (
                          '—'
                        )}
                      </Td>
                      <Td numeric>
                        {metrics.CLS !== undefined ? (
                          <span style={{ color: verdict(t, 'CLS', metrics.CLS).color }}>
                            {metrics.CLS.toLocaleString(numberLocale(t.lang), {
                              minimumFractionDigits: 3,
                              maximumFractionDigits: 3,
                            })}
                          </span>
                        ) : (
                          '—'
                        )}
                      </Td>
                      <Td numeric>{count(metrics.samples ?? 0, t.lang)}</Td>
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
