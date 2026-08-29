import Link from 'next/link';
import { parseRange } from '@/lib/admin/range';
import { count, money, percent, shortDate } from '@/lib/admin/format';
import { getPayments } from '@/lib/money/client';
import { OperationsApiError } from '@/lib/bookings/client';
import { Empty, Hint, Panel, SetupNotice, StatTile, Table, Td, Th, Warning } from '@/components/admin/ui';
import { NotConnected } from '@/components/admin/NotConnected';
import { RankedBars } from '@/components/admin/charts';
import { paymentColor, STATUS } from '@/components/admin/palette';
import { Pager } from '@/components/admin/Pager';
import { serverTranslator } from '@/lib/i18n/server';
import type { TranslationKey, Translator } from '@/lib/i18n';
import { rangeLabel } from '@/lib/i18n/range';

export const dynamic = 'force-dynamic';

/**
 * `STRIPE` is the filter, the colour and the grouping key — never the label.
 *
 * Lower-casing the code and capitalising the first letter produced English out
 * of an enum, which is fine until the screen is in another language: there is
 * no rule that turns `BANK_TRANSFER` into "Банківський переказ". The map is the
 * rule. A method JobPocket adds later falls through to its own code, which
 * reads as untranslated rather than disappearing.
 */
const METHOD_KEYS: Record<string, TranslationKey> = {
  STRIPE: 'money.method.STRIPE',
  CASH: 'money.method.CASH',
  CHECK: 'money.method.CHECK',
  BANK_TRANSFER: 'money.method.BANK_TRANSFER',
  ZELLE: 'money.method.ZELLE',
  VENMO: 'money.method.VENMO',
  OTHER: 'money.method.OTHER',
};

/** What became of a payment that is in no total. */
const STATUS_KEYS: Record<string, TranslationKey> = {
  pending: 'money.status.pending',
  processing: 'money.status.processing',
  failed: 'money.status.failed',
  canceled: 'money.status.canceled',
  voided: 'money.status.voided',
  refunded: 'money.status.refunded',
  partially_refunded: 'money.status.partially_refunded',
};

function methodLabel(method: string, t: Translator): string {
  const key = METHOD_KEYS[method];
  return key ? t(key) : method;
}

