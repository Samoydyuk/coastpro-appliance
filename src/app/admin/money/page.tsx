import { parseRange } from '@/lib/admin/range';
import Link from 'next/link';
import { getChannels } from '@/lib/admin/queries';
import { MoneyBasis } from '@/components/admin/MoneyBasis';
import { count, money, percent, shortDate } from '@/lib/admin/format';
import { getProfit, getTrend, getBreakdown, type Waterfall } from '@/lib/money/client';
import { OperationsApiError } from '@/lib/bookings/client';
import { Empty, Hint, Panel, SetupNotice, StatTile, Table, Td, Th, Warning } from '@/components/admin/ui';
import { NotConnected } from '@/components/admin/NotConnected';
import { TimeSeries } from '@/components/admin/charts';
import { SERIES, STATUS } from '@/components/admin/palette';
import { serverTranslator } from '@/lib/i18n/server';
import { numberLocale, type Lang, type TranslationKey, type Translator } from '@/lib/i18n';
import { rangeLabel } from '@/lib/i18n/range';

export const dynamic = 'force-dynamic';

/**
 * Expense categories and overhead cadences arrive as enum codes.
 *
 * The code is what the app stores and what a total is grouped by; the label is
 * the only part that has a language. Anything unrecognised falls through to the
 * code itself rather than to a blank cell — a category added in JobPocket
 * should look untranslated, not invisible.
 */
const CATEGORY_KEYS: Record<string, TranslationKey> = {
  MATERIALS: 'money.category.MATERIALS',
  TOOLS: 'money.category.TOOLS',
  FUEL: 'money.category.FUEL',
  VEHICLE: 'money.category.VEHICLE',
  INSURANCE: 'money.category.INSURANCE',
  LICENSE: 'money.category.LICENSE',
  MARKETING: 'money.category.MARKETING',
  OFFICE: 'money.category.OFFICE',
  UTILITIES: 'money.category.UTILITIES',
  LABOR: 'money.category.LABOR',
  OTHER: 'money.category.OTHER',
};

const CADENCE_KEYS: Record<string, TranslationKey> = {
  WEEKLY: 'money.cadence.WEEKLY',
  MONTHLY: 'money.cadence.MONTHLY',
  QUARTERLY: 'money.cadence.QUARTERLY',
  YEARLY: 'money.cadence.YEARLY',
};

function categoryLabel(code: string, t: Translator): string {
  const key = CATEGORY_KEYS[code];
  return key ? t(key) : code;
}

function cadenceLabel(code: string, t: Translator): string {
  const key = CADENCE_KEYS[code];
  return key ? t(key) : code.toLowerCase();
}

/** `+$3,120` / `−$840`. Signed, because the sign is the whole message. */
function signed(cents: number, lang: Lang): string {
  return `${cents >= 0 ? '+' : '−'}${money(Math.abs(cents), lang)}`;
}

