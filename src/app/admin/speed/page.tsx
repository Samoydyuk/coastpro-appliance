import { parseRange } from '@/lib/admin/range';
import { getVitals } from '@/lib/admin/queries';
import { count, percent } from '@/lib/admin/format';
import { Empty, Hint, Panel, SetupNotice, Table, Td, Th } from '@/components/admin/ui';
import { STATUS } from '@/components/admin/palette';

export const dynamic = 'force-dynamic';

const METRICS: Record<string, { name: string; explain: string; good: number; poor: number; unit: string }> = {
  LCP: {
    name: 'Largest paint',
    explain: 'How long until the main thing on the page is visible.',
    good: 2500,
    poor: 4000,
    unit: 'ms',
  },
  INP: {
    name: 'Response to taps',
    explain: 'How long the page takes to react when someone touches it.',
    good: 200,
    poor: 500,
    unit: 'ms',
  },
  CLS: {
    name: 'Layout shift',
    explain: 'How much the page jumps around while loading.',
    good: 0.1,
    poor: 0.25,
    unit: '',
  },
  FCP: {
    name: 'First paint',
    explain: 'How long until anything at all appears.',
    good: 1800,
    poor: 3000,
    unit: 'ms',
  },
  TTFB: {
    name: 'Server response',
    explain: 'How long the server takes to start answering.',
    good: 800,
    poor: 1800,
    unit: 'ms',
  },
};

function verdict(metric: string, value: number) {
  const spec = METRICS[metric];
  if (!spec) return { label: 'unknown', color: STATUS.warning };
  if (value <= spec.good) return { label: 'Good', color: '#006300' };
  if (value <= spec.poor) return { label: 'Needs work', color: STATUS.warning };
  return { label: 'Poor', color: STATUS.critical };
}

export default async function SpeedPage({
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
            Page speed
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {range.label} — measured on real visitors&apos; devices, not in a lab
          </p>
        </div>

        <Hint>
          These are the same measurements Google scores a landing page on. A slow page does not
          only lose visitors: it raises the price of every click on the ad that points at it, so
          this screen sits next to the spend for a reason.
        </Hint>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Object.keys(METRICS).map((metric) => {
            const row = overall.find((entry) => entry.metric === metric);
            const spec = METRICS[metric]!;
            const state = row ? verdict(metric, row.p75) : null;
            return (
              <div
                key={metric}
                className="rounded-card border border-primary-500/20 bg-[#fcfcfb] px-5 py-4"
              >
                <p className="font-heading text-[10px] font-semibold uppercase tracking-label text-gray-500">
                  {spec.name}
                </p>
                <p className="mt-2 font-heading text-2xl font-bold tabular-nums text-ink">
                  {row ? `${row.p75}${spec.unit}` : '—'}
                </p>
                {state && (
                  <p className="mt-1 text-xs font-semibold" style={{ color: state.color }}>
                    {state.label}
                  </p>
                )}
                <p className="mt-2 text-xs leading-snug text-gray-500">{spec.explain}</p>
                {row && (
                  <p className="mt-1 text-[11px] text-gray-400">
                    {count(row.samples)} samples · {percent(row.good / row.samples, 0)} good
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <Panel title="By page" subtitle="75th percentile — the figure Google scores on">
          {pages.size === 0 ? (
            <Empty>
              No measurements yet. They start arriving as soon as real visitors load pages with the
              tracker on.
            </Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Page</Th>
                  <Th numeric>Largest paint</Th>
                  <Th numeric>Tap response</Th>
                  <Th numeric>Layout shift</Th>
                  <Th numeric>Samples</Th>
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
                          <span style={{ color: verdict('LCP', metrics.LCP).color }}>
                            {Math.round(metrics.LCP)}ms
                          </span>
                        ) : (
                          '—'
                        )}
                      </Td>
                      <Td numeric>
                        {metrics.INP ? (
                          <span style={{ color: verdict('INP', metrics.INP).color }}>
                            {Math.round(metrics.INP)}ms
                          </span>
                        ) : (
                          '—'
                        )}
                      </Td>
                      <Td numeric>
                        {metrics.CLS !== undefined ? (
                          <span style={{ color: verdict('CLS', metrics.CLS).color }}>
                            {metrics.CLS.toFixed(3)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </Td>
                      <Td numeric>{count(metrics.samples ?? 0)}</Td>
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
