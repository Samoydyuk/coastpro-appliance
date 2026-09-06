import Link from 'next/link';
import { Camera, ScanLine } from 'lucide-react';
import { count, money, shortDate } from '@/lib/admin/format';
import { getReconciliation, type Reconciliation } from '@/lib/ihord/client';
import { getJobMedia, type JobPaperwork } from '@/lib/money/client';
import { OperationsApiError } from '@/lib/bookings/client';
import { Empty, Hint, Panel, SetupNotice, StatTile, Table, Td, Th, Warning } from '@/components/admin/ui';
import { serverTranslator } from '@/lib/i18n/server';
import { STATUS } from '@/components/admin/palette';

export const dynamic = 'force-dynamic';

/**
 * The dispatcher's books beside ours.
 *
 * Deliberately not "all time" by default. JobPocket started carrying this work
 * partway through, so every visit before that shows as "missing" — a hundred
 * rows of alarm about history nobody lost. A report that cries wolf on its
 * first screen never gets read again, so the window starts at this month and
 * widens on request.
 */
const PERIODS = [
  { key: 'thisMonth', label: 'This month' },
  { key: 'lastMonth', label: 'Last month' },
  { key: 'all', label: 'All time' },
] as const;

/**
 * Two marks: a camera for photographs, a page for the scanned paper invoice.
 *
 * Absence is the message — on a dispatched account the paper invoice is the
 * evidence the visit happened, and a row with neither mark is the one that
 * becomes an argument later. Greyed rather than hidden, so the gap is visible
 * without being read as an error.
 */
function Paperwork({
  media,
  t,
}: {
  media?: JobPaperwork;
  t: ReturnType<typeof serverTranslator>;
}) {
  const photos = media?.photos ?? 0;
  const scans = media?.scans ?? 0;

  const photoLabel = photos ? t('ihord.hasPhotos', { n: photos }) : t('ihord.noPhotos');
  const scanLabel = scans ? t('ihord.hasScan', { n: scans }) : t('ihord.noScan');
  // Present is ink, absent is a faint outline. Both are drawn, because a
  // missing icon reads as "this row is different" while a pale one reads as
  // "this row is missing something" — which is the actual message.
  const tone = (has: number) => (has ? 'text-ink' : 'text-primary-500/25');

  return (
    <span className="ml-2 inline-flex items-center gap-1.5 align-middle">
      <Camera className={`h-3.5 w-3.5 ${tone(photos)}`} aria-hidden>
        <title>{photoLabel}</title>
      </Camera>
      <ScanLine className={`h-3.5 w-3.5 ${tone(scans)}`} aria-hidden>
        <title>{scanLabel}</title>
      </ScanLine>
      <span className="sr-only">
        {photoLabel}. {scanLabel}.
      </span>
    </span>
  );
}

/**
 * How the money arrived, not merely whether it did.
 *
 * On a dispatched account those are different questions: a card payment lands
 * in an account and a cash one lands in somebody's pocket, and only one of
 * them settles itself. Unpaid says so plainly rather than showing a blank.
 */
function PaidHow({
  media,
  t,
}: {
  media?: JobPaperwork;
  t: ReturnType<typeof serverTranslator>;
}) {
  // Optional throughout: this page and the API deploy separately, and a field
  // that has not shipped yet must read as "unknown", never as a crash.
  const methods = media?.methods ?? [];
  if (!media) return <span className="text-gray-300">—</span>;
  if (methods.length === 0) {
    return (
      <span style={{ color: STATUS.warning }} className="text-[11px] font-medium">
        {t('ihord.unpaidHere')}
      </span>
    );
  }
  const label = (method: string) => {
    const words = method.toLowerCase().replace(/_/g, ' ');
    return words.charAt(0).toUpperCase() + words.slice(1);
  };
  return <span className="text-[11px]">{methods.map(label).join(', ')}</span>;
}

