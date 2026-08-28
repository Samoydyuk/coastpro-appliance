import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBookingRequest, OperationsApiError } from '@/lib/bookings/client';
import { attributionForRequests } from '@/lib/bookings/queries';
import { channelLabel } from '@/lib/attribution';
import { dateTime, relativeTime, money } from '@/lib/admin/format';
import { timeOfDay } from '@/lib/bookings/month';
import {
  ChannelDot,
  Empty,
  Hint,
  Panel,
  SetupNotice,
  StatusPill,
  Warning,
} from '@/components/admin/ui';
import { channelColor } from '@/components/admin/palette';
import { BookingActions } from '@/components/admin/BookingActions';
import { CallButton } from '@/components/admin/CallButton';

export const dynamic = 'force-dynamic';

/**
 * One request, with the contact details.
 *
 * This is the only screen that shows a phone number or an email — the list and
 * the calendar carry neither, so a single stolen request cannot walk off with
 * the customer book. Opening a record is also the thing that gets written to
 * the audit log, because the useful question afterwards is not only who changed
 * something but who looked.
 */

export default async function BookingRequestPage({ params }: { params: { id: string } }) {
  let request;

  try {
    ({ request } = await getBookingRequest(params.id));
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

  let from = null;
  try {
    from = (await attributionForRequests([request.id])).get(request.id) ?? null;
  } catch (error) {
    console.error('[Bookings] Could not read attribution:', error);
  }

  const formData = (request.formData ?? {}) as Record<string, string>;
  const appliance = [formData.applianceBrand, formData.applianceModel].filter(Boolean).join(' ');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <BackLink />
          <h1 className="mt-2 font-heading text-xl font-bold uppercase tracking-label text-ink">
            {request.clientName}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {dateTime(request.createdAt)} · {relativeTime(request.createdAt)} · {request.serviceType}
          </p>
        </div>
        <StatusPill status={request.status} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <Panel title="Contact" subtitle="Shown here and nowhere else in this console">
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <Field label="Phone">
                <CallButton phone={request.clientPhone} name={request.clientName ?? ''} />
              </Field>
              <Field label="Email">
                {request.clientEmail ? (
                  <a
                    href={`mailto:${request.clientEmail}`}
                    className="text-ink hover:text-primary-600"
                  >
                    {request.clientEmail}
                  </a>
                ) : (
                  <span className="text-gray-500">Not given</span>
                )}
              </Field>
              <Field label="Address">
                {request.clientAddress || <span className="text-gray-500">Not given</span>}
              </Field>
              <Field label="Appliance">
                {appliance || <span className="text-gray-500">Not given</span>}
              </Field>
            </dl>
          </Panel>

          <Panel title="What they asked for">
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <Field label="Service">{request.serviceType}</Field>
              <Field label="Arrival window">
                {request.scheduledStart ? (
                  <>
                    {dateTime(request.scheduledStart)}
                    {request.scheduledEnd && ` – ${timeOfDay(request.scheduledEnd)}`}
                  </>
                ) : (
                  <span className="text-gray-500">None picked — call to arrange</span>
                )}
              </Field>
            </dl>

            {request.description ? (
              <p className="mt-4 whitespace-pre-wrap border-t border-primary-500/15 pt-4 text-sm text-gray-700">
                {request.description}
              </p>
            ) : (
              <div className="mt-4 border-t border-primary-500/15 pt-4">
                <Empty>They did not describe the problem.</Empty>
              </div>
            )}

            {formData.accessNotes && (
              <p className="mt-3 text-sm text-gray-700">
                <span className="font-heading text-[10px] uppercase tracking-label text-gray-500">
                  Access
                </span>
                <br />
                {formData.accessNotes}
              </p>
            )}
          </Panel>

          <Panel title="Where they came from" subtitle="Known only here, not in the app">
            {from ? (
              <div className="space-y-3">
                <ChannelDot
                  color={channelColor(from.channel ?? 'direct')}
                  label={channelLabel(from.channel ?? 'direct')}
                />
                <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                  <Field label="Source">{from.source ?? '—'}</Field>
                  <Field label="Campaign">{from.campaign ?? '—'}</Field>
                  <Field label="Search term">{from.term ?? '—'}</Field>
                  <Field label="Recorded value">
                    {from.valueCents ? money(from.valueCents) : '—'}
                  </Field>
                </dl>
                <Link
                  href={`/admin/leads/${from.leadId}`}
                  className="inline-block font-heading text-[10px] font-semibold uppercase tracking-label text-gray-600 hover:text-ink"
                >
                  Full enquiry →
                </Link>
              </div>
            ) : (
              <Empty>
                No matching enquiry on this site. This one came in another way — the booking page
                directly, or somebody typed it in — so no advertising is being charged for it.
              </Empty>
            )}
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Answer">
            <BookingActions
              requestId={request.id}
              status={request.status}
              scheduledStart={request.scheduledStart}
              scheduledEnd={request.scheduledEnd}
            />
          </Panel>

          {request.job && (
            <Panel title="The job it became">
              <dl className="grid gap-y-3">
                <Field label="Number">{request.job.jobNumber ?? '—'}</Field>
                <Field label="Status">
                  <StatusPill status={request.job.status} />
                </Field>
                <Field label="Payment">
                  <StatusPill status={request.job.paymentStatus} />
                </Field>
                <Field label="Total">{money(request.job.totalCents)}</Field>
                <Field label="Scheduled">
                  {request.job.scheduledAt ? dateTime(request.job.scheduledAt) : 'Not scheduled'}
                </Field>
              </dl>
            </Panel>
          )}

          {from?.conflict && (
            <Panel title="Disagreement">
              <p className="text-sm text-gray-700">
                JobPocket and the outcome recorded on this site do not agree:{' '}
                <strong className="text-ink">{from.conflict.replace(/_/g, ' ')}</strong>.
              </p>
              <Hint>
                Nothing has been changed automatically. A status set by a person who spoke to the
                customer outranks anything a synchronisation concludes, so this is recorded and left
                for you.
              </Hint>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/admin/bookings"
      className="font-heading text-[10px] font-semibold uppercase tracking-label text-gray-600 hover:text-ink"
    >
      ← All bookings
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
