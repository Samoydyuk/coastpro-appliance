import { operationsConfig, OperationsApiError } from '@/lib/bookings/client';
import type { Period, Scope } from '@/lib/money/client';

/**
 * The payback of every channel, ordinary and marketplace alike.
 *
 * The question could not be answered before, and the reason was structural
 * rather than arithmetic. Spend for ads lives in this console's own `ad_spend`
 * — typed on `/admin/spend` or pulled by the Google Ads importer — and joins
 * against the `leads` table, which is visitors, sessions and click ids. Spend
 * for marketplaces lives in JobPocket as a `LeadCharge` hanging off a lead that
 * never touched this website. A Thumbtack lead has no session, so putting it in
 * `leads` would poison every conversion figure on the channels page; an ad has
 * no per-lead charge, so it cannot become one. Neither store could answer.
 *
 * The decision, and it is settled: **JobPocket becomes the one place payback is
 * computed; the console stays where spend is entered.** Source of truth does
 * not move. `lib/jobpocket.ts` mirrors `ad_spend` upward as `PERIOD_TOTAL`
 * charges, and this file reads the joined table back.
 *
 * Same bargain as `lib/money/client.ts`: JobPocket computes, the console draws.
 * Money arrives as whole cents and is formatted, never recalculated. The write
 * below does not break that bargain — it hands JobPocket a figure the console
 * already holds, and every derived number still comes back from JobPocket.
 *
 * Its own file rather than a section of `money/client.ts` for the same reason
 * `marketplace/client.ts` is its own file: that one is about profit and reads
 * only, this one is about advertising and writes. The request helper is four
 * lines of fetch either way, and sharing it would mean exporting a private
 * function out of a module about profit so a module about spend could set a
 * different timeout on it.
 */

/** A page render is waiting: this report walks the window's jobs. */
const READ_TIMEOUT_MS = 15_000;
/**
 * Longer, because nobody is waiting. The mirror upserts its entries one at a
 * time on JobPocket's side — deliberately, since a batch fired concurrently at
 * one unique key is how a sync deadlocks — and it runs in a nightly cron whose
 * whole function has sixty seconds.
 */
const WRITE_TIMEOUT_MS = 25_000;