export default async function IhordPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const t = serverTranslator();
  const period = (searchParams.period as string) || 'thisMonth';

  let report: Reconciliation | null = null;
  let building = false;
  let failure: string | null = null;
  let unconfigured = false;

  try {
    const answer = await getReconciliation(period);
    // Nothing held yet: the first scrape of this window has just started.
    // Saying so beats a spinner that never resolves, and beats a page that
    // waits for two websites and is killed by the platform first.
    if (!('builtAt' in answer)) building = true;
    else report = answer;
  } catch (error) {
    if (error instanceof OperationsApiError) {
      if (error.code === 'not_configured') unconfigured = true;
      else failure = error.message;
    } else {
      return <SetupNotice error={error} />;
    }
  }

  const header = (
    <div>
      <h1 className="font-heading text-xl font-bold uppercase tracking-label text-ink">
        {t('ihord.title')}
      </h1>
      <p className="mt-1 text-sm text-gray-600">{t('ihord.subtitle')}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {/* Two ways of reading the same window: the four figures, or every visit
            in turn with somewhere to record that it has been checked. */}
        <span className="rounded-card border border-ink bg-ink px-3 py-1.5 font-heading text-[10px] font-semibold uppercase tracking-label text-cream">
          {t('ihord.tab.summary')}
        </span>
        <Link
          href={`/admin/money/ihord/worklist?period=${period}`}
          className="rounded-card border border-primary-500/25 px-3 py-1.5 font-heading text-[10px] font-semibold uppercase tracking-label text-gray-600 transition-colors hover:border-ink hover:text-ink"
        >
          {t('ihord.tab.worklist')}
        </Link>
        <span className="mx-1 h-4 w-px bg-primary-500/25" aria-hidden />
        {PERIODS.map((option) => (
          <Link
            key={option.key}
            href={`/admin/money/ihord?period=${option.key}`}
            className={`rounded-card border px-3 py-1.5 font-heading text-[10px] font-semibold uppercase tracking-label transition-colors ${
              period === option.key
                ? 'border-ink bg-ink text-cream'
                : 'border-primary-500/25 text-gray-600 hover:border-ink hover:text-ink'
            }`}
          >
            {t(`ihord.period.${option.key}` as never)}
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
            href={`/admin/money/ihord?period=${period}`}
            className="mt-3 inline-flex h-8 items-center rounded-card border border-primary-500/30 px-3 font-heading text-[10px] font-semibold uppercase tracking-label text-gray-600 hover:border-ink hover:text-ink"
          >
            {t('ihord.buildingRetry')}
          </Link>
        </Panel>
      </div>
    );
  }

  if (unconfigured || !report) {
    return (
      <div className="space-y-6">
        {header}
        <Warning>{failure ?? t('ihord.notConnected')}</Warning>
      </div>
    );
  }

  // Defaulted rather than destructured bare: the service and this page ship
  // separately, and a missing list should draw an empty table, not a stack
  // trace behind a digest nobody can read.
  const m = report.money ?? {};
  const counts = report.counts ?? { notSettled: 0, jobPocketJobs: 0, rowsClaimed: 0, rowsParsed: 0 };
  const jobs = report.jobs ?? [];
  const payouts = report.payouts ?? [];

  /**
   * Which of these visits have a photograph and which have a paper scan.
   *
   * Asked in one request for the whole page. It fails quietly on purpose: the
   * reconciliation is the point of this screen and an icon is not worth
   * failing it for.
   */
  const media = await getJobMedia(
    jobs.map((j) => j.jpJobId).filter((id): id is string => Boolean(id))
  ).catch(() => ({ jobs: {} as Record<string, JobPaperwork> }));
  const notSettled = jobs.filter((j) => j.issue === 'not_settled');
  const missingHere = jobs.filter((j) => j.issue === 'missing_in_jobpocket');
  const missingThere = jobs.filter((j) => j.issue === 'missing_in_ihord');

  return (
    <div className="space-y-6">
      {header}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label={t('ihord.earned')} value={money(m.earnedCents ?? 0, t.lang)} emphasis />
        <StatTile
          label={t('ihord.notSettled')}
          value={money(m.pendingCents ?? 0, t.lang)}
          emphasis
          higherIsBetter={false}
          hint={t.plural(counts.notSettled, 'ihord.visit')}
        />
        <StatTile
          label={t('ihord.paid')}
          value={money(m.paidSoFarCents ?? 0, t.lang)}
          hint={t.plural(payouts.length, 'ihord.payout')}
        />
        <StatTile
          label={t('ihord.stillOwed')}
          value={money(m.unpaidCents ?? 0, t.lang)}
          higherIsBetter={false}
          hint={(m.unpaidCents ?? 0) < 0 ? t('ihord.overpaid') : undefined}
        />
      </div>

      {report.ageSec != null && report.ageSec > 900 ? (
        <Hint>{t('ihord.age', { minutes: String(Math.round(report.ageSec / 60)) })}</Hint>
      ) : null}

      {/* A parser that quietly reads 191 of 193 rows produces a shortfall
          nobody can explain later, so it is said here rather than logged. */}
      {counts.rowsClaimed > counts.rowsParsed && (
        <Warning>
          {t('ihord.parseGap', {
            claimed: counts.rowsClaimed,
            parsed: counts.rowsParsed,
          })}
        </Warning>
      )}

      <Panel title={t('ihord.notSettledTitle')} subtitle={t('ihord.notSettledSubtitle')}>
        {notSettled.length === 0 ? (
          <Empty>{t('ihord.allSettled')}</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t('common.date')}</Th>
                <Th>{t('common.job')}</Th>
                <Th>{t('common.client')}</Th>
                <Th>{t('payments.how')}</Th>
                <Th numeric>{t('ihord.sold')}</Th>
                <Th numeric>{t('ihord.parts')}</Th>
                <Th numeric>{t('ihord.toYou')}</Th>
              </tr>
            </thead>
            <tbody>
              {notSettled.map((job) => (
                <tr key={job.jobNumber}>
                  <Td className="text-gray-600">
                    {job.date ? shortDate(new Date(job.date), t.lang) : '—'}
                  </Td>
                  <Td>
                    {job.jpJobId ? (
                      <Link
                        href={`/admin/calendar/${job.jpJobId}`}
                        className="text-ink underline decoration-primary-500/40 underline-offset-2 hover:text-primary-600"
                      >
                        {job.jobNumber}
                      </Link>
                    ) : (
                      job.jobNumber
                    )}
                    {job.invoiceNumber ? (
                      <span className="ml-2 text-[11px] text-gray-500">{job.invoiceNumber}</span>
                    ) : null}
                    <Paperwork media={job.jpJobId ? media.jobs[job.jpJobId] : undefined} t={t} />
                  </Td>
                  <Td>{job.customer || '—'}</Td>
                  <Td className="text-gray-600">
                    <PaidHow media={job.jpJobId ? media.jobs[job.jpJobId] : undefined} t={t} />
                  </Td>
                  <Td numeric>{money(job.soldCents ?? 0, t.lang)}</Td>
                  <Td numeric className="text-gray-600">
                    {money(job.partsCents ?? 0, t.lang)}
                  </Td>
                  <Td numeric className="font-medium">
                    <span style={{ color: STATUS.warning }}>{money(job.toYouCents ?? 0, t.lang)}</span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <Hint>{t('ihord.notSettledHint')}</Hint>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title={t('ihord.missingHere')}
          subtitle={t.plural(missingHere.length, 'ihord.visit')}
        >
          {missingHere.length === 0 ? (
            <Empty>{t('ihord.bothAgree')}</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>{t('common.date')}</Th>
                  <Th>{t('common.job')}</Th>
                  <Th numeric>{t('ihord.sold')}</Th>
                </tr>
              </thead>
              <tbody>
                {missingHere.slice(0, 50).map((job) => (
                  <tr key={job.jobNumber}>
                    <Td className="text-gray-600">
                      {job.date ? shortDate(new Date(job.date), t.lang) : '—'}
                    </Td>
                    <Td>
                      {job.jobNumber}
                      <span className="ml-2 text-[11px] text-gray-500">{job.customer}</span>
                    </Td>
                    <Td numeric>{money(job.soldCents ?? 0, t.lang)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
          <Hint>{t('ihord.missingHereHint')}</Hint>
        </Panel>

        <Panel
          title={t('ihord.missingThere')}
          subtitle={t.plural(missingThere.length, 'ihord.visit')}
        >
          {missingThere.length === 0 ? (
            <Empty>{t('ihord.bothAgree')}</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>{t('common.job')}</Th>
                  <Th>{t('common.status')}</Th>
                </tr>
              </thead>
              <tbody>
                {missingThere.slice(0, 50).map((job) => (
                  <tr key={job.jobNumber}>
                    <Td>
                      {job.jpJobId ? (
                        <Link
                          href={`/admin/calendar/${job.jpJobId}`}
                          className="text-ink underline decoration-primary-500/40 underline-offset-2 hover:text-primary-600"
                        >
                          {job.jobNumber}
                        </Link>
                      ) : (
                        job.jobNumber
                      )}
                    </Td>
                    <Td className="text-gray-600">{job.jpStatus ?? '—'}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
          <Hint>{t('ihord.missingThereHint')}</Hint>
        </Panel>
      </div>

      <Panel title={t('ihord.payouts')} subtitle={t.plural(payouts.length, 'ihord.payout')}>
        {payouts.length === 0 ? (
          <Empty>{t('ihord.noPayouts')}</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t('common.date')}</Th>
                <Th>{t('payments.how')}</Th>
                <Th numeric>{t('common.amount')}</Th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((payout, index) => (
                <tr key={`${payout.date}-${index}`}>
                  <Td className="text-gray-600">
                    {payout.date ? shortDate(new Date(payout.date), t.lang) : '—'}
                  </Td>
                  <Td>{payout.method}</Td>
                  <Td numeric className="font-medium">
                    {money(payout.amountCents ?? 0, t.lang)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <Hint>{t('ihord.payoutsHint', { count: count(counts.jobPocketJobs, t.lang) })}</Hint>
      </Panel>
    </div>
  );
}
