import Link from 'next/link';
import { count, money, shortDate } from '@/lib/admin/format';
import { getStuck } from '@/lib/money/client';
import { OperationsApiError } from '@/lib/bookings/client';
import { Empty, Hint, Panel, SetupNotice, StatTile, Table, Td, Th, Warning } from '@/components/admin/ui';
import { NotConnected } from '@/components/admin/NotConnected';
import { STATUS } from '@/components/admin/palette';
import { serverTranslator } from '@/lib/i18n/server';
import type { Lang } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

/**
 * Which of these costs money if it is left, and which is only untidy.
 *
 * An unraised invoice and a missing photograph are both "stalled", and treating
 * them the same trains the reader to skim past both.
 */
const SEVERE = new Set(['not_invoiced', 'unpaid', 'invoice_scan']);

/** The date on a stalled job depends on how it stalled. */
function whenLabel(group: string, job: { completedAt: string | null; scheduledAt: string | null; startedAt: string | null; createdAt: string }, lang: Lang): string {
  const pick =
    group === 'never_started' ? job.scheduledAt :
    group === 'left_open' ? job.startedAt :
    group === 'quiet_estimate' || group === 'estimate_cold' ? job.createdAt :
    job.completedAt ?? job.createdAt;
  return pick ? shortDate(new Date(pick), lang) : '—';
}

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

export default async function StuckPage() {
  const t = serverTranslator();
  let report: Awaited<ReturnType<typeof getStuck>> | null = null;
  let unconfigured = false;
  let failure: string | null = null;

  try {
    report = await getStuck();
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
        <Header />
        <NotConnected what={t('money.notConnected')} />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-6">
        <Header />
        <Warning>{failure ?? t('money.noAnswer')}</Warning>
      </div>
    );
  }

  const withWork = report.groups.filter((group) => group.jobs > 0);
  const notInvoiced = report.groups.find((group) => group.key === 'not_invoiced');
  const unscanned = report.groups.find((group) => group.key === 'invoice_scan');
  const totalJobs = withWork.reduce((sum, group) => sum + group.jobs, 0);

  return (
    <div className="space-y-6">
      <Header />
      {failure ? <Warning>{failure}</Warning> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label={t('stuck.neverInvoiced')}
          value={money(notInvoiced?.valueCents ?? 0, t.lang)}
          emphasis
          higherIsBetter={false}
          hint={t.plural(notInvoiced?.jobs ?? 0, 'money.finishedJob')}
        />
        <StatTile
          label={t('stuck.noScan')}
          value={count(unscanned?.jobs ?? 0, t.lang)}
          higherIsBetter={false}
          hint={t('money.nothingScanned')}
        />
        <StatTile
          label={t('stuck.toFix')}
          value={count(totalJobs, t.lang)}
          higherIsBetter={false}
          hint={t.plural(withWork.length, 'money.acrossKinds')}
        />
        <StatTile
          label={t('stuck.checked')}
          value={count(report.groups.length, t.lang)}
          hint={t('money.sameListApp')}
        />
      </div>

      {withWork.length === 0 ? (
        <Panel title={t('stuck.nothing')}>
          <Empty>{t('money.everyJobWhereItShouldBe')}</Empty>
        </Panel>
      ) : (
        withWork.map((group) => (
          // The title, the noun and the `why` footnote are written by
          // JobPocket. The console must not paraphrase a check it does not own.
          <Panel
            key={group.key}
            title={group.title}
            subtitle={`${count(group.jobs, t.lang)} ${group.noun}${
              group.valueCents > 0 ? ` · ${money(group.valueCents, t.lang)}` : ''
            }`}
          >
            <Table>
              <thead>
                <tr>
                  <Th>{t('common.client')}</Th>
                  <Th>{t('common.job')}</Th>
                  <Th>{t('stuck.since')}</Th>
                  <Th numeric>{t('common.days')}</Th>
                  <Th numeric>{t('common.value')}</Th>
                </tr>
              </thead>
              <tbody>
                {group.rows.map((job) => {
                  const anchor =
                    group.key === 'never_started' ? job.scheduledAt :
                    group.key === 'left_open' ? job.startedAt :
                    job.completedAt ?? job.createdAt;
                  const age = daysSince(anchor);
                  return (
                    <tr key={job.id}>
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
                      <Td className="text-gray-600">{whenLabel(group.key, job, t.lang)}</Td>
                      <Td numeric>
                        <span
                          className="font-medium"
                          style={
                            SEVERE.has(group.key) && (age ?? 0) > 30
                              ? { color: STATUS.critical }
                              : undefined
                          }
                        >
                          {age ?? '—'}
                        </span>
                      </Td>
                      <Td numeric className="text-gray-600">
                        {job.totalCents > 0 ? money(job.totalCents, t.lang) : '—'}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
            <Hint>{group.why}</Hint>
          </Panel>
        ))
      )}

      <Hint>{t('money.stuckHint')}</Hint>
    </div>
  );
}

function Header() {
  const t = serverTranslator();
  return (
    <div>
      <h1 className="font-heading text-xl font-bold uppercase tracking-label text-ink">
        {t('stuck.title')}
      </h1>
      <p className="mt-1 text-sm text-gray-600">{t('stuck.subtitle')}</p>
    </div>
  );
}