function statusLabel(status: string, t: Translator): string {
  const key = STATUS_KEYS[status];
  return key ? t(key) : status.replace(/_/g, ' ');
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const t = serverTranslator();
  const range = parseRange({
    range: searchParams.range as string,
    from: searchParams.from as string,
    to: searchParams.to as string,
  });

  const method = (searchParams.method as string) || undefined;
  const offset = Number(searchParams.offset ?? 0) || 0;

  let report: Awaited<ReturnType<typeof getPayments>> | null = null;
  let unconfigured = false;
  let failure: string | null = null;

  try {
    report = await getPayments(range.from, range.to, { method, offset });
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
        <Header subtitle={rangeLabel(range, t)} />
        <NotConnected what={t('money.notConnected')} />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-6">
        <Header subtitle={rangeLabel(range, t)} />
        <Warning>{failure ?? t('money.noAnswer')}</Warning>
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
      <Header subtitle={rangeLabel(range, t)} />
      {failure ? <Warning>{failure}</Warning> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label={t('payments.taken')} value={money(totals.succeededCents, t.lang)} emphasis />
        <StatTile label={t('payments.count')} value={count(totals.succeededCount, t.lang)} />
        <StatTile
          label={t('payments.average')}
          value={
            totals.succeededCount
              ? money(Math.round(totals.succeededCents / totals.succeededCount), t.lang)
              : '—'
          }
        />
        <StatTile
          label={t('payments.cash')}
          value={money(cash, t.lang)}
          hint={
            totals.succeededCents
              ? t('money.ofWhatWasTaken', {
                  pct: percent(cash / totals.succeededCents, 0, t.lang),
                })
              : undefined
          }
        />
      </div>

      {excludedTotal > 0 && (
        <Warning>
          {t('money.excludedWarning', {
            amount: money(excludedTotal, t.lang),
            list: [
              excluded.voidedCount ? t.plural(excluded.voidedCount, 'money.voided') : null,
              excluded.refundedCount ? t.plural(excluded.refundedCount, 'money.refunded') : null,
              excluded.partiallyRefundedCount
                ? t.plural(excluded.partiallyRefundedCount, 'money.partlyRefunded')
                : null,
              excluded.pendingCount ? t.plural(excluded.pendingCount, 'money.stillPending') : null,
            ]
              .filter(Boolean)
              .join(', '),
          })}
        </Warning>
      )}

      <Panel
        title={t('payments.howArrived')}
        subtitle={
          method
            ? t('money.showingOnly', { method: methodLabel(method, t) })
            : t('money.onlyWentThrough')
        }
      >
        {totals.byMethod.length === 0 ? (
          <Empty>{t('money.nothingTaken')}</Empty>
        ) : (
          <RankedBars
            format="money"
            items={totals.byMethod.map((row) => ({
              label: methodLabel(row.method, t),
              value: row.cents / 100,
              color: paymentColor(row.method),
              note: t.plural(row.count, 'plural.payment'),
            }))}
          />
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {[
            { m: '', l: t('money.methodAll') },
            ...totals.byMethod.map((row) => ({ m: row.method, l: methodLabel(row.method, t) })),
          ].map((option) => (
            <Link
              key={option.m || 'all'}
              href={`/admin/money/payments?range=${range.key}${option.m ? `&method=${option.m}` : ''}`}
              className={`rounded-card border px-3 py-1.5 font-heading text-[10px] font-semibold uppercase tracking-label transition-colors ${
                (method ?? '') === option.m
                  ? 'border-ink bg-ink text-cream'
                  : 'border-primary-500/25 text-gray-600 hover:border-ink hover:text-ink'
              }`}
            >
              {option.l}
            </Link>
          ))}
        </div>
      </Panel>

      <Panel
        title={t('payments.every')}
        subtitle={t('payments.newestFirst')}
        action={<a
              href={`/api/admin/export?type=payments&range=${range.key}`}
              className="inline-flex h-8 items-center rounded-card border border-primary-500/30 px-3 font-heading text-[10px] font-semibold uppercase tracking-label text-gray-600 hover:border-ink hover:text-ink"
            >
              {t('common.exportCsv')}
            </a>}
      >
        {payments.length === 0 ? (
          <Empty>{t('money.nothingTaken')}</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t('common.date')}</Th>
                <Th>{t('common.client')}</Th>
                <Th>{t('common.job')}</Th>
                <Th>{t('payments.how')}</Th>
                <Th numeric>{t('common.amount')}</Th>
                <Th numeric>{t('common.invoice')}</Th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => {
                const counted = payment.status === 'succeeded';
                return (
                  <tr key={payment.id}>
                    <Td className="text-gray-600">
                      {shortDate(new Date(payment.paidAt ?? payment.createdAt), t.lang)}
                    </Td>
                    <Td>{payment.clientName ?? '—'}</Td>
                    <Td>
                      <Link
                        href={`/admin/calendar/${payment.jobId}`}
                        className="text-ink underline decoration-primary-500/40 underline-offset-2 hover:text-primary-600"
                      >
                        {payment.jobNumber ?? t('common.job')}
                      </Link>
                    </Td>
                    <Td>
                      {methodLabel(payment.method, t)}
                      {payment.isDeposit ? (
                        <span className="ml-2 text-[11px] text-gray-500">{t('money.deposit')}</span>
                      ) : null}
                      {/* A log that hid these would not be a log. */}
                      {!counted ? (
                        <span
                          className="ml-2 text-[11px] font-medium"
                          style={{ color: STATUS.warning }}
                        >
                          {statusLabel(payment.status, t)}
                        </span>
                      ) : null}
                    </Td>
                    <Td numeric className={counted ? 'font-medium' : 'text-gray-500 line-through'}>
                      {money(payment.amountCents, t.lang)}
                    </Td>
                    <Td numeric className="text-gray-600">
                      {money(payment.jobTotalCents, t.lang)}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
        <Pager
          base={`/admin/money/payments?range=${range.key}${method ? `&method=${method}` : ''}`}
          offset={report.offset}
          shown={report.payments.length}
          total={report.total}
          hasMore={report.hasMore}
        />
        <Hint>{t('money.paymentsHint')}</Hint>
      </Panel>
    </div>
  );
}

function Header({ subtitle }: { subtitle: string }) {
  const t = serverTranslator();
  return (
    <div>
      <h1 className="font-heading text-xl font-bold uppercase tracking-label text-ink">
        {t('payments.title')}
      </h1>
      <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
    </div>
  );
}
