import Link from 'next/link';
import { count, money, shortDate } from '@/lib/admin/format';
import { getStuck } from '@/lib/money/client';
import { OperationsApiError } from '@/lib/bookings/client';
import { Empty, Hint, Panel, SetupNotice, StatTile, Table, Td, Th, Warning } from '@/components/admin/ui';
import { NotConnected } from '@/components/admin/NotConnected';
import { STATUS } from '@/components/admin/palette';

export const dynamic = 'force-dynamic';

/**
 * Which of these costs money if it is left, and which is only untidy.
 *
 * An unraised invoice and a missing photograph are both "stalled", and treating
 * them the same trains the reader to skim past both.
 */
const SEVERE = new Set(['not_invoiced', 'unpaid', 'invoice_scan']);

/** The date on a stalled job depends on how it stalled. */
function whenLabel(group: string, job: { completedAt: string | null; scheduledAt: string | null; startedAt: string | null; createdAt: string }): string {
  const pick =
    group === 'never_started' ? job.scheduledAt :
    group === 'left_open' ? job.startedAt :
    group === 'quiet_estimate' || group === 'estimate_cold' ? job.createdAt :
    job.completedAt ?? job.createdAt;
  return pick ? shortDate(new Date(pick)) : '—';
}

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

export default async function StuckPage() {
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
        <NotConnected what="Jobs and payments" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-6">
        <Header />
        <Warning>{failure ?? 'JobPocket did not answer.'}</Warning>
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
          label="Never invoiced"
          value={money(notInvoiced?.valueCents ?? 0)}
          emphasis
          higherIsBetter={false}
          hint={`${count(notInvoiced?.jobs ?? 0)} finished jobs`}
        />
        <StatTile
          label="No paper scan"
          value={count(unscanned?.jobs ?? 0)}
          higherIsBetter={false}
          hint="finished, nothing scanned onto them"
        />
        <StatTile
          label="Things to fix"
          value={count(totalJobs)}
          higherIsBetter={false}
          hint={`across ${count(withWork.length)} kinds`}
        />
        <StatTile
          label="Checked"
          value={count(report.groups.length)}
          hint="the same list the app watches"
        />
      </div>

      {withWork.length === 0 ? (
        <Panel title="Nothing is stuck">
          <Empty>Every job is where it should be — invoiced, scanned, closed and assigned.</Empty>
        </Panel>
      ) : (
        withWork.map((group) => (
          <Panel
            key={group.key}
            title={group.title}
            subtitle={`${count(group.jobs)} ${group.noun}${
              group.valueCents > 0 ? ` · ${money(group.valueCents)}` : ''
            }`}
          >
            <Table>
              <thead>
                <tr>
                  <Th>Client</Th>
                  <Th>Job</Th>
                  <Th>Since</Th>
                  <Th numeric>Days</Th>
                  <Th numeric>Value</Th>
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
                          {job.jobNumber ?? 'Job'}
                        </Link>
                        {job.type ? <span className="ml-2 text-[11px] text-gray-500">{job.type}</span> : null}
                      </Td>
                      <Td className="text-gray-600">{whenLabel(group.key, job)}</Td>
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
                        {job.totalCents > 0 ? money(job.totalCents) : '—'}
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

      <Hint>
        This list is not the console&apos;s own. It comes from the checks JobPocket already watches,
        so the app and this page cannot come to different conclusions about what counts as
        unscanned or never invoiced — and a new check added there appears here by itself.
      </Hint>
    </div>
  );
}

function Header() {
  return (
    <div>
      <h1 className="font-heading text-xl font-bold uppercase tracking-label text-ink">Stuck</h1>
      <p className="mt-1 text-sm text-gray-600">
        Work that has stopped moving, as things stand today
      </p>
    </div>
  );
}
