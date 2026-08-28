import Link from 'next/link';
import {
  listBookingRequests,
  OperationsApiError,
  type BookingRequestSummary,
} from '@/lib/bookings/client';
import { attributionForRequests, type LeadAttribution } from '@/lib/bookings/queries';
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

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Waiting' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'DECLINED', label: 'Declined' },
];

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
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
          Bookings
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          {waiting === 0
            ? 'Nothing waiting for an answer'
            : `${waiting} waiting for an answer`}
        </p>
      </div>

      {failure && <Warning>{failure}</Warning>}

      <Panel
        title="Requests"
        subtitle="What came in, and what brought it"
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
                  {filter.label}
                </Link>
              );
            })}
          </div>
        }
      >
        {requests.length === 0 ? (
          <Empty>
            {failure
              ? 'Nothing to show until the key is connected.'
              : status
                ? 'No requests with that status.'
                : 'No booking requests yet. They arrive here the moment somebody books on the website.'}
          </Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Who</Th>
                <Th>What</Th>
                <Th>Asked for</Th>
                <Th>Came from</Th>
                <Th>Status</Th>
                <Th numeric>Received</Th>
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
                          <div>{dateTime(request.scheduledStart)}</div>
                          {request.scheduledEnd && (
                            <div className="text-xs text-gray-500">
                              until {timeOfDay(request.scheduledEnd)}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-500">Call to arrange</span>
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
                              Disagreement: {from.conflict.replace(/_/g, ' ')}
                            </div>
                          )}
                        </>
                      ) : (
                        // Not a gap in the data — a booking that advertising did
                        // not pay for, which is worth seeing as plainly as one
                        // that did.
                        <span className="text-xs text-gray-500">Not from the website</span>
                      )}
                    </Td>
                    <Td>
                      <StatusPill status={request.status} />
                      {from?.valueCents ? (
                        <div className="mt-0.5 text-xs text-gray-500">{money(from.valueCents)}</div>
                      ) : null}
                    </Td>
                    <Td numeric>
                      <div>{relativeTime(request.createdAt)}</div>
                      <div className="text-xs text-gray-500">{dateTime(request.createdAt)}</div>
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
              Older →
            </Link>
          </div>
        )}
      </Panel>

      <Hint>
        These come live from JobPocket — nothing is copied into this site, so the list cannot drift
        out of step with the app. &ldquo;Came from&rdquo; is the part only this console knows: it is
        matched from the enquiry the website captured before the request was filed.
      </Hint>
    </div>
  );
}
