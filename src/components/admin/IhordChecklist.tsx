'use client';

import { useMemo, useState } from 'react';
import { ArrowUpDown, Camera, ChevronDown, ChevronRight, ScanLine, Search } from 'lucide-react';
import { money, shortDate } from '@/lib/admin/format';
import { useT } from '@/components/admin/LanguageProvider';
import { Empty, Hint, Panel, StatTile, Table, Td, Th, Warning } from '@/components/admin/ui';
import { INK_MUTED, STATUS } from '@/components/admin/palette';
import type { TranslationKey } from '@/lib/i18n';
import type { IhordInvoice, JobCard, WorklistFlag } from '@/lib/ihord/client';

/**
 * The reconciliation, one visit at a time.
 *
 * The summary screen answers "is anything wrong". This answers the question
 * that comes after it, which is the one somebody actually spends an afternoon
 * on: go down every visit in the window and satisfy yourself it is right — the
 * parts, the money in, the paperwork — and record that you did.
 *
 * Three decisions shape it.
 *
 * **The tick is ours, and it is not theirs.** The dispatcher's `Reconciled`
 * means they agree the money is settled; a tick here means somebody read the
 * row. Conflating the two would let their agreement stand in for our check,
 * which is exactly the substitution that let three payouts worth $7,257 go
 * unnoticed for a month.
 *
 * **Every row is drawn, not just the broken ones.** A checklist that hides the
 * rows that look fine cannot be worked through, because "I have seen all of
 * these" is the only state that ends the afternoon. Findings are chips on the
 * row rather than a separate table.
 *
 * **A row is never silently thin.** When JobPocket has no copy of a visit, or
 * could not be read, the expanded row says so in those words. A blank parts
 * list that means "could not read" and a blank parts list that means "nothing
 * was bought" would otherwise be the same pixel, and one of them is a finding.
 */

export interface ChecklistRow {
  jobNumber: string;
  invoiceNumber: string | null;
  customer: string;
  date: string | null;
  soldCents: number | null;
  partsCents: number | null;
  toYouCents: number | null;
  settled: 'Pending' | 'Reconciled' | 'Paid' | null;
  jpJobId: string | null;
  jpStatus: string | null;
  card: JobCard | null;
  /** Their own invoices, where our books hold no money for the visit. */
  theirInvoices: IhordInvoice[];
  ihordJobId: string | null;
  flags: WorklistFlag[];
  /** Photographs and scanned paper, counted by JobPocket. */
  photos: number;
  scans: number;
  /** Our own tick, as it stands. */
  checked: boolean;
  note: string | null;
  /** What the parts cost, as recorded by hand on this screen. */
  partsCostCents: number | null;
  checkedAt: string | null;
}

/** What is being recorded against a visit, as this screen holds it. */
interface Tick {
  checked: boolean;
  note: string | null;
  partsCostCents: number | null;
}

type Filter = 'all' | 'unchecked' | 'flagged' | 'nothingBought';

const FILTERS: Array<{ key: Filter; label: TranslationKey }> = [
  { key: 'all', label: 'ihord.list.filterAll' },
  { key: 'unchecked', label: 'ihord.list.filterUnchecked' },
  { key: 'flagged', label: 'ihord.list.filterFlagged' },
  { key: 'nothingBought', label: 'ihord.list.filterNothingBought' },
];

/**
 * How loudly each finding is drawn.
 *
 * Money that may have gone missing is red; a gap in the paperwork is amber.
 * The distinction is not decoration — on a long list it is what stops the two
 * being worked through at the same speed.
 */
const SEVERITY: Record<WorklistFlag, string> = {
  missing_in_jobpocket: STATUS.warning,
  missing_in_ihord: STATUS.critical,
  not_settled: STATUS.warning,
  parts_missing_here: STATUS.critical,
  parts_missing_there: STATUS.critical,
  parts_differ: STATUS.serious,
  parts_without_cost: STATUS.serious,
  no_parts_no_expenses: INK_MUTED,
  no_invoice: STATUS.warning,
  not_collected: STATUS.serious,
  total_differs: STATUS.serious,
  their_invoice_open: STATUS.critical,
};

/**
 * Said, but not counted as a problem.
 *
 * Four visits in five on this account are a service call with no part, so
 * colouring "nothing bought" as a finding would paint most of the window
 * amber and put it under the "with findings" filter — which would then be the
 * whole list. It keeps its own chip and its own filter, because the owner
 * asked to be able to find those visits; it just does not make a row wrong.
 */
const NOTE_FLAGS = new Set<WorklistFlag>(['no_parts_no_expenses']);