async function call<T>(path: string, init?: RequestInit, timeoutMs = READ_TIMEOUT_MS): Promise<T> {
  const config = await operationsConfig();
  if (!config) {
    throw new OperationsApiError(
      'No JobPocket key yet. Paste one in Settings before reading channel payback.',
      0,
      'not_configured'
    );
  }

  let response: Response;
  try {
    response = await fetch(`${config.baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      // Next patches fetch and caches it by default. A payback figure one
      // deploy stale is worse than no payback figure.
      cache: 'no-store',
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new OperationsApiError(`Could not reach JobPocket: ${message}`, 0, 'unreachable');
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new OperationsApiError(
      body?.error ?? `JobPocket answered ${response.status}.`,
      response.status,
      response.status === 401 || response.status === 403 ? 'rejected' : 'unreachable'
    );
  }

  return (await response.json()) as T;
}

// ---------------------------------------------------------------------------
// Reading the table
// ---------------------------------------------------------------------------

/**
 * How far a spend figure can be trusted, in JobPocket's own vocabulary.
 *
 * Its schema calls `API` and `STATEMENT` facts, `ALLOCATED` an estimate,
 * `DEFAULT` a guess and `MANUAL` typed in. All five keys are always present and
 * they sum to what the channel was billed — so a page that shows one spend
 * column can still say what kind of number it is.
 */
export type SpendOrigin = 'API' | 'STATEMENT' | 'ALLOCATED' | 'DEFAULT' | 'MANUAL';

export interface ChannelLeadCounts {
  received: number;
  /** Somebody answered. On a marketplace the first responder takes the job. */
  replied: number;
  /** Read off `convertedAt`, never off the status — cancelling a job rewrites
   *  an accepted lead to CANCELLED and would erase a conversion that happened. */
  converted: number;
  open: number;
  /** Wanted and lost to somebody faster. Not the same as turning one down. */
  lost: number;
  unanswered: number;
  declined: number;
}

export interface ChannelJobCounts {
  count: number;
  billedCents: number;
  invoicedCents: number;
  paidCents: number;
}

/**
 * One line of the payback table.
 *
 * Every derived figure is null wherever its input is unknown, and null is not
 * zero anywhere here. A channel whose invoice nobody has entered has an
 * *unknown* cost per lead, not a free one, and `$0.00 / lead` is a confident
 * statement of something wrong by however much was never typed in. `spendRows`
 * is what tells "nothing billed" from "nothing entered", which is why JobPocket
 * publishes it rather than keeping it inside its own arithmetic.
 */
export interface PaybackRow {
  /** Null on the unattributed row, which is not a channel and has no id. */
  id: string | null;
  name: string | null;
  leads: ChannelLeadCounts;
  jobs: ChannelJobCounts;
  spendCents: number | null;
  spendRows: number;
  /** Still provisional: inside a marketplace's refund window. */
  spendPendingCents: number;
  refundedCents: number;
  /** A split of what was billed, before refunds — so it need not equal `spendCents`. */
  spendByOrigin: Record<SpendOrigin, number>;
  costPerLeadCents: number | null;
  costPerJobCents: number | null;
  /** Collected less spent. */
  paybackCents: number | null;
  /** Collected per dollar spent. Null when nothing was spent, because revenue
   *  over zero is not an infinite return but a figure with no denominator. */
  paybackRatio: number | null;
}

export interface ChannelPaybackRow extends PaybackRow {
  id: string;
  name: string;
  /** The machine key — `google_ads`, `thumbtack`. This console's join handle. */
  kind: string | null;
  isPaid: boolean;
  isActive: boolean;
  /** What a lead's source is compared against to file it here. Also a join handle. */
  sourceMatch: string[];
}

export interface ChannelPaybackReport {
  period: Period;
  scope: Scope;
  channels: ChannelPaybackRow[];
  /**
   * Work that carries no channel at all, and it will be most of it: a
   * dispatcher's job, a call to the shop's own number, a customer who already
   * had it. Beside the list rather than in it, because sorting it into a table
   * of channels would be reading it as one — and dropping it would leave a page
   * implying the paid channels are the whole business.
   */
  unattributed: PaybackRow;
  /** Channels **and** the unattributed row, which is what lets the page say how
   *  much of the window the table above actually explains. */
  totals: {
    leads: number;
    converted: number;
    jobs: number;
    billedCents: number;
    invoicedCents: number;
    paidCents: number;
    spendCents: number;
    spendRows: number;
    channelsWithoutSpend: number;
  };
}

export async function getChannelPayback(from: Date, to: Date): Promise<ChannelPaybackReport> {
  return call(
    `/v1/reports/channels?from=${from.toISOString()}&to=${to.toISOString()}`
  );
}

// ---------------------------------------------------------------------------
// Pushing the spend
// ---------------------------------------------------------------------------

/**
 * One statement line: what a channel cost over a stretch of time.
 *
 * JobPocket keys on the channel and the two dates and nothing else, so sending
 * the same month again corrects it rather than adding a second row. That is the
 * whole contract, and it is what makes a nightly mirror safe.
 */
export interface SpendEntry {
  /** The console's slug — `google_ads`, `google_lsa`. Matched literally against
   *  the JobPocket channel's `sourceMatch`, so it must be the slug and not a label. */
  channel: string;
  /** What to call the channel **if JobPocket has to create it**. An existing
   *  channel the owner has renamed keeps its name; a nightly sync is not a
   *  reason to undo somebody's edit. */
  label?: string;
  /**
   * The period's ends. A bare `YYYY-MM-DD` is accepted and reads as midnight
   * UTC — which is the trap, not the convenience: see `mirrorAdSpend` for why
   * this console sends midday instead.
   */
  periodStart: string;
  periodEnd: string;
  /** Zero is legitimate and deletes: see `SpendResult.deleted`. */
  amountCents: number;
  /** `STATEMENT` when an importer read it off the platform, `MANUAL` when
   *  somebody typed it. JobPocket refuses `API` here — that word means the
   *  marketplace itself told us, and an ad platform's figure relayed through
   *  two systems is not that however automatic the relay. */
  origin: 'STATEMENT' | 'MANUAL';
}

export interface SpendResult {
  entries: number;
  written: number;
  /**
   * A month sent as zero is removed rather than stored as a nought. JobPocket
   * reads no charge row as *unknown* and a zero row as *free*, and only one of
   * those is true of a month somebody has just emptied on `/admin/spend`.
   */
  deleted: number;
  totalCents: number;
}

/**
 * A page of statement lines, matching JobPocket's own cap.
 *
 * Chunked rather than trusted to stay under it. JobPocket validates every entry
 * before writing any, so one request is all-or-nothing; across chunks it is
 * not, but the mirror re-sends the whole window every night, so a chunk that
 * failed is corrected within a day rather than left as a gap nobody sees.
 */
const MAX_ENTRIES = 200;

export async function pushChannelSpend(entries: SpendEntry[]): Promise<SpendResult> {
  const result: SpendResult = { entries: entries.length, written: 0, deleted: 0, totalCents: 0 };

  for (let at = 0; at < entries.length; at += MAX_ENTRIES) {
    const page = await call<{
      ok: true;
      written: number;
      deleted: number;
      totalCents: number;
    }>(
      '/v1/reports/channels/spend',
      { method: 'PUT', body: JSON.stringify({ entries: entries.slice(at, at + MAX_ENTRIES) }) },
      WRITE_TIMEOUT_MS
    );

    result.written += page.written;
    result.deleted += page.deleted;
    result.totalCents += page.totalCents;
  }

  return result;
}
