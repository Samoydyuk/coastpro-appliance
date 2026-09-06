import Link from 'next/link';
import { getReconciliation, type Reconciliation } from '@/lib/ihord/client';
import { getChecks } from '@/lib/ihord/checks';
import { getJobMedia, type JobPaperwork } from '@/lib/money/client';
import { OperationsApiError } from '@/lib/bookings/client';
import { Panel, SetupNotice, Warning } from '@/components/admin/ui';
import { IhordChecklist, type ChecklistRow } from '@/components/admin/IhordChecklist';
import { serverTranslator } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

/**
 * The checklist half of the dispatcher reconciliation.
 *
 * Its own page rather than a fifth panel on the summary. They are two different
 * jobs: the summary is read in twenty seconds to find out whether anything is
 * wrong, and this is worked through an hour at a time. Putting a hundred
 * expandable rows under the summary would bury the four figures the summary
 * exists to show.
 *
 * The tick marks are this console's own, so they come from this console's
 * database — everything else on the page is read from the sync service and
 * JobPocket, and none of it is written to.
 */

const PERIODS = [
  { key: 'thisMonth', label: 'ihord.period.thisMonth' },
  { key: 'lastMonth', label: 'ihord.period.lastMonth' },
  { key: 'all', label: 'ihord.period.all' },
] as const;

export default async function IhordWorklistPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const t = serverTranslator();
  const period = (searchParams.period as string) || 'thisMonth';

  let report: Reconciliation | null = null;
  let building = false;
  let failure: string | null = null;

  try {
    const answer = await getReconciliation(period);
    if (!('builtAt' in answer)) building = true;
    else report = answer;
  } catch (error) {
    if (error instanceof OperationsApiError) failure = error.message;
    else return <SetupNotice error={error} />;
  }

  const header = (
    <div>
      <h1 className="font-heading text-xl font-bold uppercase tracking-label text-ink">
        {t('ihord.list.title')}
      </h1>
      <p className="mt-1 text-sm text-gray-600">{t('ihord.list.subtitle')}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Link
          href={`/admin/money/ihord?period=${period}`}
          className="rounded-card border border-primary-500/25 px-3 py-1.5 font-heading text-[10px] font-semibold uppercase tracking-label text-gray-600 transition-colors hover:border-ink hover:text-ink"
        >
          {t('ihord.tab.summary')}
        </Link>
        <span className="rounded-card border border-ink bg-ink px-3 py-1.5 font-heading text-[10px] font-semibold uppercase tracking-label text-cream">
          {t('ihord.tab.worklist')}
        </span>
        <span className="mx-1 h-4 w-px bg-primary-500/25" aria-hidden />
        {PERIODS.map((option) => (
          <Link
            key={option.key}
            href={`/admin/money/ihord/worklist?period=${option.key}`}
            className={`rounded-card border px-3 py-1.5 font-heading text-[10px] font-semibold uppercase tracking-label transition-colors ${
              period === option.key
                ? 'border-ink bg-ink text-cream'
                : 'border-primary-500/25 text-gray-600 hover:border-ink hover:text-ink'
            }`}
          >
            {t(option.label)}
          </Link>
        ))}
      </div>
    </div>
  );

  if (building) {
    return (
      <div className="space-y-6">
        {header}
        <Panel title={t('ihord.buildingTitle')}>
          <p className="text-sm text-gray-600">{t('ihord.buildingBody')}</p>
          <Link
            href={`/admin/money/ihord/worklist?period=${period}`}
            className="mt-3 inline-flex h-8 items-center rounded-card border border-primary-500/30 px-3 font-heading text-[10px] font-semibold uppercase tracking-label text-gray-600 hover:border-ink hover:text-ink"
          >
            {t('ihord.buildingRetry')}
          </Link>
        </Panel>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-6">
        {header}
        <Warning>{failure ?? t('ihord.notConnected')}</Warning>
      </div>
    );
  }

  const jobs = report.jobs ?? [];

  /**
   * The ticks are the one thing here that cannot fail quietly.
   *
   * Photographs are an icon and the reconciliation survives losing them, so
   * that read is allowed to give up. A checklist that forgot which rows were
   * already done would invite the whole afternoon to be repeated, so if the
   * database is unreachable the page says so instead.
   */
  const checks = await getChecks();
  const media = await getJobMedia(
    jobs.map((job) => job.jpJobId).filter((id): id is string => Boolean(id))
  ).catch(() => ({ jobs: {} as Record<string, JobPaperwork> }));

  const rows: ChecklistRow[] = jobs.map((job) => {
    const paperwork = job.jpJobId ? media.jobs[job.jpJobId] : undefined;
    const tick = checks.get(job.jobNumber);
    return {
      jobNumber: job.jobNumber,
      invoiceNumber: job.invoiceNumber,
      customer: job.customer,
      date: job.date,
      soldCents: job.soldCents,
      partsCents: job.partsCents,
      toYouCents: job.toYouCents,
      settled: job.settled,
      jpJobId: job.jpJobId,
      jpStatus: job.jpStatus,
      // Optional on the wire: this page and the sync service deploy separately,
      // and a service that has not shipped the detail yet must leave the row
      // thin rather than crash the screen.
      card: job.card ?? null,
      theirInvoices: job.theirInvoices ?? [],
      ihordJobId: job.ihordJobId ?? null,
      flags: job.flags ?? [],
      photos: paperwork?.photos ?? 0,
      scans: paperwork?.scans ?? 0,
      checked: tick?.checked ?? false,
      note: tick?.note ?? null,
      partsCostCents: tick?.partsCostCents ?? null,
      checkedAt: tick?.checkedAt ?? null,
    };
  });

  return (
    <div className="space-y-6">
      {header}
      <IhordChecklist
        rows={rows}
        period={period}
        cardsUnavailable={report.counts?.cardsUnavailable ?? 0}
      />
    </div>
  );
}