function FlagChip({ flag }: { flag: WorklistFlag }) {
  const t = useT();
  const color = SEVERITY[flag] ?? STATUS.warning;
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold leading-tight"
      style={{ color, backgroundColor: `${color}1a` }}
    >
      {t(`ihord.flag.${flag}` as TranslationKey)}
    </span>
  );
}

/** A small labelled block inside the expanded row. */
function Section({
  title,
  empty,
  children,
}: {
  title: string;
  empty?: string;
  children?: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="min-w-[220px] flex-1">
      <p className="font-heading text-[10px] font-semibold uppercase tracking-label text-gray-500">
        {title}
      </p>
      {children ?? <p className="mt-1 text-xs text-gray-400">{empty}</p>}
    </div>
  );
}

/**
 * Which way the parts difference points, in words.
 *
 * A signed figure alone leaves the reader to work out whose favour it is in,
 * and that is the one thing the number is for. It is said with both amounts,
 * because they are not the same money: the parts gap is what the argument is
 * about, and half of it is what actually lands in the payout — the dispatcher
 * reimburses parts in full and splits the rest, so understating a part costs
 * fifty cents on the dollar, not a dollar. Quoting only the gap would send
 * somebody to ask for twice what is owed.
 *
 * A dollar of slack: both sides round, and reporting four cents as a debt
 * teaches the reader to ignore the tile.
 */
function owedHint(t: ReturnType<typeof useT>, difference: number, priced: number): string {
  if (priced === 0) return t('ihord.list.totalNothingPriced');

  const across = t('ihord.list.totalDifferenceHint', { n: priced });
  if (Math.abs(difference) <= 100) return `${t('ihord.list.owedEven')} · ${across}`;

  const amounts = {
    amount: money(Math.abs(difference), t.lang),
    half: money(Math.round(Math.abs(difference) / 2), t.lang),
  };
  const who =
    difference > 0 ? t('ihord.list.owedToYou', amounts) : t('ihord.list.owedByYou', amounts);
  return `${who} · ${across}`;
}

/** "12.34" → 1234 cents. Null for an empty box, undefined for nonsense. */
function parseMoney(raw: string): number | null | undefined {
  const text = raw.trim().replace(/[$\s]/g, '').replace(',', '.');
  if (!text) return null;
  const value = Number(text);
  if (!Number.isFinite(value) || value < 0) return undefined;
  return Math.round(value * 100);
}

/**
 * What the parts on this visit cost, typed in by hand, beside both books.
 *
 * The dispatcher reimburses parts in full, so this one figure is what their
 * `parts` column has to be checked against — and it cannot simply be read out
 * of JobPocket, because a receipt exists in a van before anybody enters it.
 * Recording it here is what lets the difference be seen at all: their number,
 * the app's number, and the one the owner is actually claiming.
 *
 * The difference against their column is shown the moment a figure is entered,
 * because that subtraction is the entire reason somebody opened this row.
 */
function PartsClaim({
  row,
  tick,
  onSave,
}: {
  row: ChecklistRow;
  tick: Tick;
  onSave: (partsCostCents: number | null) => void;
}) {
  const t = useT();
  const [error, setError] = useState(false);

  const claimed = tick.partsCostCents;
  // Their column against the claim. Absent on their side counts as zero rather
  // than as unknown: a visit they carry no parts figure for is one they are
  // reimbursing nothing on, which is exactly the gap worth seeing.
  const theirs = row.partsCents;
  const difference = claimed != null ? claimed - (theirs ?? 0) : null;

  return (
    <div className="mt-2 border-t border-primary-500/15 pt-2">
      <label className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-gray-500">{t('ihord.list.claimParts')}</span>
        <input
          type="text"
          inputMode="decimal"
          defaultValue={claimed == null ? '' : (claimed / 100).toFixed(2)}
          placeholder="0.00"
          onBlur={(event) => {
            const cents = parseMoney(event.target.value);
            if (cents === undefined) {
              setError(true);
              return;
            }
            setError(false);
            if (cents !== claimed) onSave(cents);
          }}
          className={`h-7 w-24 rounded-card border bg-white px-2 text-right text-xs tabular-nums text-ink focus:outline-none ${
            error ? 'border-[#d03b3b]' : 'border-primary-500/25 focus:border-ink'
          }`}
        />
        {difference != null && Math.abs(difference) > 100 && (
          <span
            className="tabular-nums text-[11px] font-semibold"
            style={{ color: difference > 0 ? STATUS.critical : STATUS.serious }}
          >
            {t('ihord.list.claimGap', { amount: money(Math.abs(difference), t.lang) })}
          </span>
        )}
      </label>
      {/* Zero, never a dash, when JobPocket has nothing for the visit. A dash
          reads as "unknown" and invites the reader to move on; a zero is a
          claim — the app says no parts were bought — and that is something to
          agree or disagree with against their software. */}
      <p className="mt-1 text-[11px] text-gray-400">
        {t('ihord.list.claimHint', {
          theirs: money(theirs ?? 0, t.lang),
          ours: money(row.card?.partsCostCents ?? 0, t.lang),
        })}
      </p>
    </div>
  );
}

