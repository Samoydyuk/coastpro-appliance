import Link from 'next/link';
import { parseRange } from '@/lib/admin/range';
import { count, money, shortDate } from '@/lib/admin/format';
import { getPayments } from '@/lib/money/client';
import { OperationsApiError } from '@/lib/bookings/client';
import { Empty, Hint, Panel, SetupNotice, StatTile, Table, Td, Th, Warning } from '@/components/admin/ui';
import { NotConnected } from '@/components/admin/NotConnected';
import { RankedBars } from '@/components/admin/charts';
import { paymentColor, STATUS } from '@/components/admin/palette';

export const dynamic = 'force-dynamic';

/** STRIPE → Stripe, BANK_TRANSFER → Bank transfer. */
function methodLabel(method: string): string {
  const words = method.toLowerCase().replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const range = parseRange({
    range: searchParams.range as string,
    from: searchParams.from as string,
    to: searchParams.to as string,
  });

  let report: Awaited<ReturnType<typeof getPayments>> | null = null;
  let unconfigured = false;
  let failure: string | null = null;

  try {
    report = await getPayments(range.from, range.to);
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
        <Header subtitle={range.label} />
        <NotConnected what="Jobs and payments" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-6">
        <Header subtitle={range.label} />
        <Warning>{failure ?? 'JobPocket did not answer.'}</Warning>
      </div>
    );
  }

  const { totals, payments } = report;
  const cash = totals.byMethod.find((m) => m.method === 'CASH')?.cents ?? 0;
  const excluded = totals.excluded;
  const excludedTotal =
    excluded.voidedCents + excluded.refundedCents + excluded.partiallyRefundedCents + excluded.pendingCents;

  return (
    <div className="space-y-6">
      <Header subtitle={range.label} />
      {failure ? <Warning>{failure}</Warning> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Taken" value={money(totals.succeededCents)} emphasis />
        <StatTile label="Payments" value={count(totals.succeededCount)} />
        <StatTile
          label="Average payment"
          value={totals.succeededCount ? money(Math.round(totals.succeededCents / totals.succeededCount)) : '—'}
        />
        <StatTile
          label="Cash"
          value={money(cash)}
          hint={
            totals.succeededCents
              ? `${Math.round((cash / totals.succeededCents) * 100)}% of what was taken`
              : undefined
          }
        />
      </div>

      {excludedTotal > 0 && (
        <Warning>
          {money(excludedTotal)} is in the log below but not in the total above:{' '}
          {[
            excluded.voidedCount ? `${count(excluded.voidedCount)} voided` : null,
            excluded.refundedCount ? `${count(excluded.refundedCount)} refunded` : null,
            excluded.partiallyRefundedCount
              ? `${count(excluded.partiallyRefundedCount)} partly refunded`
              : null,
            excluded.pendingCount ? `${count(excluded.pendingCount)} still pending` : null,
          ]
            .filter(Boolean)
            .join(', ')}
          . A partly refunded payment counts for nothing in any total in the system, which is worth
          knowing before this figure is compared with a bank statement.
        </Warning>
      )}

      <Panel title="How it arrived" subtitle="Only payments that went through">
        {totals.byMethod.length === 0 ? (
          <Empty>Nothing was taken in this window.</Empty>
        ) : (
          <RankedBars
            format="money"
            items={totals.byMethod.map((row) => ({
              label: methodLabel(row.method),
              value: row.cents / 100,
              color: paymentColor(row.method),
              note: `${count(row.count)} ${row.count === 1 ? 'payment' : 'payments'}`,
            }))}
          />
        )}
      </Panel>

      <Panel title="Every payment" subtitle="Newest first">
        {payments.length === 0 ? (
          <Empty>Nothing was taken in this window.</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Client</Th>
                <Th>Job</Th>
                <Th>How</Th>
                <Th numeric>Amount</Th>
                <Th numeric>Invoice</Th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => {
                const counted = payment.status === 'succeeded';
                return (
                  <tr key={payment.id}>
                    <Td className="text-gray-600">
                      {shortDate(new Date(payment.paidAt ?? payment.createdAt))}
                    </Td>
                    <Td>{payment.clientName ?? '—'}</Td>
                    <Td>
                      <Link
                        href={`/admin/calendar/${payment.jobId}`}
                        className="text-ink underline decoration-primary-500/40 underline-offset-2 hover:text-primary-600"
                      >
                        {payment.jobNumber ?? 'Job'}
                      </Link>
                    </Td>
                    <Td>
                      {methodLabel(payment.method)}
                      {payment.isDeposit ? (
                        <span className="ml-2 text-[11px] text-gray-500">deposit</span>
                      ) : null}
                      {/* A log that hid these would not be a log. */}
                      {!counted ? (
                        <span
                          className="ml-2 text-[11px] font-medium"
                          style={{ color: STATUS.warning }}
                        >
                          {payment.status.replace(/_/g, ' ')}
                        </span>
                      ) : null}
                    </Td>
                    <Td numeric className={counted ? 'font-medium' : 'text-gray-500 line-through'}>
                      {money(payment.amountCents)}
                    </Td>
                    <Td numeric className="text-gray-600">
                      {money(payment.jobTotalCents)}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
        {report.truncated ? (
          <Hint>Only the most recent are listed. The totals above cover the whole window.</Hint>
        ) : null}
        <Hint>
          Dated by when the money arrived, not when the invoice was raised. A voided payment keeps
          its amount here so it can be accounted for, and is struck through because it is in no
          total.
        </Hint>
      </Panel>
    </div>
  );
}

function Header({ subtitle }: { subtitle: string }) {
  return (
    <div>
      <h1 className="font-heading text-xl font-bold uppercase tracking-label text-ink">Payments</h1>
      <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
    </div>
  );
}
