import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBookingRequest, OperationsApiError } from '@/lib/bookings/client';
import { attributionForRequests } from '@/lib/bookings/queries';
import { channelLabel } from '@/lib/attribution';
import { dateTime, relativeTime, money } from '@/lib/admin/format';
import { serverTranslator } from '@/lib/i18n/server';
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

/** Labels for the disagreement codes `jobpocket.ts` records. */
const CONFLICTS = {
  accepted_after_lost: 'work.conflict.accepted_after_lost',
  accepted_after_spam: 'work.conflict.accepted_after_spam',
  working_after_lost: 'work.conflict.working_after_lost',
  working_after_spam: 'work.conflict.working_after_spam',
  invoiced_after_lost: 'work.conflict.invoiced_after_lost',
  invoiced_after_spam: 'work.conflict.invoiced_after_spam',
  paid_after_lost: 'work.conflict.paid_after_lost',
  paid_after_spam: 'work.conflict.paid_after_spam',
  declined_after_booked: 'work.conflict.declined_after_booked',
  cancelled_after_booked: 'work.conflict.cancelled_after_booked',
  refund_after_won: 'work.conflict.refund_after_won',
} as const;

export default async function BookingRequestPage({ params }: { params: { id: string } }) {
  const t = serverTranslator();
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
            {dateTime(request.createdAt, t.lang)} · {relativeTime(request.createdAt)} ·{' '}
            {request.serviceType}
          </p>
        </div>
        <StatusPill status={request.status} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <Panel
            title={t('work.booking.contact')}
            subtitle={t('work.booking.contactSubtitle')}
          >
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <Field label={t('work.booking.phone')}>
                <CallButton phone={request.clientPhone} name={request.clientName ?? ''} />
              </Field>
              <Field label={t('work.booking.email')}>
                {request.clientEmail ? (
                  <a
                    href={`mailto:${request.clientEmail}`}
                    className="text-ink hover:text-primary-600"
                  >
                    {request.clientEmail}
                  </a>
                ) : (
                  <span className="text-gray-500">{t('work.booking.notGiven')}</span>
                )}
              </Field>
              <Field label={t('work.booking.address')}>
                {request.clientAddress || (
                  <span className="text-gray-500">{t('work.booking.notGiven')}</span>
                )}
              </Field>
              <Field label={t('work.booking.appliance')}>
                {appliance || <span className="text-gray-500">{t('work.booking.notGiven')}</span>}
              </Field>
            </dl>
          </Panel>

          <Panel title={t('work.booking.asked')}>
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <Field label={t('work.booking.service')}>{request.serviceType}</Field>
              <Field label={t('work.booking.window')}>
                {request.scheduledStart ? (
                  <>
                    {dateTime(request.scheduledStart, t.lang)}
                    {request.scheduledEnd && ` – ${timeOfDay(request.scheduledEnd)}`}
                  </>
                ) : (
                  <span className="text-gray-500">{t('work.booking.noWindow')}</span>
                )}
              </Field>
            </dl>

            {request.description ? (
              <p className="mt-4 whitespace-pre-wrap border-t border-primary-500/15 pt-4 text-sm text-gray-700">
                {request.description}
              </p>
            ) : (
              <div className="mt-4 border-t border-primary-500/15 pt-4">
                <Empty>{t('work.booking.noDescription')}</Empty>
              </div>
            )}

            {formData.accessNotes && (
              <p className="mt-3 text-sm text-gray-700">
                <span className="font-heading text-[10px] uppercase tracking-label text-gray-500">
                  {t('work.booking.access')}
                </span>
                <br />
                {formData.accessNotes}
              </p>
            )}
          </Panel>

          <Panel
            title={t('work.booking.origin')}
            subtitle={t('work.booking.originSubtitle')}
          >
            {from ? (
              <div className="space-y-3">
                <ChannelDot
                  color={channelColor(from.channel ?? 'direct')}
                  label={channelLabel(from.channel ?? 'direct')}
                />
                <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                  <Field label={t('work.booking.source')}>{from.source ?? '—'}</Field>
                  <Field label={t('work.booking.campaign')}>{from.campaign ?? '—'}</Field>
                  <Field label={t('work.booking.term')}>{from.term ?? '—'}</Field>
                  <Field label={t('work.booking.recordedValue')}>
                    {from.valueCents ? money(from.valueCents, t.lang) : '—'}
                  </Field>
                </dl>
                <Link
                  href={`/admin/leads/${from.leadId}`}
                  className="inline-block font-heading text-[10px] font-semibold uppercase tracking-label text-gray-600 hover:text-ink"
                >
                  {t('work.booking.fullEnquiry')}
                </Link>
              </div>
            ) : (
              <Empty>{t('work.booking.noOrigin')}</Empty>
            )}
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title={t('work.booking.answer')}>
            <BookingActions
              requestId={request.id}
              status={request.status}
              scheduledStart={request.scheduledStart}
              scheduledEnd={request.scheduledEnd}
            />
          </Panel>

          {request.job && (
            <Panel title={t('work.booking.becameJob')}>
              <dl className="grid gap-y-3">
                <Field label={t('work.booking.number')}>{request.job.jobNumber ?? '—'}</Field>
                <Field label={t('common.status')}>
                  <StatusPill status={request.job.status} />
                </Field>
                <Field label={t('work.booking.payment')}>
                  <StatusPill status={request.job.paymentStatus} />
                </Field>
                <Field label={t('work.booking.total')}>
                  {money(request.job.totalCents, t.lang)}
                </Field>
                <Field label={t('work.booking.scheduled')}>
                  {request.job.scheduledAt
                    ? dateTime(request.job.scheduledAt, t.lang)
                    : t('work.booking.notScheduled')}
                </Field>
              </dl>
            </Panel>
          )}

          {from?.conflict && (
            <Panel title={t('work.booking.conflictTitle')}>
              <p className="text-sm text-gray-700">
                {t('work.booking.conflictBody')}{' '}
                <strong className="text-ink">
                  {from.conflict in CONFLICTS
                    ? t(CONFLICTS[from.conflict as keyof typeof CONFLICTS])
                    : from.conflict.replace(/_/g, ' ')}
                </strong>
                .
              </p>
              <Hint>{t('work.booking.conflictHint')}</Hint>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function BackLink() {
  const t = serverTranslator();
  return (
    <Link
      href="/admin/bookings"
      className="font-heading text-[10px] font-semibold uppercase tracking-label text-gray-600 hover:text-ink"
    >
      {t('work.booking.back')}
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
