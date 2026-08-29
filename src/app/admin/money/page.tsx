import { parseRange } from '@/lib/admin/range';
import Link from 'next/link';
import { getChannels } from '@/lib/admin/queries';
import { MoneyBasis } from '@/components/admin/MoneyBasis';
import { count, money, percent } from '@/lib/admin/format';
import { getProfit, getTrend, type Waterfall } from '@/lib/money/client';
import { OperationsApiError } from '@/lib/bookings/client';
import { Empty, Hint, Panel, SetupNotice, StatTile, Table, Td, Th, Warning } from '@/components/admin/ui';
import { NotConnected } from '@/components/admin/NotConnected';
import { TimeSeries } from '@/components/admin/charts';
import { SERIES, STATUS } from '@/components/admin/palette';

export const dynamic = 'force-dynamic';

/** `+$3,120` / `−$840`. Signed, because the sign is the whole message. */
function signed(cents: number): string {
  return `${cents >= 0 ? '+' : '−'}${money(Math.abs(cents))}`;
}

/** `2026-08` → `Aug 2026`; a day bucket is already readable. */
function bucketLabel(bucket: string): string {
  if (bucket.length > 7) return bucket.slice(5).replace('-', '/');
  const [year, month] = bucket.split('-').map(Number);
  return new Date(Date.UTC(year!, (month ?? 1) - 1, 1)).toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
  });
}

/**
 * One row of the descent from what was billed to what was kept.
 *
 * `share` is measured against what the customer was charged, which is the only
 * denominator that stays the same the whole way down.
 */
function Line({
  label,
  cents,
  billed,
  deduction = false,
  strong = false,
  note,
  href,
}: {
  label: string;
  cents: number;
  billed: number;
  deduction?: boolean;
  strong?: boolean;
  note?: string;
  /** Where the jobs behind this line live, when there are any. */
  href?: string;
}) {
  const negative = strong && cents < 0;
  return (
    <tr className={strong ? 'border-t-2 border-primary-500/30' : undefined}>
      <Td className={strong ? 'font-semibold text-ink' : undefined}>
        {href ? (
          <Link
            href={href}
            className="text-ink underline decoration-primary-500/40 underline-offset-2 hover:text-primary-600"
          >
            {label}
          </Link>
        ) : (
          label
        )}
        {note ? <span className="ml-2 text-[11px] text-gray-500">{note}</span> : null}
      </Td>
      <Td numeric className={strong ? 'font-semibold' : undefined}>
        {/* Deductions are not alarming, they are arithmetic. Only a loss earns
            a colour, or the reader stops seeing the colour at all. */}
        <span style={negative ? { color: STATUS.critical } : undefined}>
          {deduction ? `−${money(Math.abs(cents))}` : money(cents)}
        </span>
      </Td>
      <Td numeric className="text-gray-500">
        {billed > 0 ? percent(Math.abs(cents) / billed, 0) : '—'}
      </Td>
    </tr>
  );
}