/**
 * What their own invoice says, for a visit our books have no money for.
 *
 * Drawn at the top of the expanded row rather than beside the JobPocket
 * columns, because on these rows it is not a second opinion — it is the only
 * record there is. `Draft` is called out in words: a draft was never sent to
 * anybody, so its balance is not "unpaid", it is "never asked for", and those
 * are two entirely different afternoons of work.
 */
function TheirInvoices({ invoices }: { invoices: IhordInvoice[] }) {
  const t = useT();
  return (
    <div className="mb-4 rounded-card border border-primary-500/20 bg-white p-3">
      <p className="font-heading text-[10px] font-semibold uppercase tracking-label text-gray-500">
        {t('ihord.list.theirInvoices')}
      </p>
      <ul className="mt-1.5 space-y-2 text-xs">
        {invoices.map((invoice) => (
          <li key={invoice.cuid} className="leading-snug">
            <a
              href={`https://www.ihord.org/invoices/${invoice.cuid}`}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-ink underline decoration-primary-500/40 underline-offset-2"
            >
              {invoice.number ?? invoice.cuid.slice(0, 8)}
            </a>
            {invoice.status && (
              <span
                className="ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{
                  color: invoice.status === 'Paid' ? STATUS.good : STATUS.critical,
                  backgroundColor: `${invoice.status === 'Paid' ? STATUS.good : STATUS.critical}1a`,
                }}
              >
                {invoice.status}
              </span>
            )}
            <span className="ml-2 tabular-nums text-gray-600">
              {t('ihord.list.theirSold')} {money(invoice.totalCents, t.lang)} ·{' '}
              {t('ihord.list.theirCollected')} {money(invoice.collectedCents, t.lang)} ·{' '}
              {t('ihord.list.theirBalance')} {money(invoice.balanceCents, t.lang)}
            </span>
            {invoice.payments.length > 0 ? (
              <span className="ml-2 text-gray-500">
                {invoice.payments
                  .map(
                    (payment) =>
                      `${money(payment.amountCents, t.lang)} ${payment.method}${
                        payment.date ? ` ${shortDate(new Date(payment.date), t.lang)}` : ''
                      }`
                  )
                  .join(' · ')}
              </span>
            ) : (
              <span className="ml-2 text-[11px]" style={{ color: STATUS.warning }}>
                {t('ihord.list.theirNoPayments')}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The dispatcher's word for a visit, drawn so `Pending` cannot be skimmed past. */
function SettledPill({ settled }: { settled: ChecklistRow['settled'] }) {
  if (!settled) return <span className="text-gray-300">—</span>;
  const color = settled === 'Pending' ? STATUS.warning : STATUS.good;
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 font-heading text-[10px] font-semibold uppercase tracking-label"
      style={{ color, backgroundColor: `${color}1a` }}
    >
      {settled}
    </span>
  );
}

export function IhordChecklist({
  rows,
  period,
  cardsUnavailable,
}: {
  rows: ChecklistRow[];
  period: string;
  cardsUnavailable: number;
}) {
  const t = useT();

  /**
   * The ticks live here, not in the server render.
   *
   * A checklist that reloads the page on every tick loses its scroll position,
   * which on a hundred-row list means finding your place again after every
   * single row. The write goes to the server and the row keeps what it was
   * given unless the write failed.
   */
  const [ticks, setTicks] = useState<Record<string, Tick>>(() =>
    Object.fromEntries(
      rows.map((row) => [
        row.jobNumber,
        { checked: row.checked, note: row.note, partsCostCents: row.partsCostCents },
      ])
    )
  );
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  // Newest first to open with, because the rows most likely to still be
  // arguable are the recent ones. Oldest first is what a full pass wants.
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  const checkedCount = Object.values(ticks).filter((tick) => tick.checked).length;

  /**
   * The window added up, with the corrections applied.
   *
   * Over the whole period, never the filter. A total that moved every time
   * somebody narrowed the list would be a different number each time it was
   * read, and this one is meant to be the answer to "so what am I owed".
   *
   * Where a parts cost has been entered by hand it is used; where it has not,
   * the figure that actually reached the dispatcher stands in — their own
   * `parts` column, falling back to what the app pushed when they carry no row
   * at all. So the total is complete from the first visit checked, and only
   * gets more accurate as rows are worked through.
   *
   * The correction is halved on purpose. The dispatcher reimburses parts in
   * full and splits the rest, so the payout is `(sold − parts) / 2 + parts` —
   * which is `sold / 2 + parts / 2`. Every dollar of parts left unclaimed is
   * therefore fifty cents, not a dollar, and a report that promised the dollar
   * would be overstating what is owed.
   */
  const totals = useMemo(() => {
    let theirParts = 0;
    let claimedParts = 0;
    let toYou = 0;
    let difference = 0;
    let priced = 0;

    for (const row of rows) {
      const theirs = row.partsCents;
      const billed = theirs ?? row.card?.partsCostCents ?? 0;
      const claimed = ticks[row.jobNumber]?.partsCostCents ?? null;

      theirParts += theirs ?? 0;
      claimedParts += claimed ?? billed;
      toYou += row.toYouCents ?? 0;

      /**
       * Every visit priced by hand, counted the same way the row shows it.
       *
       * A visit their books carry no parts figure for counts as zero, not as
       * unknown — they are reimbursing nothing on it, so the whole claim is the
       * gap. The bigger problem on such a row, that the visit is missing from
       * their payroll entirely, is a finding of its own and not this tile's
       * job; if the total ignored the claim it would disagree with the very
       * row somebody just typed it into.
       */
      if (claimed != null) {
        difference += claimed - (theirs ?? 0);
        priced += 1;
      }
    }

    return {
      theirParts,
      claimedParts,
      toYou,
      difference,
      priced,
      corrected: toYou + Math.round(difference / 2),
    };
  }, [rows, ticks]);

  async function save(jobNumber: string, next: Partial<Tick>) {
    const previous = ticks[jobNumber] ?? { checked: false, note: null, partsCostCents: null };
    const merged: Tick = { ...previous, ...next };
    setTicks((all) => ({ ...all, [jobNumber]: merged }));
    setBusy(jobNumber);
    setFailed(null);
    try {
      const response = await fetch('/api/admin/ihord/check', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jobNumber, ...merged }),
      });
      if (!response.ok) throw new Error('save failed');
    } catch {
      // Put it back. A tick that looks saved and is not is the one failure this
      // screen must never have — the whole point is a record you can trust.
      setTicks((all) => ({ ...all, [jobNumber]: previous }));
      setFailed(jobNumber);
    } finally {
      setBusy(null);
    }
  }

  /**
   * Everything on a row, flattened into one string to search.
   *
   * Every field, because there is no guessing which one somebody has in front
   * of them: a part number off a receipt, a customer's surname, an invoice
   * number from the dispatcher's page, a payment method, a word from a note
   * written three weeks ago. A search box that only covered the columns would
   * miss the part number, which is the single most likely thing to be typed
   * into it.
   *
   * Findings are indexed by their translated wording, so searching in the
   * language on screen works. Built once per row and kept, because it is
   * rebuilt on every keystroke otherwise.
   */
  const haystacks = useMemo(() => {
    const built = new Map<string, string>();
    for (const row of rows) {
      const tick = ticks[row.jobNumber];
      const card = row.card;
      built.set(
        row.jobNumber,
        [
          row.jobNumber,
          row.invoiceNumber,
          row.customer,
          row.date,
          row.settled,
          row.jpStatus,
          card?.paymentStatus,
          tick?.note,
          money(row.soldCents, t.lang),
          money(row.partsCents, t.lang),
          money(row.toYouCents, t.lang),
          card && money(card.totalCents, t.lang),
          card && money(card.paidCents, t.lang),
          tick?.partsCostCents != null && money(tick.partsCostCents, t.lang),
          ...row.flags.map((flag) => t(`ihord.flag.${flag}` as TranslationKey)),
          ...(card?.parts ?? []).map((part) => `${part.description} ${part.partNumber ?? ''}`),
          ...(card?.payments ?? []).map((payment) => `${payment.method} ${payment.notes ?? ''}`),
          ...(card?.documents ?? []).map((doc) => `${doc.type} ${doc.number}`),
          ...(card?.expenses ?? []).map(
            (expense) => `${expense.category} ${expense.description} ${expense.vendor ?? ''}`
          ),
          ...row.theirInvoices.flatMap((invoice) => [
            invoice.number,
            invoice.status,
            ...invoice.payments.map((payment) => payment.method),
          ]),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
      );
    }
    return built;
  }, [rows, ticks, t]);

  const visible = useMemo(() => {
    // Every word must appear, in any field. Two terms narrow rather than widen,
    // which is what somebody typing a name and an amount expects.
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

    const kept = rows.filter((row) => {
      const tick = ticks[row.jobNumber];
      if (filter === 'unchecked' && tick?.checked) return false;
      if (filter === 'flagged' && !row.flags.some((flag) => !NOTE_FLAGS.has(flag))) return false;
      if (filter === 'nothingBought' && !row.flags.includes('no_parts_no_expenses')) return false;

      if (terms.length > 0) {
        const haystack = haystacks.get(row.jobNumber) ?? '';
        if (!terms.every((term) => haystack.includes(term))) return false;
      }
      return true;
    });

    /**
     * Dateless rows sink to the bottom in both directions.
     *
     * A visit JobPocket carries that never reached their earnings has no date
     * from their side. Sorting it as an empty string would pile all of those at
     * one end and, going oldest-first, put them before every real row — which
     * is where nobody is looking for them.
     */
    return [...kept].sort((a, b) => {
      if (!a.date || !b.date) return (a.date ? 0 : 1) - (b.date ? 0 : 1);
      return sort === 'newest' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date);
    });
  }, [rows, ticks, filter, sort, query, haystacks]);

  /**
   * The same rows as a spreadsheet.
   *
   * Built in the browser from what is already on screen rather than fetched, so
   * the file and the page can never disagree. Parts are flattened into one cell
   * — a row per visit is what makes it sortable, and a reconciliation done in a
   * spreadsheet is done by visit.
   */
  function exportCsv() {
    const header = [
      'job', 'invoice', 'date', 'customer',
      'their_sold', 'their_parts', 'their_to_you', 'their_status',
      'our_total', 'our_collected', 'our_parts_cost', 'our_expenses',
      'claimed_parts_cost', 'claim_vs_theirs',
      'their_invoice', 'their_invoice_status', 'their_collected', 'their_balance', 'their_payments',
      'jp_status', 'documents', 'parts', 'findings', 'checked', 'note',
    ];
    const cell = (value: string | number | null | undefined) =>
      `"${String(value ?? '').replace(/"/g, '""')}"`;

    const lines = visible.map((row) => {
      const tick = ticks[row.jobNumber];
      const parts = (row.card?.parts ?? [])
        .map((part) => `${part.description} ${part.partNumber ?? ''} ×${part.quantity}`.trim())
        .join('; ');
      const documents = (row.card?.documents ?? [])
        .map((doc) => `${doc.type} ${doc.number}`)
        .join('; ');
      return [
        row.jobNumber, row.invoiceNumber, row.date, row.customer,
        row.soldCents != null ? row.soldCents / 100 : '',
        row.partsCents != null ? row.partsCents / 100 : '',
        row.toYouCents != null ? row.toYouCents / 100 : '',
        row.settled,
        row.card ? row.card.totalCents / 100 : '',
        row.card ? row.card.paidCents / 100 : '',
        row.card ? row.card.partsCostCents / 100 : '',
        row.card ? row.card.expensesCents / 100 : '',
        tick?.partsCostCents != null ? tick.partsCostCents / 100 : '',
        // The subtraction the whole claim turns on, done here so a spreadsheet
        // does not have to repeat it — and so a blank means "not claimed yet"
        // rather than "no difference".
        tick?.partsCostCents != null && row.partsCents != null
          ? (tick.partsCostCents - row.partsCents) / 100
          : '',
        row.theirInvoices.map((i) => i.number ?? '').join('; '),
        row.theirInvoices.map((i) => i.status ?? '').join('; '),
        row.theirInvoices.reduce((sum, i) => sum + (i.collectedCents ?? 0), 0) / 100,
        row.theirInvoices.reduce((sum, i) => sum + (i.balanceCents ?? 0), 0) / 100,
        row.theirInvoices
          .flatMap((i) => i.payments.map((p) => `${p.amountCents / 100} ${p.method} ${p.date ?? ''}`))
          .join('; '),
        row.jpStatus, documents, parts,
        row.flags.map((flag) => t(`ihord.flag.${flag}` as TranslationKey)).join('; '),
        tick?.checked ? 'yes' : 'no',
        tick?.note,
      ].map(cell).join(',');
    });

    const blob = new Blob([[header.join(','), ...lines].join('\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ihord-reconciliation-${period}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label={t('ihord.list.totalParts')}
          value={money(totals.claimedParts, t.lang)}
          hint={t('ihord.list.totalPartsHint', {
            theirs: money(totals.theirParts, t.lang),
          })}
        />
        <StatTile
          label={t('ihord.list.totalDifference')}
          value={money(totals.difference, t.lang)}
          hint={owedHint(t, totals.difference, totals.priced)}
        />
        <StatTile
          label={t('ihord.list.totalToYou')}
          value={money(totals.toYou, t.lang)}
          hint={t.plural(rows.length, 'ihord.visit')}
        />
        <StatTile
          label={t('ihord.list.totalResult')}
          value={money(totals.corrected, t.lang)}
          emphasis
          hint={t('ihord.list.totalResultHint')}
        />
      </div>

      <Panel
        title={t('ihord.list.title')}
        subtitle={t('ihord.list.progress', { done: checkedCount, total: rows.length })}
        action={
          <button
            type="button"
            onClick={exportCsv}
            className="h-8 shrink-0 rounded-card border border-primary-500/30 px-3 font-heading text-[10px] font-semibold uppercase tracking-label text-gray-600 hover:border-ink hover:text-ink"
          >
            {t('common.exportCsv')}
          </button>
        }
      >
        <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setFilter(option.key)}
            className={`rounded-card border px-3 py-1.5 font-heading text-[10px] font-semibold uppercase tracking-label transition-colors ${
              filter === option.key
                ? 'border-ink bg-ink text-cream'
                : 'border-primary-500/25 text-gray-600 hover:border-ink hover:text-ink'
            }`}
          >
            {t(option.label)}
          </button>
        ))}

        <span className="mx-1 h-4 w-px bg-primary-500/25" aria-hidden />

        {/* Which end of the window to start from. A full pass reads oldest
            first; a check on what just happened reads newest first. */}
        <button
          type="button"
          onClick={() => setSort(sort === 'newest' ? 'oldest' : 'newest')}
          className="inline-flex items-center gap-1.5 rounded-card border border-primary-500/25 px-3 py-1.5 font-heading text-[10px] font-semibold uppercase tracking-label text-gray-600 transition-colors hover:border-ink hover:text-ink"
        >
          <ArrowUpDown className="h-3 w-3" aria-hidden />
          {sort === 'newest' ? t('ihord.list.sortNewest') : t('ihord.list.sortOldest')}
        </button>

        {/* Searches every field on the row, not only the columns — a part
            number off a receipt is the likeliest thing to be typed here, and it
            is not on screen at all until a row is opened. */}
        <label className="ml-auto flex items-center gap-2">
          <Search className="h-3.5 w-3.5 text-gray-400" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('ihord.list.searchPlaceholder')}
            className="h-8 w-56 rounded-card border border-primary-500/25 bg-white px-3 text-xs text-ink placeholder:text-gray-400 focus:border-ink focus:outline-none"
          />
        </label>
      </div>

      {query.trim() !== '' && (
        <p className="mb-3 text-xs text-gray-500">
          {t('ihord.list.searchFound', { shown: visible.length, total: rows.length })}
        </p>
      )}

      {cardsUnavailable > 0 && (
        <Warning>{t('ihord.list.cardsUnavailable', { n: cardsUnavailable })}</Warning>
      )}

      {visible.length === 0 ? (
        <Empty>{t('ihord.list.empty')}</Empty>
      ) : (
        <Table className="min-w-[900px]">
          <thead>
            <tr>
              <Th />
              <Th>{t('common.date')}</Th>
              <Th>{t('common.job')}</Th>
              <Th>{t('common.client')}</Th>
              <Th numeric>{t('ihord.sold')}</Th>
              <Th numeric>{t('ihord.parts')}</Th>
              <Th numeric>{t('ihord.toYou')}</Th>
              <Th numeric>{t('ihord.list.collected')}</Th>
              <Th>{t('common.status')}</Th>
              <Th>{t('ihord.list.findings')}</Th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => {
              const tick = ticks[row.jobNumber] ?? { checked: false, note: null };
              const expanded = open === row.jobNumber;
              const card = row.card;

              return [
                <tr key={row.jobNumber} className={tick.checked ? 'opacity-55' : undefined}>
                  <Td>
                    <div className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={tick.checked}
                        disabled={busy === row.jobNumber}
                        onChange={(event) =>
                          save(row.jobNumber, { checked: event.target.checked })
                        }
                        aria-label={row.jobNumber}
                        className="h-4 w-4 cursor-pointer accent-[#0ca30c]"
                      />
                      <button
                        type="button"
                        onClick={() => setOpen(expanded ? null : row.jobNumber)}
                        className="text-gray-400 hover:text-ink"
                        aria-expanded={expanded}
                        aria-label={row.jobNumber}
                      >
                        {expanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </Td>
                  <Td className="whitespace-nowrap text-gray-600">
                    {row.date ? shortDate(new Date(row.date), t.lang) : '—'}
                  </Td>
                  <Td className="whitespace-nowrap">
                    <span className="font-medium">{row.jobNumber}</span>
                    {row.invoiceNumber && (
                      <span className="ml-2 text-[11px] text-gray-500">{row.invoiceNumber}</span>
                    )}
                    <span className="ml-2 inline-flex items-center gap-1.5 align-middle">
                      <Camera
                        className={`h-3.5 w-3.5 ${row.photos ? 'text-ink' : 'text-primary-500/25'}`}
                        aria-label={row.photos ? t('ihord.hasPhotos', { n: row.photos }) : t('ihord.noPhotos')}
                      />
                      <ScanLine
                        className={`h-3.5 w-3.5 ${row.scans ? 'text-ink' : 'text-primary-500/25'}`}
                        aria-label={row.scans ? t('ihord.hasScan', { n: row.scans }) : t('ihord.noScan')}
                      />
                    </span>
                  </Td>
                  <Td className="max-w-[220px] truncate">{row.customer || '—'}</Td>
                  <Td numeric>{money(row.soldCents, t.lang)}</Td>
                  <Td numeric className="text-gray-600">
                    {money(row.partsCents, t.lang)}
                    {card && card.partsCostCents !== (row.partsCents ?? 0) && (
                      <span className="ml-1 text-[11px] text-gray-400">
                        / {money(card.partsCostCents, t.lang)}
                      </span>
                    )}
                    {/* What is actually being claimed, when it has been said —
                        the figure the other two are only evidence for. */}
                    {tick.partsCostCents != null && (
                      <span className="block text-[11px] font-semibold text-ink">
                        {t('ihord.list.claimed')} {money(tick.partsCostCents, t.lang)}
                      </span>
                    )}
                  </Td>
                  <Td numeric className="font-medium">{money(row.toYouCents, t.lang)}</Td>
                  <Td numeric className="text-gray-600">
                    {card ? money(card.paidCents, t.lang) : '—'}
                  </Td>
                  <Td className="whitespace-nowrap">
                    <SettledPill settled={row.settled} />
                    {row.jpStatus && (
                      <span className="ml-2 text-[10px] uppercase tracking-label text-gray-500">
                        {row.jpStatus}
                      </span>
                    )}
                  </Td>
                  <Td>
                    <span className="flex flex-wrap gap-1">
                      {row.flags.map((flag) => (
                        <FlagChip key={flag} flag={flag} />
                      ))}
                      {failed === row.jobNumber && (
                        <span className="text-[10px]" style={{ color: STATUS.critical }}>
                          {t('ihord.list.saveFailed')}
                        </span>
                      )}
                    </span>
                  </Td>
                </tr>,

                expanded ? (
                  <tr key={`${row.jobNumber}-detail`}>
                    <td colSpan={10} className="border-b border-primary-500/10 bg-[#f7f6f2] p-4">
                      {/* Their invoice first when our books hold nothing: on
                          those rows it is the only record of what the visit was
                          worth and whether anybody paid for it. */}
                      {row.theirInvoices.length > 0 && (
                        <TheirInvoices invoices={row.theirInvoices} />
                      )}

                      {/* Said before the columns, not instead of them. A visit
                          JobPocket never carried is still reconciled against
                          their software line by line — it just has nothing on
                          our side to compare, which is a zero, not a blank. */}
                      {!row.jpJobId ? (
                        <p className="mb-3 text-xs text-gray-500">{t('ihord.list.noCard')}</p>
                      ) : !card ? (
                        <p className="mb-3 text-xs text-gray-500">
                          {t('ihord.list.cardUnavailable')}
                        </p>
                      ) : null}

                      <div className="flex flex-wrap gap-6">
                          <Section title={t('ihord.list.partsTitle')}>
                            {card && card.parts.length > 0 ? (
                              <ul className="mt-1 space-y-1 text-xs">
                                {card.parts.map((part, index) => (
                                  <li key={`${part.partNumber}-${index}`} className="leading-snug">
                                    <span className="text-ink">{part.description}</span>
                                    <span className="ml-1.5 text-gray-500">
                                      {part.partNumber ?? t('ihord.list.noPartNumber')} · ×
                                      {part.quantity}
                                    </span>
                                    <span className="ml-1.5 tabular-nums text-gray-600">
                                      {t('ihord.list.cost')} {money(part.costCents, t.lang)} ·{' '}
                                      {t('ihord.list.charged')} {money(part.chargedCents, t.lang)}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="mt-1 text-xs text-gray-400">
                                {card ? t('ihord.list.partsNone') : t('ihord.list.partsNoCard')}
                              </p>
                            )}
                            <PartsClaim
                              row={row}
                              tick={tick}
                              onSave={(partsCostCents) =>
                                save(row.jobNumber, { partsCostCents })
                              }
                            />
                          </Section>

                          {card && (<>
                          <Section
                            title={t('ihord.list.paymentsTitle')}
                            empty={t('ihord.list.paymentsNone')}
                          >
                            {card.payments.length > 0 ? (
                              <ul className="mt-1 space-y-1 text-xs">
                                {card.payments.map((payment, index) => (
                                  <li key={index} className="leading-snug">
                                    <span className="tabular-nums text-ink">
                                      {money(payment.amountCents, t.lang)}
                                    </span>
                                    <span className="ml-1.5 text-gray-500">
                                      {payment.method.toLowerCase().replace(/_/g, ' ')}
                                      {payment.isDeposit ? ` · ${t('ihord.list.deposit')}` : ''}
                                      {payment.paidAt
                                        ? ` · ${shortDate(new Date(payment.paidAt), t.lang)}`
                                        : ''}
                                    </span>
                                    {payment.notes && (
                                      <span className="ml-1.5 text-gray-400">{payment.notes}</span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            ) : undefined}
                          </Section>

                          <Section
                            title={t('ihord.list.documentsTitle')}
                            empty={t('ihord.list.documentsNone')}
                          >
                            {card.documents.length > 0 ? (
                              <ul className="mt-1 space-y-1 text-xs">
                                {card.documents.map((doc) => (
                                  <li key={doc.number} className="leading-snug">
                                    <span className="text-ink">
                                      {doc.number || doc.type}
                                    </span>
                                    <span className="ml-1.5 tabular-nums text-gray-600">
                                      {money(doc.totalCents, t.lang)}
                                    </span>
                                    <span className="ml-1.5 text-gray-500">
                                      {[
                                        doc.voidedAt ? t('ihord.list.docVoided') : null,
                                        doc.signedAt ? t('ihord.list.docSigned') : null,
                                        doc.paidAt ? t('ihord.list.docPaid') : null,
                                        doc.sentAt ? t('ihord.list.docSent') : null,
                                      ]
                                        .filter(Boolean)
                                        .join(' · ')}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            ) : undefined}
                          </Section>

                          <Section
                            title={t('ihord.list.expensesTitle')}
                            empty={t('ihord.list.expensesNone')}
                          >
                            {card.expenses.length > 0 ? (
                              <ul className="mt-1 space-y-1 text-xs">
                                {card.expenses.map((expense, index) => (
                                  <li key={index} className="leading-snug">
                                    <span className="tabular-nums text-ink">
                                      {money(expense.amountCents, t.lang)}
                                    </span>
                                    <span className="ml-1.5 text-gray-500">
                                      {expense.description || expense.category}
                                      {expense.vendor ? ` · ${expense.vendor}` : ''} ·{' '}
                                      {expense.hasReceipt
                                        ? t('ihord.list.receipt')
                                        : t('ihord.list.noReceipt')}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            ) : undefined}
                          </Section>
                          </>)}
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-primary-500/15 pt-3">
                        <input
                          type="text"
                          defaultValue={tick.note ?? ''}
                          placeholder={t('ihord.list.notePlaceholder')}
                          onBlur={(event) => {
                            const note = event.target.value.trim() || null;
                            if (note !== (tick.note ?? null)) save(row.jobNumber, { note });
                          }}
                          className="h-8 min-w-[240px] flex-1 rounded-card border border-primary-500/25 bg-white px-3 text-xs text-ink placeholder:text-gray-400 focus:border-ink focus:outline-none"
                        />
                        {row.jpJobId && (
                          <a
                            href={`/admin/calendar/${row.jpJobId}`}
                            className="font-heading text-[10px] font-semibold uppercase tracking-label text-gray-600 underline decoration-primary-500/40 underline-offset-2 hover:text-ink"
                          >
                            {t('ihord.list.openInApp')}
                          </a>
                        )}
                        {busy === row.jobNumber && (
                          <span className="text-[11px] text-gray-500">{t('ihord.list.saving')}</span>
                        )}
                        {row.checkedAt && tick.checked && (
                          <span className="text-[11px] text-gray-400">
                            {t('ihord.list.checkedAt', {
                              date: shortDate(new Date(row.checkedAt), t.lang),
                            })}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : null,
              ];
            })}
          </tbody>
        </Table>
      )}

        <Hint>{t('ihord.list.hint')}</Hint>
      </Panel>
    </div>
  );
}
