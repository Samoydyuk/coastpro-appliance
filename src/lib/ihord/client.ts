import { OperationsApiError } from '@/lib/bookings/client';

/**
 * Asking the sync service what the dispatcher's books say.
 *
 * Not JobPocket: the ihord login lives in `integrations/ihord-sync` and nowhere
 * else, and this console has no business holding it. The service reads both
 * sets of books and answers; nothing here scrapes anything.
 *
 * Its own key, separate from the JobPocket one, so losing either does not give
 * away the other — the standing rule that integrations stay separate plugins.
 */

const DEFAULT_BASE = 'https://jobpocket-ihord-sync-production.up.railway.app';
/**
 * Short on purpose.
 *
 * The service never scrapes while we wait — it answers with what it has and
 * refreshes behind. So this only has to cover a JSON read, and a long timeout
 * here would just be a slower way to hit the serverless limit and die.
 */
const TIMEOUT_MS = 10_000;

/** One line on the visit that was a part rather than labour. */
export interface WorklistPart {
  description: string;
  partNumber: string | null;
  quantity: number;
  /** What it cost to buy — the figure the dispatcher reimburses in full. */
  costCents: number | null;
  /** What the customer was charged for it. */
  chargedCents: number;
}

export interface WorklistPayment {
  amountCents: number;
  method: string;
  paidAt: string | null;
  notes: string | null;
  isDeposit: boolean;
}

export interface WorklistDocument {
  type: string;
  number: string;
  totalCents: number;
  sentAt: string | null;
  signedAt: string | null;
  paidAt: string | null;
  voidedAt: string | null;
}

export interface WorklistExpense {
  category: string;
  description: string;
  amountCents: number;
  vendor: string | null;
  hasReceipt: boolean;
}

/** Everything JobPocket holds about one visit. Null when it has no copy. */
export interface JobCard {
  paymentStatus: string | null;
  totalCents: number;
  parts: WorklistPart[];
  partsCostCents: number;
  partsChargedCents: number;
  /** Parts with no purchase price recorded — they cannot be claimed for. */
  partsWithoutCost: number;
  payments: WorklistPayment[];
  paidCents: number;
  documents: WorklistDocument[];
  expenses: WorklistExpense[];
  expensesCents: number;
}

/**
 * The named things that can be wrong with a row.
 *
 * Names, not sentences: the service ships the finding and this console supplies
 * the wording, so the same report reads in either language.
 */
export type WorklistFlag =
  | 'missing_in_jobpocket'
  | 'missing_in_ihord'
  | 'not_settled'
  | 'parts_missing_here'
  | 'parts_missing_there'
  | 'parts_differ'
  | 'parts_without_cost'
  | 'no_parts_no_expenses'
  | 'no_invoice'
  | 'not_collected'
  | 'total_differs'
  | 'their_invoice_open';

/**
 * One of the dispatcher's own invoices, read off their page.
 *
 * The only place the money lives for work JobPocket never priced — a job that
 * predates the sync, or one invoiced on their side and left at zero on ours.
 */
export interface IhordInvoice {
  cuid: string;
  number: string | null;
  /** Their word: Draft, Sent, Paid. Draft means it never went to the customer. */
  status: string | null;
  date: string | null;
  totalCents: number | null;
  collectedCents: number | null;
  balanceCents: number | null;
  payments: Array<{ amountCents: number; method: string; date: string | null }>;
}

export interface ReconciledJob {
  jobNumber: string;
  invoiceNumber: string | null;
  customer: string;
  date: string | null;
  soldCents: number | null;
  partsCents: number | null;
  toYouCents: number | null;
  /** The dispatcher's own word for whether this one is settled. */
  settled: 'Pending' | 'Reconciled' | 'Paid' | null;
  jpJobId: string | null;
  jpStatus: string | null;
  issue: 'missing_in_jobpocket' | 'missing_in_ihord' | 'not_settled' | null;
  /** Optional: the service and this console deploy separately. */
  card?: JobCard | null;
  flags?: WorklistFlag[];
  /** The id their URLs use, for a link straight to the visit on their side. */
  ihordJobId?: string | null;
  /** Read only where one book is short of money. Empty otherwise. */
  theirInvoices?: IhordInvoice[];
}

export interface Reconciliation {
  /** True while the first scrape for this window is still running. */
  building?: boolean;
  /** How old the figures are, in seconds. Null when nothing is held yet. */
  ageSec?: number | null;
  builtAt: string;
  period: string;
  label: string | null;
  money: {
    earnedCents: number | null;
    reconciledCents: number | null;
    pendingCents: number | null;
    balanceOwedCents: number | null;
    paidSoFarCents: number | null;
    unpaidCents: number | null;
  };
  payouts: Array<{ date: string | null; amountCents: number | null; method: string }>;
  counts: {
    ihordJobs: number;
    jobPocketJobs: number;
    missingInJobPocket: number;
    missingInIhord: number;
    notSettled: number;
    /** What the page claimed against what was parsed — a silent shortfall shows here. */
    rowsClaimed: number;
    rowsParsed: number;
    /** Rows carrying at least one finding. Optional until the service ships it. */
    flagged?: number;
    /** Visits whose JobPocket side could not be read, so their row is thinner. */
    cardsUnavailable?: number;
  };
  jobs: ReconciledJob[];
}

/** What the service holds right now — never a wait for a scrape. */
export async function getReconciliation(
  period = 'all'
): Promise<Reconciliation | { building: true; ageSec: null }> {
  const key = process.env.IHORD_RECONCILIATION_KEY;
  if (!key) {
    throw new OperationsApiError(
      'No key for the sync service yet. Set IHORD_RECONCILIATION_KEY.',
      0,
      'not_configured'
    );
  }

  const base = process.env.IHORD_SYNC_BASE || DEFAULT_BASE;
  let response: Response;
  try {
    response = await fetch(`${base}/reconciliation?period=${encodeURIComponent(period)}`, {
      headers: { Authorization: `Bearer ${key}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new OperationsApiError(`Could not reach the sync service: ${message}`, 0, 'unreachable');
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new OperationsApiError(
      body?.error ?? `The sync service answered ${response.status}.`,
      response.status,
      response.status === 401 || response.status === 403 ? 'rejected' : 'unreachable'
    );
  }

  return (await response.json()) as Reconciliation;
}
