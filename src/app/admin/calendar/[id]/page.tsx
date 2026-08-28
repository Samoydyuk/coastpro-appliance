import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getJob, OperationsApiError } from '@/lib/bookings/client';
import { dateTime, money, relativeTime } from '@/lib/admin/format';
import { timeOfDay } from '@/lib/bookings/month';
import { Empty, Hint, Panel, SetupNotice, StatusPill, Table, Td, Th, Warning } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

/**
 * One visit, in full.
 *
 * The calendar carries a name and a time because that is what a month is read
 * for. Everything else — the phone number, what it was priced from, what was
 * found — needs the job opened on its own, which is also the only shape the
 * API will hand it over in.
 */

export default async function JobPage({ params }: { params: { id: string } }) {
  let job;

  try {
    ({ job } = await getJob(params.id));
  } catch (error) {
    if (error instanceof OperationsApiError) {
      if (error.status === 404) notFound();
      return (
        <div className="space-y-4">
          <BackLink />
          <Warning>{error.message}</Warning>
        </div>
      );
    }
    return <SetupNotice error={error} />;
  }

  const billable = job.lineItems.filter((item) => !item.isExcluded);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <BackLink />
          <h1 className="mt-2 font-heading text-xl font-bold uppercase tracking-label text-ink">
            {job.jobNumber ?? 'Job'}
            {job.client?.name ? ` · ${job.client.name}` : ''}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {job.scheduledAt ? (
              <>
                {dateTime(job.scheduledAt)}
                {job.scheduledEnd && ` – ${timeOfDay(job.scheduledEnd)}`}
              </>
            ) : (
              'Not scheduled'
            )}
            {job.type ? ` · ${job.type}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={job.status} />
          <StatusPill status={job.paymentStatus} />
        </div>
      </div>

      {/* Whose name the work is under. On this account most visits are
          dispatched, so it is the first thing worth knowing about a job. */}
      {job.brand && (
        <p className="text-sm text-gray-600">
          Done under <strong className="text-ink">{job.brand.name}</strong> — dispatched work, not
          CoastPro&apos;s own.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <Panel title="What it was priced from">
            {billable.length === 0 ? (
              <Empty>
                Nothing itemised yet. A visit is priced on site, so a job that has not happened
                carries no lines.
              </Empty>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Item</Th>
                    <Th numeric>Qty</Th>
                    <Th numeric>Each</Th>
                    <Th numeric>Total</Th>
                  </tr>
                </thead>
                <tbody>
                  {billable.map((item) => (
                    <tr key={item.id}>
                      <Td>
                        {item.description}
                        {item.partNumber && (
                          <div className="font-mono text-xs text-gray-500">{item.partNumber}</div>
                        )}
                      </Td>
                      <Td numeric>{item.quantity}</Td>
                      <Td numeric>{money(item.unitPriceCents)}</Td>
                      <Td numeric>{money(item.totalCents)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}

            <dl className="mt-4 space-y-1.5 border-t border-primary-500/15 pt-4 text-sm">
              <Money label="Subtotal" cents={job.subtotalCents} />
              <Money label={`Tax (${job.taxRate}%)`} cents={job.taxCents} />
              <Money label="Total" cents={job.totalCents} strong />
            </dl>
          </Panel>

          {(job.notes || job.diagnosis || job.resolution) && (
            <Panel title="What happened">
              {job.diagnosis && <Para label="Diagnosis">{job.diagnosis}</Para>}
              {job.resolution && <Para label="What was done">{job.resolution}</Para>}
              {job.notes && <Para label="Notes">{job.notes}</Para>}
            </Panel>
          )}
        </div>

        <div className="space-y-4">
          <Panel title="Customer">
            <dl className="space-y-3">
              <Field label="Name">{job.client?.name ?? '—'}</Field>
              <Field label="Phone">
                {job.client?.phone ? (
                  <a href={`tel:${job.client.phone}`} className="text-ink hover:text-primary-600">
                    {job.client.phone}
                  </a>
                ) : (
                  '—'
                )}
              </Field>
              <Field label="Address">{job.address ?? '—'}</Field>
              {job.appliance && (
                <Field label="Appliance">
                  {[job.appliance.brand, job.appliance.model].filter(Boolean).join(' ') || '—'}
                </Field>
              )}
            </dl>
          </Panel>

          <Panel title="Timeline">
            <dl className="space-y-3">
              <Field label="Created">{dateTime(job.createdAt)}</Field>
              <Field label="Scheduled">
                {job.scheduledAt ? dateTime(job.scheduledAt) : 'Not scheduled'}
              </Field>
              <Field label="Started">{job.startedAt ? dateTime(job.startedAt) : '—'}</Field>
              <Field label="Completed">
                {job.completedAt ? (
                  <>
                    {dateTime(job.completedAt)}
                    <div className="text-xs text-gray-500">{relativeTime(job.completedAt)}</div>
                  </>
                ) : (
                  '—'
                )}
              </Field>
              <Field label="Paid">{job.paidAt ? dateTime(job.paidAt) : 'Not yet'}</Field>
              {job.assignedTo && <Field label="Assigned to">{job.assignedTo.name}</Field>}
            </dl>
          </Panel>
        </div>
      </div>

      <Hint>
        Read live from JobPocket — this is the same job the app shows, not a copy of it. What a part
        cost to buy is deliberately not carried here.
      </Hint>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/admin/calendar"
      className="font-heading text-[10px] font-semibold uppercase tracking-label text-gray-600 hover:text-ink"
    >
      ← Calendar
    </Link>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-heading text-[10px] uppercase tracking-label text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink">{children}</dd>
    </div>
  );
}

function Money({ label, cents, strong }: { label: string; cents: number; strong?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className={strong ? 'font-medium text-ink' : 'text-gray-600'}>{label}</dt>
      <dd className={strong ? 'font-medium tabular-nums text-ink' : 'tabular-nums text-gray-600'}>
        {money(cents)}
      </dd>
    </div>
  );
}

function Para({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="font-heading text-[10px] uppercase tracking-label text-gray-500">{label}</div>
      <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{children}</p>
    </div>
  );
}
