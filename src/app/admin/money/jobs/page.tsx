import Link from 'next/link';
import { parseRange } from '@/lib/admin/range';
import { count, money, shortDate } from '@/lib/admin/format';
import { getJobs } from '@/lib/money/client';
import { OperationsApiError } from '@/lib/bookings/client';
import { Empty, Hint, Panel, SetupNotice, StatTile, StatusPill, Table, Td, Th, Warning } from '@/components/admin/ui';
import { NotConnected } from '@/components/admin/NotConnected';
import { Pager } from '@/components/admin/Pager';
import { serverTranslator } from '@/lib/i18n/server';
import { rangeLabel } from '@/lib/i18n/range';

export const dynamic = 'force-dynamic';

/**
 * Whatever a figure on another screen was made of.
 *
 * Every money page links in here with its own filters, so a number can always
 * be taken apart. There is no nav entry: this is a destination, not a place.
 */
export default async function JobsPage({
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

  const filters = {
    brandId: (searchParams.brandId as string) || undefined,
    techId: (searchParams.techId as string) || undefined,
    status: (searchParams.status as string) || undefined,
    paymentStatus: (searchParams.paymentStatus as string) || undefined,
    offset: Number(searchParams.offset ?? 0) || 0,
  };
  const backTo = (searchParams.back as string) || '/admin/money';

  let report: Awaited<ReturnType<typeof getJobs>> | null = null;
  let unconfigured = false;
  let failure: string | null = null;

  try {
    report = await getJobs(range.from, range.to, filters);
  } catch (error) {
    if (error instanceof OperationsApiError) {
      if (error.code === 'not_configured') unconfigured = true;
      else failure = error.message;
    } else {
      return <SetupNotice error={error} />;
    }
  }

  // The title is written by whichever screen linked here, in the language that
  // screen was being read in.
  const title = (searchParams.title as string) || t('money.jobsPageTitle');

  if (unconfigured) {
    return (
      <div className="space-y-6">
        <Header title={title} subtitle={rangeLabel(range, t)} backTo={backTo} />
        <NotConnected what={t('money.notConnected')} />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-6">
        <Header title={title} subtitle={rangeLabel(range, t)} backTo={backTo} />
        <Warning>{failure ?? t('money.noAnswer')}</Warning>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header title={title} subtitle={rangeLabel(range, t)} backTo={backTo} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label={t('money.jobs')} value={count(report.totals.jobs, t.lang)} emphasis />
        <StatTile label={t('common.billed')} value={money(report.totals.billedCents, t.lang)} />
        <StatTile
          label={t('common.kept')}
          value={money(report.totals.ownShareCents, t.lang)}
          emphasis
          hint={t('money.afterDispatchersShare')}
        />
        <StatTile
          label={t('money.avgTicket')}
          value={
            report.totals.jobs
              ? money(Math.round(report.totals.ownShareCents / report.totals.jobs), t.lang)
              : '—'
          }
        />
      </div>

      <Panel title={t('money.everyJobBehind')} subtitle={t('payments.newestFirst')}>
        {report.jobs.length === 0 ? (
          <Empty>{t('money.noJobsMatch')}</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t('unpaid.finished')}</Th>
                <Th>{t('common.client')}</Th>
                <Th>{t('common.job')}</Th>
                <Th>{t('common.company')}</Th>
                <Th>{t('common.status')}</Th>
                <Th numeric>{t('common.billed')}</Th>
                <Th numeric>{t('common.kept')}</Th>
              </tr>
            </thead>
            <tbody>
              {report.jobs.map((job) => (
                <tr key={job.id}>
                  <Td className="text-gray-600">
                    {job.completedAt ? shortDate(new Date(job.completedAt), t.lang) : '—'}
                  </Td>
                  <Td>{job.clientName ?? '—'}</Td>
                  <Td>
                    <Link
                      href={`/admin/calendar/${job.id}`}
                      className="text-ink underline decoration-primary-500/40 underline-offset-2 hover:text-primary-600"
                    >
                      {job.jobNumber ?? t('common.job')}
                    </Link>
                    {job.type ? <span className="ml-2 text-[11px] text-gray-500">{job.type}</span> : null}
                  </Td>
                  <Td className="text-gray-600">{job.brandName}</Td>
                  <Td>
                    <StatusPill status={job.paymentStatus} />
                  </Td>
                  <Td numeric>{money(job.totalCents, t.lang)}</Td>
                  <Td numeric className="font-medium">
                    {money(job.ownShareCents, t.lang)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <Pager
          // Everything that got us here, minus the page marker — otherwise
          // paging forward twice compounds the offset onto itself.
          base={`/admin/money/jobs?${new URLSearchParams(
            Object.entries(searchParams).flatMap(([key, value]) =>
              key !== 'offset' && typeof value === 'string' && value ? [[key, value] as [string, string]] : []
            )
          ).toString()}`}
          offset={report.offset}
          shown={report.jobs.length}
          hasMore={report.hasMore}
        />
        <Hint>{t('money.jobsHint')}</Hint>
      </Panel>
    </div>
  );
}

function Header({ title, subtitle, backTo }: { title: string; subtitle: string; backTo: string }) {
  const t = serverTranslator();
  return (
    <div>
      <Link
        href={backTo}
        className="font-heading text-[10px] uppercase tracking-label text-gray-500 hover:text-ink"
      >
        {t('common.back')}
      </Link>
      <h1 className="mt-1 font-heading text-xl font-bold uppercase tracking-label text-ink">
        {title}
      </h1>
      <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
    </div>
  );
}