/** `2026-08` → `Aug 2026`; a day bucket is already readable. */
function bucketLabel(bucket: string, lang: Lang): string {
  if (bucket.length > 7) return bucket.slice(5).replace('-', '/');
  const [year, month] = bucket.split('-').map(Number);
  // The month is read by a person, so it follows the language rather than the
  // ISO formatter the rest of this codebase uses `en-CA` for.
  return new Date(Date.UTC(year!, (month ?? 1) - 1, 1)).toLocaleDateString(numberLocale(lang), {
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
  detail,
}: {
  label: string;
  cents: number;
  billed: number;
  deduction?: boolean;
  strong?: boolean;
  note?: string;
  /** Where the jobs behind this line live, when there are any. */
  href?: string;
  /**
   * What this line is made of, opened in place.
   *
   * A native `<details>` rather than a click handler: these pages are server
   * components, and a disclosure is the one piece of interaction the browser
   * already does without shipping any JavaScript to do it.
   */
  detail?: React.ReactNode;
}) {
  const t = serverTranslator();
  const negative = strong && cents < 0;
  const name = href ? (
    <Link
      href={href}
      className="text-ink underline decoration-primary-500/40 underline-offset-2 hover:text-primary-600"
    >
      {label}
    </Link>
  ) : (
    label
  );

  return (
    <tr className={strong ? 'border-t-2 border-primary-500/30' : undefined}>
      <Td className={strong ? 'font-semibold text-ink' : undefined}>
        {detail ? (
          <details className="group">
            <summary className="cursor-pointer list-none marker:content-none">
              <span className="mr-1 inline-block text-[10px] text-gray-400 transition-transform group-open:rotate-90">
                ▸
              </span>
              {name}
              {note ? <span className="ml-2 text-[11px] text-gray-500">{note}</span> : null}
            </summary>
            <div className="mt-2 rounded-card border border-primary-500/15 bg-[#f8f7f4] p-3">
              {detail}
            </div>
          </details>
        ) : (
          <>
            {name}
            {note ? <span className="ml-2 text-[11px] text-gray-500">{note}</span> : null}
          </>
        )}
      </Td>
      <Td numeric className={strong ? 'font-semibold' : undefined}>
        {/* Deductions are not alarming, they are arithmetic. Only a loss earns
            a colour, or the reader stops seeing the colour at all. */}
        <span style={negative ? { color: STATUS.critical } : undefined}>
          {deduction ? `−${money(Math.abs(cents), t.lang)}` : money(cents, t.lang)}
        </span>
      </Td>
      <Td numeric className="text-gray-500">
        {billed > 0 ? percent(Math.abs(cents) / billed, 0, t.lang) : '—'}
      </Td>
    </tr>
  );
}

/** A few rows inside a disclosure — deliberately plainer than the main tables. */
function Rows({
  rows,
}: {
  rows: Array<{ key: string; left: string; middle?: string; right: string; href?: string }>;
}) {
  if (rows.length === 0) {
    const t = serverTranslator();
    return <p className="text-xs text-gray-500">{t('money.nothingOnThisLine')}</p>;
  }
  return (
    <table className="w-full text-xs">
      <tbody>
        {rows.map((row) => (
          <tr key={row.key} className="border-b border-primary-500/10 last:border-0">
            <td className="py-1 pr-3">
              {row.href ? (
                <Link
                  href={row.href}
                  className="text-ink underline decoration-primary-500/40 underline-offset-2 hover:text-primary-600"
                >
                  {row.left}
                </Link>
              ) : (
                row.left
              )}
            </td>
            <td className="py-1 pr-3 text-gray-500">{row.middle ?? ''}</td>
            <td className="py-1 text-right tabular-nums">{row.right}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default async function MoneyPage({
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

  // The console's own attribution, for the reconciliation panel at the foot.
  // Its own database, so it fails independently of JobPocket being reachable.
  const attribution = await getChannels(range).catch(() => []);
  const attributedCents = attribution.reduce((sum, row) => sum + row.invoicedCents, 0);
  const reportedCents = attribution.reduce((sum, row) => sum + row.revenueCents, 0);

  let profit: Awaited<ReturnType<typeof getProfit>> | null = null;
  let trend: Awaited<ReturnType<typeof getTrend>> | null = null;
  let breakdown: Awaited<ReturnType<typeof getBreakdown>> | null = null;
  let unconfigured = false;
  let failure: string | null = null;

  try {
    [profit, trend, breakdown] = await Promise.all([
      getProfit(range.from, range.to),
      // Days for a short window, months for a long one. Thirty daily points
      // read as a trend; thirty monthly ones read as a history.
      getTrend(range.from, range.to, range.days > 92 ? 'month' : 'day').catch(() => null),
      // The rows behind the lines that are not made of jobs. Fetched with the
      // rest rather than on click, so opening one costs nothing and works
      // without a line of client JavaScript.
      getBreakdown(range.from, range.to).catch(() => null),
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
        <Header label={rangeLabel(range, t)} />
        <NotConnected what={t('money.notConnected')} />
      </div>
    );
  }

  if (!profit) {
    return (
      <div className="space-y-6">
        <Header label={rangeLabel(range, t)} />
        <Warning>{failure ?? t('money.noAnswer')}</Warning>
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
    label: bucketLabel(point.bucket, t.lang),
    values: {
      // Charts take dollars; everything else on this page takes cents.
      billed: point.billedCents / 100,
      kept: point.netRevenueCents / 100,
    },
  }));

  return (
    <div className="space-y-6">
      <Header label={rangeLabel(range, t)} />
      {failure ? <Warning>{failure}</Warning> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label={t('money.businessMade')}
          value={money(profit.businessEarningsCents, t.lang)}
          emphasis
          // Never a percentage: a loss that shrank from −$500 to −$100 divides
          // out to "▼ 80%" in red, which is the opposite of what happened.
          hint={
            profitDelta === null
              ? undefined
              : t('money.onPeriodBefore', { amount: signed(profitDelta, t.lang) })
          }
        />
        <StatTile
          label={t('money.ownRevenue')}
          value={money(w.netRevenueCents, t.lang)}
          emphasis
          change={
            previous && previous.waterfall.netRevenueCents
              ? (w.netRevenueCents - previous.waterfall.netRevenueCents) /
                previous.waterfall.netRevenueCents
              : null
          }
          hint={t('money.billedKeptHint', {
            billed: money(billed, t.lang),
            pct: billed ? percent(w.netRevenueCents / billed, 0, t.lang) : '—',
          })}
        />
        <StatTile
          label={t('money.jobs')}
          value={count(profit.jobs, t.lang)}
          change={previous && previous.jobs ? (profit.jobs - previous.jobs) / previous.jobs : null}
          hint={t('money.finishedInWindow')}
        />
        <StatTile
          label={t('money.avgTicket')}
          value={money(profit.avgTicketCents, t.lang)}
          hint={t('money.ownRevenueOverJobs')}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label={t('money.dispatchersCut')}
          value={money(dispatchersCut, t.lang)}
          higherIsBetter={false}
          hint={
            billed
              ? t('money.ofWhatWasBilled', { pct: percent(dispatchersCut / billed, 0, t.lang) })
              : undefined
          }
        />
        <StatTile
          label={t('money.parts')}
          value={money(w.partsCostCents, t.lang)}
          higherIsBetter={false}
        />
        <StatTile
          label={t('money.runningCosts')}
          value={money(w.recordedExpensesCents + w.overheadCents, t.lang)}
          higherIsBetter={false}
          hint={t('money.expensesAndOverhead')}
        />
        <StatTile
          label={t('money.breakEven')}
          value={money(profit.breakEvenBeforeOwnerPayCents, t.lang)}
          higherIsBetter={false}
          hint={
            w.netRevenueCents >= profit.breakEvenBeforeOwnerPayCents
              ? t('money.clear', {
                  amount: money(w.netRevenueCents - profit.breakEvenBeforeOwnerPayCents, t.lang),
                })
              : t('money.short', {
                  amount: money(profit.breakEvenBeforeOwnerPayCents - w.netRevenueCents, t.lang),
                })
          }
        />
      </div>

      {/* The verdict sentence is written by JobPocket and arrives finished. */}
      <Panel title={t('money.whereItWent')} subtitle={profit.verdict}>
        <Table>
          <thead>
            <tr>
              <Th>{t('money.line')}</Th>
              <Th numeric>{t('common.amount')}</Th>
              <Th numeric>{t('money.shareOfBilled')}</Th>
            </tr>
          </thead>
          <tbody>
            <Line
              label={t('money.billedToCustomers')}
              cents={billed}
              billed={billed}
              href={`/admin/money/jobs?range=${range.key}&title=${encodeURIComponent(t('common.billed'))}&back=/admin/money`}
            />
            <Line
              label={t('money.dispatchersShare')}
              cents={dispatchersCut}
              billed={billed}
              deduction
              note={t('money.dispatchersShareNote')}
            />
            <Line
              label={t('money.ownRevenue')}
              cents={w.netRevenueCents}
              billed={billed}
              strong
              href={`/admin/money/jobs?range=${range.key}&title=${encodeURIComponent(t('money.ownRevenue'))}&back=/admin/money`}
            />
            <Line
              label={t('money.parts')}
              cents={w.partsCostCents}
              billed={billed}
              deduction
              note={breakdown ? t.plural(breakdown.parts.jobs, 'money.partsJob') : undefined}
              detail={
                breakdown ? (
                  <Rows
                    rows={breakdown.parts.rows.map((row) => ({
                      key: row.id,
                      left: row.jobNumber ?? t('common.job'),
                      middle: row.clientName ?? '',
                      right: money(row.partsCents, t.lang),
                      href: `/admin/calendar/${row.id}`,
                    }))}
                  />
                ) : undefined
              }
            />
            <Line
              label={t('money.expenses')}
              cents={w.recordedExpensesCents}
              billed={billed}
              deduction
              detail={
                breakdown ? (
                  <table className="w-full text-xs">
                    <tbody>
                      {breakdown.expenses.rows.map((row) => (
                        <tr key={row.category} className="border-b border-primary-500/10 last:border-0">
                          <td className="py-1 pr-3" colSpan={2}>
                            {/* A category opens too: "Vehicle $578" answers
                                nothing, three fuel stops and a tyre answers it. */}
                            <details className="group/cat">
                              <summary className="flex cursor-pointer list-none items-center justify-between marker:content-none">
                                <span>
                                  <span className="mr-1 inline-block text-[10px] text-gray-400 transition-transform group-open/cat:rotate-90">
                                    ▸
                                  </span>
                                  {categoryLabel(row.category, t)}
                                  <span className="ml-2 text-[11px] text-gray-500">
                                    {t.plural(row.count, 'money.entry')}
                                  </span>
                                </span>
                                <span className="tabular-nums">{money(row.cents, t.lang)}</span>
                              </summary>
                              <table className="mt-1 w-full">
                                <tbody>
                                  {row.items.map((item) => (
                                    <tr key={item.id}>
                                      <td className="py-0.5 pr-3 text-gray-500">
                                        {item.at ? shortDate(new Date(item.at), t.lang) : '—'}
                                      </td>
                                      <td className="py-0.5 pr-3">
                                        {[item.vendor, item.description].filter(Boolean).join(' · ') || '—'}
                                      </td>
                                      <td className="py-0.5 text-right tabular-nums">
                                        {money(item.cents, t.lang)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </details>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : undefined
              }
            />
            {w.fuelFromMileageCents > 0 && (
              <Line
                label={t('money.fuel')}
                cents={w.fuelFromMileageCents}
                billed={billed}
                deduction
                note={t('money.fuelNote')}
              />
            )}
            {w.writtenOffCents > 0 && (
              <Line
                label={t('money.writtenOff')}
                cents={w.writtenOffCents}
                billed={billed}
                deduction
                note={t('money.writtenOffNote')}
                detail={
                  breakdown ? (
                    <Rows
                      rows={breakdown.writtenOff.rows.map((row) => ({
                        key: row.id,
                        left: row.jobNumber ?? t('common.job'),
                        // The reason is what somebody typed into the app.
                        middle: [row.clientName, row.reason].filter(Boolean).join(' · '),
                        right: money(row.ownShareCents, t.lang),
                        href: `/admin/calendar/${row.id}`,
                      }))}
                    />
                  ) : undefined
                }
              />
            )}
            <Line
              label={t('money.overhead')}
              cents={w.overheadCents}
              billed={billed}
              deduction
              note={t('money.overheadNote')}
              detail={
                breakdown ? (
                  <Rows
                    rows={breakdown.overhead.rows.map((row) => ({
                      key: row.id,
                      left: row.name,
                      middle: `${money(row.amountCents, t.lang)} ${cadenceLabel(row.cadence, t)}`,
                      right: money(row.inPeriodCents, t.lang),
                    }))}
                  />
                ) : undefined
              }
            />
            <Line
              label={t('money.businessMade')}
              cents={profit.businessEarningsCents}
              billed={billed}
              strong
            />
          </tbody>
        </Table>
        <Hint>{t('money.waterfallHint')}</Hint>
      </Panel>

      {profit.dataQuality.missingCategories.length > 0 && (
        <Warning>
          {t('money.missingCategories', {
            // The codes are what an expense is grouped by; only the labels are
            // read, and lowercasing an English word here would leave Ukrainian
            // untouched and English mid-sentence.
            categories: profit.dataQuality.missingCategories
              .map((code) => categoryLabel(code, t))
              .join(', '),
          })}
        </Warning>
      )}
      {profit.dataQuality.unsplitCompanies.length > 0 && (
        <Warning>
          {t('money.unsplitWarning', {
            companies: profit.dataQuality.unsplitCompanies
              .map((c) => `${c.name} (${money(c.billedCents, t.lang)})`)
              .join(', '),
            // "has"/"have" in English, "не має"/"не мають" in Ukrainian — a
            // choice `n === 1` cannot make in a language with four forms.
            verb: t.plural(profit.dataQuality.unsplitCompanies.length, 'money.unsplitVerb'),
          })}
        </Warning>
      )}

      <Panel
        title={t('money.billedAndKept')}
        subtitle={trend?.granularity === 'month' ? t('money.byMonth') : t('money.byDay')}
      >
        {points.length >= 3 ? (
          <TimeSeries
            points={points}
            format="money"
            series={[
              { key: 'billed', label: t('common.billed'), color: SERIES[0]! },
              { key: 'kept', label: t('money.ownRevenue'), color: SERIES[2]! },
            ]}
          />
        ) : (
          <Empty>{t('money.pickLongerWindow')}</Empty>
        )}
        <Hint>{t('money.trendHint')}</Hint>
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
  const t = serverTranslator();
  return (
    <div>
      <h1 className="font-heading text-xl font-bold uppercase tracking-label text-ink">
        {t('money.title')}
      </h1>
      <p className="mt-1 text-sm text-gray-600">{label}</p>
    </div>
  );
}