export default async function MoneyPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const range = parseRange({
    range: searchParams.range as string,
    from: searchParams.from as string,
    to: searchParams.to as string,
  });

  // The console's own attribution, for the reconciliation panel at the foot.
  // Its own database, so it fails independently of JobPocket being reachable.
  const attribution = await getChannels(range).catch(() => []);
  const attributedCents = attribution.reduce((sum, row) => sum + row.invoicedCents, 0);
  const reportedCents = attribution.reduce((sum, row) => sum + row.revenueCents, 0);

  let profit: Awaited<ReturnType<typeof getProfit>> | null = null;
  let trend: Awaited<ReturnType<typeof getTrend>> | null = null;
  let unconfigured = false;
  let failure: string | null = null;

  try {
    [profit, trend] = await Promise.all([
      getProfit(range.from, range.to),
      // Days for a short window, months for a long one. Thirty daily points
      // read as a trend; thirty monthly ones read as a history.
      getTrend(range.from, range.to, range.days > 92 ? 'month' : 'day').catch(() => null),
    ]);
  } catch (error) {
    if (error instanceof OperationsApiError) {
      if (error.code === 'not_configured') unconfigured = true;
      else failure = error.message;
    } else {
      return <SetupNotice error={error} />;
    }
  }

  // Nothing else is drawn: an empty profit page reads as "you earned nothing",
  // which is a very different and much more alarming sentence than "not
  // connected yet".
  if (unconfigured) {
    return (
      <div className="space-y-6">
        <Header label={range.label} />
        <NotConnected what="Jobs and payments" />
      </div>
    );
  }

  if (!profit) {
    return (
      <div className="space-y-6">
        <Header label={range.label} />
        <Warning>{failure ?? 'JobPocket did not answer.'}</Warning>
      </div>
    );
  }

  const w: Waterfall = profit.waterfall;
  const billed = w.billedCents;
  const dispatchersCut = billed - w.netRevenueCents;
  const previous = profit.previous;
  // Measured on what the business made, not on net profit: the owner's draw is
  // a distribution of the answer rather than a cost against it.
  const profitDelta = previous
    ? profit.businessEarningsCents - previous.businessEarningsCents
    : null;

  const points = (trend?.points ?? []).map((point) => ({
    label: bucketLabel(point.bucket),
    values: {
      // Charts take dollars; everything else on this page takes cents.
      billed: point.billedCents / 100,
      kept: point.netRevenueCents / 100,
    },
  }));

  return (
    <div className="space-y-6">
      <Header label={range.label} />
      {failure ? <Warning>{failure}</Warning> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="What the business made"
          value={money(profit.businessEarningsCents)}
          emphasis
          // Never a percentage: a loss that shrank from −$500 to −$100 divides
          // out to "▼ 80%" in red, which is the opposite of what happened.
          hint={profitDelta === null ? undefined : `${signed(profitDelta)} on the period before`}
        />
        <StatTile
          label="Own revenue"
          value={money(w.netRevenueCents)}
          emphasis
          change={
            previous && previous.waterfall.netRevenueCents
              ? (w.netRevenueCents - previous.waterfall.netRevenueCents) /
                previous.waterfall.netRevenueCents
              : null
          }
          hint={`${money(billed)} billed · ${billed ? percent(w.netRevenueCents / billed, 0) : '—'} kept`}
        />
        <StatTile
          label="Jobs"
          value={count(profit.jobs)}
          change={previous && previous.jobs ? (profit.jobs - previous.jobs) / previous.jobs : null}
          hint="finished in this window"
        />
        <StatTile
          label="Average ticket"
          value={money(profit.avgTicketCents)}
          hint="own revenue ÷ jobs"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Dispatchers' cut"
          value={money(dispatchersCut)}
          higherIsBetter={false}
          hint={billed ? `${percent(dispatchersCut / billed, 0)} of what was billed` : undefined}
        />
        <StatTile label="Parts" value={money(w.partsCostCents)} higherIsBetter={false} />
        <StatTile
          label="Running costs"
          value={money(w.recordedExpensesCents + w.overheadCents)}
          higherIsBetter={false}
          hint="expenses and overhead"
        />
        <StatTile
          label="Break-even"
          value={money(profit.breakEvenBeforeOwnerPayCents)}
          higherIsBetter={false}
          hint={
            w.netRevenueCents >= profit.breakEvenBeforeOwnerPayCents
              ? `${money(w.netRevenueCents - profit.breakEvenBeforeOwnerPayCents)} clear`
              : `${money(profit.breakEvenBeforeOwnerPayCents - w.netRevenueCents)} short`
          }
        />
      </div>

      <Panel title="Where the money went" subtitle={profit.verdict}>
        <Table>
          <thead>
            <tr>
              <Th>Line</Th>
              <Th numeric>Amount</Th>
              <Th numeric>Share of billed</Th>
            </tr>
          </thead>
          <tbody>
            <Line
              label="Billed to customers"
              cents={billed}
              billed={billed}
              href={`/admin/money/jobs?range=${range.key}&title=${encodeURIComponent('Billed')}&back=/admin/money`}
            />
            <Line
              label="Dispatchers' share"
              cents={dispatchersCut}
              billed={billed}
              deduction
              note="what the companies sending you work keep"
            />
            <Line
              label="Own revenue"
              cents={w.netRevenueCents}
              billed={billed}
              strong
              href={`/admin/money/jobs?range=${range.key}&title=${encodeURIComponent('Own revenue')}&back=/admin/money`}
            />
            <Line label="Parts" cents={w.partsCostCents} billed={billed} deduction />
            <Line label="Expenses" cents={w.recordedExpensesCents} billed={billed} deduction />
            {w.fuelFromMileageCents > 0 && (
              <Line
                label="Fuel"
                cents={w.fuelFromMileageCents}
                billed={billed}
                deduction
                note="from the mileage log"
              />
            )}
            {w.writtenOffCents > 0 && (
              <Line
                label="Written off"
                cents={w.writtenOffCents}
                billed={billed}
                deduction
                note="debts given up on in this window"
              />
            )}
            <Line label="Overhead" cents={w.overheadCents} billed={billed} deduction />
            <Line
              label="What the business made"
              cents={profit.businessEarningsCents}
              billed={billed}
              strong
            />
          </tbody>
        </Table>
        <Hint>
          This is what the business made, not what is left after paying yourself — a draw is a
          share of the answer, not a cost against it. Every figure is worked out by JobPocket; the
          console formats them and calculates nothing, so this page and the app cannot drift apart.
          Underlined lines open onto the jobs behind them.
        </Hint>
      </Panel>

      {profit.dataQuality.missingCategories.length > 0 && (
        <Warning>
          Nothing has been entered under {profit.dataQuality.missingCategories.join(', ').toLowerCase()}.
          A margin built on a few categories out of eleven looks excellent and is not.
        </Warning>
      )}
      {profit.dataQuality.unsplitCompanies.length > 0 && (
        <Warning>
          {profit.dataQuality.unsplitCompanies
            .map((c) => `${c.name} (${money(c.billedCents)})`)
            .join(', ')}{' '}
          {profit.dataQuality.unsplitCompanies.length === 1 ? 'has' : 'have'} no split recorded, so
          the whole ticket is counted as yours. If they take a cut, this profit is too high.
        </Warning>
      )}

      <Panel
        title="Billed and kept"
        subtitle={trend?.granularity === 'month' ? 'By month' : 'By day'}
      >
        {points.length >= 3 ? (
          <TimeSeries
            points={points}
            format="money"
            series={[
              { key: 'billed', label: 'Billed', color: SERIES[0]! },
              { key: 'kept', label: 'Own revenue', color: SERIES[2]! },
            ]}
          />
        ) : (
          <Empty>Pick a longer window to see the shape of it.</Empty>
        )}
        <Hint>
          Profit is deliberately not a third line here. Overhead and your own pay are spread across
          whichever window you picked, so cutting them per day would draw a profit that does not add
          up to the one in the table above.
        </Hint>
      </Panel>

      {/* At the foot, not the head: this explains why the number above does not
          match Channels, and that question only arises once you have read it. */}
      <MoneyBasis
        invoicedCents={billed}
        attributedCents={attributedCents}
        reportedCents={reportedCents}
      />
    </div>
  );
}

function Header({ label }: { label: string }) {
  return (
    <div>
      <h1 className="font-heading text-xl font-bold uppercase tracking-label text-ink">Profit</h1>
      <p className="mt-1 text-sm text-gray-600">{label}</p>
    </div>
  );
}
