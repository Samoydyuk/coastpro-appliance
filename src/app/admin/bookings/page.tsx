import Link from 'next/link';
import {
  listBookingRequests,
  OperationsApiError,
  type BookingRequestSummary,
} from '@/lib/bookings/client';
import { attributionForRequests, type LeadAttribution } from '@/lib/bookings/queries';
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
  Table,
  Td,
  Th,
  Warning,
} from '@/components/admin/ui';
import { channelColor } from '@/components/admin/palette';
import { NotConnected } from '@/components/admin/NotConnected';

export const dynamic = 'force-dynamic';

/**
 * The requests waiting for an answer.
 *
 * The app shows the same list. What it cannot show is the left-hand half of
 * each row: which ad, which search, which campaign brought this person here.
 * That was captured on the website before the request existed and lives only in
 * this database — so this screen is the one place the two halves meet.
 */

/**
 * The `value` is what JobPocket stores and what travels in the query string;
 * only `label` is a dictionary key. Translating the value would filter for a
 * status no row has.
 */
const FILTERS = [
  { value: '', label: 'work.bookings.filter.all' },
  { value: 'PENDING', label: 'work.bookings.filter.PENDING' },
  { value: 'ACCEPTED', label: 'work.bookings.filter.ACCEPTED' },
  { value: 'DECLINED', label: 'work.bookings.filter.DECLINED' },
] as const;

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

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const t = serverTranslator();
  const status = typeof searchParams.status === 'string' ? searchParams.status : '';
  const cursor = typeof searchParams.cursor === 'string' ? searchParams.cursor : undefined;

  let requests: BookingRequestSummary[] = [];
  let nextCursor: string | null = null;
  let failure: string | null = null;
  let unconfigured = false;

  try {
    ({ requests, nextCursor } = await listBookingRequests({ status: status || undefined, cursor }));
  } catch (error) {
    if (error instanceof OperationsApiError) {
      if (error.code === 'not_configured') unconfigured = true;
      else failure = error.message;
    }
    else return <SetupNotice error={error} />;
  }

  // One query for the whole page, and a miss is meaningful in itself.
  let attribution = new Map<string, LeadAttribution>();
  try {
    attribution = await attributionForRequests(requests.map((request) => request.id));
  } catch (error) {
    console.error('[Bookings] Could not read attribution:', error);
  }

  const waiting = requests.filter((request) => request.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-xl font-bold uppercase tracking-label text-ink">
          {t('work.bookings.title')}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          {waiting === 0
            ? t('work.bookings.nothingWaiting')
            : t.plural(waiting, 'work.plural.waiting')}
        </p>
      </div>

      {failure && <Warning>{failure}</Warning>}

      <Panel
        title={t('work.bookings.requests')}
        subtitle={t('work.bookings.requestsSubtitle')}
        action={
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((filter) => {
              const active = status === filter.value;
              return (
                <Link
                  key={filter.value || 'all'}
                  href={filter.value ? `/admin/bookings?status=${filter.value}` : '/admin/bookings'}
                  className={`rounded-card border px-3 py-1.5 font-heading text-[10px] font-semibold uppercase tracking-label transition-colors ${
                    active
                      ? 'border-ink bg-ink text-cream'
                      : 'border-primary-500/25 text-gray-600 hover:border-ink hover:text-ink'
                  }`}
                >
                  {t(filter.label)}
                </Link>
              );
            })}
          </div>
        }
      >
        {requests.length === 0 ? (
          <Empty>
            {failure
              ? t('work.bookings.emptyNoKey')
              : status
                ? t('work.bookings.emptyFiltered')
                : t('work.bookings.empty')}
          </Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t('work.bookings.who')}</Th>
                <Th>{t('work.bookings.what')}</Th>
                <Th>{t('work.bookings.askedFor')}</Th>
                <Th>{t('work.bookings.cameFrom')}</Th>
                <Th>{t('common.status')}</Th>
                <Th numeric>{t('work.bookings.received')}</Th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => {
                const from = attribution.get(request.id);
                return (
                  <tr key={request.id} className="hover:bg-cream-dark/40">
                    <Td>
                      <Link
                        href={`/admin/bookings/${request.id}`}
                        className="font-medium text-ink hover:text-primary-600"
                      >
                        {request.clientName}
                      </Link>
                      {request.clientAddress && (
                        <div className="text-xs text-gray-500">{request.clientAddress}</div>
                      )}
                    </Td>
                    <Td>{request.serviceType}</Td>
                    <Td>
                      {request.scheduledStart ? (
                        <>
                          <div>{dateTime(request.scheduledStart, t.lang)}</div>
                          {request.scheduledEnd && (
                            <div className="text-xs text-gray-500">
                              {t('work.bookings.until', {
                                time: timeOfDay(request.scheduledEnd),
                              })}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-500">{t('work.bookings.callToArrange')}</span>
                      )}
                    </Td>
                    <Td>
                      {from ? (
                        <>
                          <ChannelDot
                            color={channelColor(from.channel ?? 'direct')}
                            label={channelLabel(from.channel ?? 'direct')}
                          />
                          {(from.campaign || from.term) && (
                            <div className="mt-0.5 truncate text-xs text-gray-500">
                              {[from.campaign, from.term].filter(Boolean).join(' · ')}
                            </div>
                          )}
                          {from.conflict && (
                            <div className="mt-0.5 text-xs" style={{ color: '#8a5a12' }}>
                              {t('work.bookings.disagreement', {
                                what:
                                  from.conflict in CONFLICTS
                                    ? t(CONFLICTS[from.conflict as keyof typeof CONFLICTS])
                                    : from.conflict.replace(/_/g, ' '),
                              })}
                            </div>
                          )}
                        </>
                      ) : (
                        // Not a gap in the data — a booking that advertising did
                        // not pay for, which is worth seeing as plainly as one
                        // that did.
                        <span className="text-xs text-gray-500">
                          {t('work.bookings.notFromWebsite')}
                        </span>
                      )}
                    </Td>
                    <Td>
                      <StatusPill status={request.status} />
                      {from?.valueCents ? (
                        <div className="mt-0.5 text-xs text-gray-500">
                          {money(from.valueCents, t.lang)}
                        </div>
                      ) : null}
                    </Td>
                    <Td numeric>
                      <div>{relativeTime(request.createdAt)}</div>
                      <div className="text-xs text-gray-500">
                        {dateTime(request.createdAt, t.lang)}
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}

        {nextCursor && (
          <div className="mt-4 flex justify-end">
            <Link
              href={`/admin/bookings?${new URLSearchParams({
                ...(status ? { status } : {}),
                cursor: nextCursor,
              })}`}
              className="rounded-card border border-primary-500/30 px-3 py-1.5 font-heading text-[10px] font-semibold uppercase tracking-label text-gray-600 hover:border-ink hover:text-ink"
            >
              {t('work.bookings.older')}
            </Link>
          </div>
        )}
      </Panel>

      <Hint>{t('work.bookings.hint')}</Hint>
    </div>
  );
}
