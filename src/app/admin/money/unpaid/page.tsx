import Link from 'next/link';
import { count, money, shortDate } from '@/lib/admin/format';
import { getUnpaid } from '@/lib/money/client';
import { OperationsApiError } from '@/lib/bookings/client';
import { Empty, Hint, Panel, SetupNotice, StatTile, Table, Td, Th, Warning } from '@/components/admin/ui';
import { NotConnected } from '@/components/admin/NotConnected';
import { RankedBars } from '@/components/admin/charts';
import { Pager } from '@/components/admin/Pager';
import { STATUS } from '@/components/admin/palette';

export const dynamic = 'force-dynamic';

/**
 * Age as ordered severity, not as a category.
 *
 * The same four colours carry the buckets in the chart and the days in the
 * table, so a reader learns one encoding rather than two.
 */
const AGE_COLOURS = [STATUS.good, STATUS.warning, STATUS.serious, STATUS.critical];

function ageColour(days: number): string {
  return days > 90 ? AGE_COLOURS[3]! : days > 60 ? AGE_COLOURS[2]! : days > 30 ? AGE_COLOURS[1]! : AGE_COLOURS[0]!;
}

export default async function UnpaidPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const bucket = (searchParams.bucket as string) || undefined;
  const offset = Number(searchParams.offset ?? 0) || 0;

  let report: Awaited<ReturnType<typeof getUnpaid>> | null = null;
  let unconfigured = false;
  let failure: string | null = null;

  try {
    report = await getUnpaid({ bucket, offset });
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

  const oldest = report.jobs[0] ?? null;
  const over60 = report.aging.days60.cents + report.aging.days90.cents;

  const buckets = [
    { label: 'Under 30 days', value: report.aging.current.cents / 100, jobs: report.aging.current.jobs, colour: AGE_COLOURS[0]! },
    { label: '31 to 60 days', value: report.aging.days30.cents / 100, jobs: report.aging.days30.jobs, colour: AGE_COLOURS[1]! },
    { label: '61 to 90 days', value: report.aging.days60.cents / 100, jobs: report.aging.days60.jobs, colour: AGE_COLOURS[2]! },
    { label: 'Over 90 days', value: report.aging.days90.cents / 100, jobs: report.aging.days90.jobs, colour: AGE_COLOURS[3]! },
  ];

  return (
    <div className="space-y-6">
      <Header />
      {failure ? <Warning>{failure}</Warning> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Owed"
          value={money(report.outstanding.totalCents)}
          emphasis
          higherIsBetter={false}
          hint={`${count(report.outstanding.jobs)} invoices`}
        />
        <StatTile
          label="Yours of it"
          value={money(report.outstanding.ownShareCents)}
          emphasis
          // The gross figure is a hole twice the size of the real one on a
          // dispatcher-heavy account: half of a split ticket was never yours.
          hint="after the dispatchers' share"
        />
        <StatTile
          label="Over 60 days"
          value={money(over60)}
          higherIsBetter={false}
          hint={
            report.outstanding.totalCents
              ? `${Math.round((over60 / report.outstanding.totalCents) * 100)}% of what is owed`
              : undefined
          }
        />
        <StatTile
          label="Oldest"
          value={oldest ? `${count(oldest.daysOwed)} days` : '—'}
          higherIsBetter={false}
          hint={oldest?.clientName ?? undefined}
        />
      </div>

      <Panel title="How old the debts are" subtitle={`Measured to today, not to a date window`}>
        {report.outstanding.jobs > 0 ? (
          <RankedBars
            format="money"
            items={buckets.map((bucket) => ({
              label: bucket.label,
              value: bucket.value,
              color: bucket.colour,
              note: `${count(bucket.jobs)} ${bucket.jobs === 1 ? 'invoice' : 'invoices'}`,
            }))}
          />
        ) : (
          <Empty>Nothing outstanding. Everything finished has been paid for.</Empty>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {/* The chart shows the shape; these open it. */}
          {[{ k: '', l: 'All' }, { k: 'current', l: 'Under 30' }, { k: 'days30', l: '31–60' }, { k: 'days60', l: '61–90' }, { k: 'days90', l: 'Over 90' }].map((band) => (
            <Link
              key={band.k || 'all'}
              href={band.k ? `/admin/money/unpaid?bucket=${band.k}` : '/admin/money/unpaid'}
              className={`rounded-card border px-3 py-1.5 font-heading text-[10px] font-semibold uppercase tracking-label transition-colors ${
                (bucket ?? '') === band.k
                  ? 'border-ink bg-ink text-cream'
                  : 'border-primary-500/25 text-gray-600 hover:border-ink hover:text-ink'
              }`}
            >
              {band.l}
            </Link>
          ))}
        </div>
        <Hint>
          There is no date window on this page on purpose. A debt does not stop existing because the
          report was narrowed to last week, and the oldest ones are the only ones that need a
          decision.
        </Hint>
      </Panel>

      <Panel
        title="Every unpaid invoice"
        subtitle={`Oldest first — age decides who to ring, not size`}
        action={
          <a
            href="/api/admin/export?type=unpaid"
            className="inline-flex h-8 items-center rounded-card border border-primary-500/30 px-3 font-heading text-[10px] font-semibold uppercase tracking-label text-gray-600 hover:border-ink hover:text-ink"
          >
            Export CSV
          </a>
        }
      >
        {report.jobs.length === 0 ? (
          <Empty>Nothing outstanding.</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Client</Th>
                <Th>Job</Th>
                <Th>Finished</Th>
                <Th numeric>Days</Th>
                <Th numeric>Invoice</Th>
                <Th numeric>Yours</Th>
              </tr>
            </thead>
            <tbody>
              {report.jobs.map((job) => (
                <tr key={job.id}>
                  <Td>{job.clientName ?? '—'}</Td>
                  <Td>
                    <Link
                      href={`/admin/calendar/${job.id}`}
                      className="text-ink underline decoration-primary-500/40 underline-offset-2 hover:text-primary-600"
                    >
                      {job.jobNumber ?? 'Job'}
                    </Link>
                    <span className="ml-2 text-[11px] text-gray-500">{job.brandName}</span>
                  </Td>
                  <Td className="text-gray-600">
                    {job.completedAt ? shortDate(new Date(job.completedAt)) : '—'}
                  </Td>
                  <Td numeric>
                    <span style={{ color: ageColour(job.daysOwed) }} className="font-medium">
                      {job.daysOwed}
                    </span>
                  </Td>
                  <Td numeric>{money(job.totalCents)}</Td>
                  <Td numeric className="text-gray-600">
                    {money(job.ownShareCents)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <Pager
          base={`/admin/money/unpaid${bucket ? `?bucket=${bucket}` : ''}`}
          offset={report.offset}
          shown={report.jobs.length}
          total={report.total}
          hasMore={report.hasMore}
        />
        <Hint>
          A debt that has been given up on is not outstanding and is not here — writing one off in
          the app takes it out of this list and books the loss in the period the decision was made.
        </Hint>
      </Panel>
    </div>
  );
}

function Header() {
  return (
    <div>
      <h1 className="font-heading text-xl font-bold uppercase tracking-label text-ink">Unpaid</h1>
      <p className="mt-1 text-sm text-gray-600">As things stand today</p>
    </div>
  );
}
