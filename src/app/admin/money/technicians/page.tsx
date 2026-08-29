import Link from 'next/link';
import { parseRange } from '@/lib/admin/range';
import { count, money } from '@/lib/admin/format';
import { getByTechnician } from '@/lib/money/client';
import { getTeam, OperationsApiError } from '@/lib/bookings/client';
import { buildLanes } from '@/lib/bookings/lanes';
import { Empty, Hint, Panel, SetupNotice, StatTile, Table, Td, Th, Warning } from '@/components/admin/ui';
import { NotConnected } from '@/components/admin/NotConnected';
import { RankedBars } from '@/components/admin/charts';
import { NEUTRAL } from '@/components/admin/palette';
import { serverTranslator } from '@/lib/i18n/server';
import { rangeLabel } from '@/lib/i18n/range';

export const dynamic = 'force-dynamic';

export default async function TechniciansPage({
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

  let report: Awaited<ReturnType<typeof getByTechnician>> | null = null;
  let unconfigured = false;
  let failure: string | null = null;

  try {
    report = await getByTechnician(range.from, range.to);
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
        <Header subtitle={rangeLabel(range, t)} />
        <NotConnected what={t('money.notConnected')} />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-6">
        <Header subtitle={rangeLabel(range, t)} />
        <Warning>{failure ?? t('money.noAnswer')}</Warning>
      </div>
    );
  }

  // The roster only supplies colour, so a technician is the same colour here as
  // on the calendar board. Losing it costs nothing worth failing the page for.
  const team = await getTeam().catch(() => ({ members: [] }));
  const lanes = buildLanes(team.members);
  const colourFor = (techId: string | null) =>
    lanes.find((lane) => lane.id === techId)?.colour ?? NEUTRAL;

  const rows = report.technicians;
  const totalRevenue = rows.reduce((sum, row) => sum + row.ownShareRevenueCents, 0);
  const totalJobs = rows.reduce((sum, row) => sum + row.jobs, 0);

  return (
    <div className="space-y-6">
      {/* The credit rule is a sentence JobPocket writes about its own split. */}
      <Header subtitle={`${rangeLabel(range, t)} · ${report.creditRule}`} />
      {failure ? <Warning>{failure}</Warning> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label={t('money.ownRevenue')} value={money(totalRevenue, t.lang)} emphasis />
        <StatTile label={t('technicians.finished')} value={count(totalJobs, t.lang)} />
        <StatTile label={t('technicians.withWork')} value={count(rows.length, t.lang)} />
        <StatTile
          label={t('money.avgTicket')}
          value={totalJobs ? money(Math.round(totalRevenue / totalJobs), t.lang) : '—'}
          hint={t('money.afterDispatchersShare')}
        />
      </div>

      <Panel
        title={t('technicians.revenueBy')}
        action={
          <Link
            href={`/admin/money/technicians/profile?range=${range.key}`}
            className="inline-flex h-8 items-center rounded-card border border-primary-500/30 px-3 font-heading text-[10px] font-semibold uppercase tracking-label text-gray-600 hover:border-ink hover:text-ink"
          >
            {t('profile.title')}
          </Link>
        } subtitle={t('money.afterTheSplit')}>
        {rows.length === 0 ? (
          <Empty>{t('money.noFinishedWork')}</Empty>
        ) : (
          <RankedBars
            format="money"
            items={rows.map((row) => ({
              label: row.name,
              value: row.ownShareRevenueCents / 100,
              color: colourFor(row.techId),
              note:
                t.plural(row.jobs, 'plural.job') +
                ' · ' +
                t('money.avgEach', { amount: money(row.avgTicketCents, t.lang) }),
            }))}
          />
        )}
      </Panel>

      <Panel
        title={t('technicians.every')}
        subtitle={t('money.openTheWeek')}
        action={<a
              href={`/api/admin/export?type=technicians&range=${range.key}`}
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
                <Th>{t('money.technician')}</Th>
                <Th numeric>{t('common.jobs')}</Th>
                <Th numeric>{t('money.revenue')}</Th>
                <Th numeric>{t('money.avgTicketShort')}</Th>
                <Th numeric>{t('technicians.avgBooked')}</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.techId ?? 'you'}>
                  <Td>
                    {row.techId ? (
                      <Link
                        href={`/admin/calendar?view=week&who=${row.techId}`}
                        className="text-ink underline decoration-primary-500/40 underline-offset-2 hover:text-primary-600"
                      >
                        {row.name}
                      </Link>
                    ) : (
                      row.name
                    )}
                  </Td>
                  <Td numeric>{count(row.jobs, t.lang)}</Td>
                  <Td numeric className="font-medium">
                    {money(row.ownShareRevenueCents, t.lang)}
                  </Td>
                  <Td numeric>{money(row.avgTicketCents, t.lang)}</Td>
                  <Td numeric className="text-gray-600">
                    {row.avgEstimatedMinutes
                      ? t('money.minutes', { n: count(row.avgEstimatedMinutes, t.lang) })
                      : '—'}
                  </Td>
                  <Td numeric>
                    {row.techId ? (
                      <Link
                        href={`/admin/money/jobs?range=${range.key}&techId=${row.techId}&title=${encodeURIComponent(row.name)}&back=/admin/money/technicians`}
                        className="text-[11px] text-gray-500 underline underline-offset-2 hover:text-ink"
                      >
                        {t('money.jobsLink')}
                      </Link>
                    ) : null}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <Hint>{t('money.techRevenueOnlyHint')}</Hint>
      </Panel>
    </div>
  );
}

function Header({ subtitle }: { subtitle: string }) {
  const t = serverTranslator();
  return (
    <div>
      <h1 className="font-heading text-xl font-bold uppercase tracking-label text-ink">
        {t('technicians.title')}
      </h1>
      <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
    </div>
  );
}
