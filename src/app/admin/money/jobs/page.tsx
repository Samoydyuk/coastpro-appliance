import Link from 'next/link';
import { parseRange } from '@/lib/admin/range';
import { count, money, shortDate } from '@/lib/admin/format';
import { getJobs } from '@/lib/money/client';
import { OperationsApiError } from '@/lib/bookings/client';
import { Empty, Hint, Panel, SetupNotice, StatTile, StatusPill, Table, Td, Th, Warning } from '@/components/admin/ui';
import { NotConnected } from '@/components/admin/NotConnected';
import { Pager } from '@/components/admin/Pager';

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

  const title = (searchParams.title as string) || 'Jobs';

  if (unconfigured) {
    return (
      <div className="space-y-6">
        <Header title={title} subtitle={range.label} backTo={backTo} />
        <NotConnected what="Jobs and payments" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-6">
        <Header title={title} subtitle={range.label} backTo={backTo} />
        <Warning>{failure ?? 'JobPocket did not answer.'}</Warning>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header title={title} subtitle={range.label} backTo={backTo} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Jobs" value={count(report.totals.jobs)} emphasis />
        <StatTile label="Billed" value={money(report.totals.billedCents)} />
        <StatTile
          label="Kept"
          value={money(report.totals.ownShareCents)}
          emphasis
          hint="after the dispatchers' share"
        />
        <StatTile
          label="Average ticket"
          value={
            report.totals.jobs
              ? money(Math.round(report.totals.ownShareCents / report.totals.jobs))
              : '—'
          }
        />
      </div>

      <Panel title="Every job behind that figure" subtitle="Newest first">
        {report.jobs.length === 0 ? (
          <Empty>No finished work matches that.</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Finished</Th>
                <Th>Client</Th>
                <Th>Job</Th>
                <Th>Company</Th>
                <Th>Status</Th>
                <Th numeric>Billed</Th>
                <Th numeric>Kept</Th>
              </tr>
            </thead>
            <tbody>
              {report.jobs.map((job) => (
                <tr key={job.id}>
                  <Td className="text-gray-600">
                    {job.completedAt ? shortDate(new Date(job.completedAt)) : '—'}
                  </Td>
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
                  <Td className="text-gray-600">{job.brandName}</Td>
                  <Td>
                    <StatusPill status={job.paymentStatus} />
                  </Td>
                  <Td numeric>{money(job.totalCents)}</Td>
                  <Td numeric className="font-medium">
                    {money(job.ownShareCents)}
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
        <Hint>
          Billed is what the customer was charged; kept is what survives the dispatcher&apos;s
          share. On split work they are different numbers, and the difference is the whole reason
          this section exists.
        </Hint>
      </Panel>
    </div>
  );
}

function Header({ title, subtitle, backTo }: { title: string; subtitle: string; backTo: string }) {
  return (
    <div>
      <Link
        href={backTo}
        className="font-heading text-[10px] uppercase tracking-label text-gray-500 hover:text-ink"
      >
        ← Back
      </Link>
      <h1 className="mt-1 font-heading text-xl font-bold uppercase tracking-label text-ink">
        {title}
      </h1>
      <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
    </div>
  );
}
