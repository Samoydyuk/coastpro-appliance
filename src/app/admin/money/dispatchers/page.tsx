import Link from 'next/link';
import { parseRange } from '@/lib/admin/range';
import { count, money, percent } from '@/lib/admin/format';
import { getByCompany } from '@/lib/money/client';
import { OperationsApiError } from '@/lib/bookings/client';
import { Empty, Hint, Panel, SetupNotice, StatTile, Table, Td, Th, Warning } from '@/components/admin/ui';
import { NotConnected } from '@/components/admin/NotConnected';
import { RankedBars } from '@/components/admin/charts';
import { SERIES } from '@/components/admin/palette';
import { serverTranslator } from '@/lib/i18n/server';
import { rangeLabel } from '@/lib/i18n/range';

export const dynamic = 'force-dynamic';

export default async function DispatchersPage({
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

  let report: Awaited<ReturnType<typeof getByCompany>> | null = null;
  let unconfigured = false;
  let failure: string | null = null;

  try {
    report = await getByCompany(range.from, range.to);
  } catch (error) {
    if (error instanceof OperationsApiError) {
      if (error.code === 'not_configured') unconfigured = true;
      else failure = error.message;
    } else {
      return <SetupNotice error={error} />;
    }
  }

  if (unconfigured) {
    return (
      <div className="space-y-6">
        <Header label={rangeLabel(range, t)} subtitle="" />
        <NotConnected what={t('money.notConnected')} />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-6">
        <Header label={rangeLabel(range, t)} subtitle="" />
        <Warning>{failure ?? t('money.noAnswer')}</Warning>
      </div>
    );
  }

  const rows = report.companies;
  const own = rows.filter((row) => row.brandId === null);
  const dispatched = rows.filter((row) => row.brandId !== null);

  const sum = (list: typeof rows, key: 'billedCents' | 'ownShareCents' | 'jobs') =>
    list.reduce((total, row) => total + (row[key] as number), 0);

  const dispatchedBilled = sum(dispatched, 'billedCents');
  const dispatchedKept = sum(dispatched, 'ownShareCents');
  const totalJobs = sum(rows, 'jobs');
  const dispatchedJobs = sum(dispatched, 'jobs');

  // Said before any number, because every figure below reads differently once
  // you know most of the calendar carries somebody else's name.
  const subtitle =
    totalJobs === 0
      ? rangeLabel(range, t)
      : `${rangeLabel(range, t)} · ` +
        t('money.dispatchedShareOfWork', {
          pct: percent(dispatchedJobs / totalJobs, 0, t.lang),
          own: count(totalJobs - dispatchedJobs, t.lang),
          total: count(totalJobs, t.lang),
        });

  return (
    <div className="space-y-6">
      <Header label={rangeLabel(range, t)} subtitle={subtitle} />
      {failure ? <Warning>{failure}</Warning> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label={t('dispatchers.ownWork')}
          value={money(sum(own, 'ownShareCents'), t.lang)}
          emphasis
        />
        <StatTile
          label={t('dispatchers.keptFrom')}
          value={money(dispatchedKept, t.lang)}
          emphasis
          hint={
            dispatchedBilled
              ? t('money.centsOnDollar', {
                  cents: count(Math.round((dispatchedKept / dispatchedBilled) * 100), t.lang),
                })
              : undefined
          }
        />
        <StatTile
          label={t('dispatchers.dispatchedBilled')}
          value={money(dispatchedBilled, t.lang)}
          hint={t('money.whatCustomersCharged')}
        />
        <StatTile label={t('dispatchers.jobsDispatched')} value={count(dispatchedJobs, t.lang)} />
      </div>

      <Panel title={t('dispatchers.keptBy')} subtitle={t('money.rankedOnSurvives')}>
        {rows.length === 0 ? (
          <Empty>{t('money.noFinishedWork')}</Empty>
        ) : (
          <RankedBars
            format="money"
            items={rows.map((row) => ({
              label: row.name,
              value: row.ownShareCents / 100,
              // One hue: dispatchers are not marketing channels, and borrowing
              // that palette would imply a connection that does not exist.
              color: SERIES[0]!,
              note:
                t('money.keptOfBilled', {
                  pct: row.keptPct === null ? '—' : percent(row.keptPct / 100, 0, t.lang),
                  billed: money(row.billedCents, t.lang),
                }) +
                ' · ' +
                t.plural(row.jobs, 'plural.job'),
            }))}
          />
        )}
        <Hint>{t('money.keptRankHint')}</Hint>
      </Panel>

      <Panel
        title={t('dispatchers.every')}
        subtitle={t('money.whatDealReturns')}
        action={<a
              href={`/api/admin/export?type=dispatchers&range=${range.key}`}
              className="inline-flex h-8 items-center rounded-card border border-primary-500/30 px-3 font-heading text-[10px] font-semibold uppercase tracking-label text-gray-600 hover:border-ink hover:text-ink"
            >
              {t('common.exportCsv')}
            </a>}
      >
        {rows.length === 0 ? (
          <Empty>{t('money.noFinishedWork')}</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t('common.company')}</Th>
                <Th numeric>{t('common.jobs')}</Th>
                <Th numeric>{t('common.billed')}</Th>
                <Th numeric>{t('dispatchers.theirCut')}</Th>
                <Th numeric>{t('common.kept')}</Th>
                <Th numeric>{t('dispatchers.keptPct')}</Th>
                <Th numeric>{t('money.avgTicketShort')}</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.brandId ?? 'own'}>
                  <Td>
                    <Link
                      href={`/admin/money/jobs?range=${range.key}&brandId=${row.brandId ?? 'own'}&title=${encodeURIComponent(row.name)}&back=/admin/money/dispatchers`}
                      className="text-ink underline decoration-primary-500/40 underline-offset-2 hover:text-primary-600"
                    >
                      {row.name}
                    </Link>
                    {row.revenueSharePct !== null ? (
                      <span className="ml-2 text-[11px] text-gray-500">
                        {percent(row.revenueSharePct / 100, 0, t.lang)}
                        {row.reimbursesParts ? t('money.partsBack') : ''}
                      </span>
                    ) : null}
                  </Td>
                  <Td numeric>{count(row.jobs, t.lang)}</Td>
                  <Td numeric>{money(row.billedCents, t.lang)}</Td>
                  <Td numeric className="text-gray-600">
                    {money(row.billedCents - row.ownShareCents, t.lang)}
                  </Td>
                  <Td numeric className="font-medium">
                    {money(row.ownShareCents, t.lang)}
                  </Td>
                  <Td numeric>
                    {row.keptPct === null ? '—' : percent(row.keptPct / 100, 0, t.lang)}
                  </Td>
                  <Td numeric className="text-gray-600">
                    {row.jobs ? money(Math.round(row.ownShareCents / row.jobs), t.lang) : '—'}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <Hint>{t('money.keptPctHint')}</Hint>
      </Panel>
    </div>
  );
}

function Header({ label, subtitle }: { label: string; subtitle: string }) {
  const t = serverTranslator();
  return (
    <div>
      <h1 className="font-heading text-xl font-bold uppercase tracking-label text-ink">
        {t('dispatchers.title')}
      </h1>
      <p className="mt-1 text-sm text-gray-600">{subtitle || label}</p>
    </div>
  );
}
