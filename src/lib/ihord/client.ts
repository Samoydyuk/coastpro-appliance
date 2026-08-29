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
/** Scraping two sites is slow; the service caches, but the first call is not. */
const TIMEOUT_MS = 60_000;

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
}

export interface Reconciliation {
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
  };
  jobs: ReconciledJob[];
}

export async function getReconciliation(period = 'all'): Promise<Reconciliation> {
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
