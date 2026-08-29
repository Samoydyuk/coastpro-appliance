import { operationsConfig, OperationsApiError } from '@/lib/bookings/client';

/**
 * Reading the books out of JobPocket.
 *
 * Every figure here is worked out on JobPocket's side, by the same code the
 * phone uses. The console adds up nothing: the moment it does, there are two
 * definitions of revenue in the business and no way to tell which screen is
 * lying. Money arrives as whole cents and is formatted, never recalculated.
 *
 * Shares the operations key with the booking screens — it is one console acting
 * for one owner — but lives apart because it is a different subject and the
 * responses carry cost figures the booking inbox has no business seeing.
 */

const REQUEST_TIMEOUT_MS = 15_000;

async function call<T>(path: string): Promise<T> {
  const config = await operationsConfig();
  if (!config) {
    throw new OperationsApiError(
      'No JobPocket key yet. Paste one in Settings before reading the books.',
      0,
      'not_configured'
    );
  }

  let response: Response;
  try {
    response = await fetch(`${config.baseUrl}${path}`, {
      headers: { Authorization: `Bearer ${config.apiKey}` },
      cache: 'no-store',
      // Longer than the booking calls: a profit figure walks every job in the
      // window with its line items, and eight seconds is not always enough.
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
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

function window(from: Date, to: Date): string {
  return `from=${from.toISOString()}&to=${to.toISOString()}`;
}

export interface Period {
  from: string;
  to: string;
  days: number;
  label: string;
  timezone: string;
}

export interface Scope {
  companies: Array<{ id: string; name: string }>;
  ownBusiness: string;
}

/** The spend of a period, top to bottom. Every figure in whole cents. */
export interface Waterfall {
  billedCents: number;
  netRevenueCents: number;
  partsCostCents: number;
  recordedExpensesCents: number;
  fuelFromMileageCents: number;
  writtenOffCents: number;
  overheadCents: number;
  ownerPayCents: number;
  netProfitCents: number;
}

export interface ProfitReport {
  period: Period;
  scope: Scope;
  waterfall: Waterfall;
  netMarginPct: number;
  targetMarginPct: number;
  jobs: number;
  avgTicketCents: number;
  costPerJobCents: number;
  breakEvenRevenueCents: number;
  breakEvenTicketCents: number;
  /** What the business made, before anything is drawn out of it. */
  businessEarningsCents: number;
  /** What it must take to cover the standing costs, the draw aside. */
  breakEvenBeforeOwnerPayCents: number;
  /** One sentence, written by JobPocket, about what the numbers mean. */
  verdict: string;
  dataQuality: {
    missingCategories: string[];
    unsplitCompanies: Array<{ name: string; billedCents: number }>;
    duplicatedPartExpensesCents: number;
    vehicleDoubleClaim: { note?: string } | null;
  };
  previous: {
    period: { from: string; to: string };
    waterfall: Waterfall;
    businessEarningsCents: number;
    netMarginPct: number;
    jobs: number;
  } | null;
}

export async function getProfit(from: Date, to: Date): Promise<ProfitReport> {
  return call(`/v1/reports/profit?${window(from, to)}`);
}

export interface CompanyRow {
  brandId: string | null;
  name: string;
  revenueSharePct: number | null;
  reimbursesParts: boolean;
  jobs: number;
  billedCents: number;
  ownShareCents: number;
  /** What survives of the ticket — not the headline percentage, which ignores
   *  reimbursed parts. */
  keptPct: number | null;
}

export async function getByCompany(
  from: Date,
  to: Date
): Promise<{ period: Period; scope: Scope; companies: CompanyRow[] }> {
  return call(`/v1/reports/by-company?${window(from, to)}`);
}

export interface UnpaidJob {
  id: string;
  jobNumber: string | null;
  clientName: string | null;
  brandName: string;
  totalCents: number;
  ownShareCents: number;
  paymentStatus: string;
  completedAt: string | null;
  daysOwed: number;
}

export interface UnpaidReport {
  asOf: string;
  chaseAfterDays: number;
  scope: Scope;
  outstanding: { totalCents: number; ownShareCents: number; jobs: number };
  overdue: { totalCents: number; ownShareCents: number; jobs: number };
  aging: Record<'current' | 'days30' | 'days60' | 'days90', { cents: number; jobs: number }>;
  jobs: UnpaidJob[];
  bucket: string | null;
  offset: number;
  total: number;
  hasMore: boolean;
}

/**
 * No window: a debt does not stop existing because a report was narrowed.
 *
 * `bucket` opens one band of the ageing chart. The totals stay whole whichever
 * band is open — narrowing the list must not quietly narrow the debt.
 */
export async function getUnpaid(
  options: { bucket?: string; offset?: number } = {}
): Promise<UnpaidReport> {
  const query = new URLSearchParams();
  if (options.bucket) query.set('bucket', options.bucket);
  if (options.offset) query.set('offset', String(options.offset));
  const suffix = query.toString();
  return call(`/v1/reports/unpaid${suffix ? `?${suffix}` : ''}`);
}

export interface TechnicianRow {
  techId: string | null;
  name: string;
  jobs: number;
  ownShareRevenueCents: number;
  avgTicketCents: number;
  avgEstimatedMinutes: number;
}

export async function getByTechnician(
  from: Date,
  to: Date
): Promise<{ period: Period; scope: Scope; creditRule: string; technicians: TechnicianRow[] }> {
  return call(`/v1/reports/by-technician?${window(from, to)}`);
}

export interface PaymentRow {
  id: string;
  jobId: string;
  jobNumber: string | null;
  clientName: string | null;
  amountCents: number;
  jobTotalCents: number;
  status: string;
  method: string;
  isDeposit: boolean;
  paidAt: string | null;
  createdAt: string;
}

export interface PaymentsReport {
  period: Period;
  scope: Scope;
  totals: {
    succeededCents: number;
    succeededCount: number;
    byMethod: Array<{ method: string; cents: number; count: number }>;
    /** Named rather than dropped, so a partly refunded payment cannot quietly
     *  vanish out of the total. */
    excluded: {
      voidedCents: number; voidedCount: number;
      refundedCents: number; refundedCount: number;
      partiallyRefundedCents: number; partiallyRefundedCount: number;
      pendingCents: number; pendingCount: number;
    };
  };
  payments: PaymentRow[];
  method: string | null;
  offset: number;
  total: number;
  hasMore: boolean;
}

export async function getPayments(
  from: Date,
  to: Date,
  options: { method?: string; offset?: number } = {}
): Promise<PaymentsReport> {
  const extra =
    (options.method ? `&method=${encodeURIComponent(options.method)}` : '') +
    (options.offset ? `&offset=${options.offset}` : '');
  return call(`/v1/reports/payments?${window(from, to)}${extra}`);
}

export interface TrendPoint {
  /** `2026-08` or `2026-08-12`, depending on the granularity asked for. */
  bucket: string;
  billedCents: number;
  netRevenueCents: number;
  jobs: number;
}

/**
 * Billed and kept over time — and no profit line, on purpose.
 *
 * Fixed costs are spread across the whole window, so a per-bucket profit would
 * not add up to the one in the table beside it.
 */
export async function getTrend(
  from: Date,
  to: Date,
  granularity: 'day' | 'month'
): Promise<{ period: Period; granularity: string; points: TrendPoint[] }> {
  return call(`/v1/reports/trend?${window(from, to)}&granularity=${granularity}`);
}

export interface StuckJob {
  id: string;
  jobNumber: string | null;
  status: string;
  paymentStatus: string;
  type: string | null;
  clientName: string | null;
  brandName: string;
  totalCents: number;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface StuckGroup {
  key: string;
  title: string;
  /** Why this is worth doing something about, in JobPocket's own words. */
  why: string;
  noun: string;
  jobs: number;
  valueCents: number;
  rows: StuckJob[];
}

/**
 * Work that has stopped moving.
 *
 * The categories come from JobPocket's checks catalogue, not from this console
 * — the same list the phone watches, so the two cannot disagree about what
 * counts as unscanned or never invoiced.
 */
export async function getStuck(): Promise<{ asOf: string; scope: Scope; groups: StuckGroup[] }> {
  return call('/v1/reports/stuck');
}

export interface DrilldownJob extends StuckJob {
  ownShareCents: number;
}

/** Whatever a report row was made of. */
export async function getJobs(
  from: Date,
  to: Date,
  filters: {
    brandId?: string;
    techId?: string;
    status?: string;
    paymentStatus?: string;
    offset?: number;
  } = {}
): Promise<{
  period: Period;
  scope: Scope;
  filters: Record<string, string | null>;
  totals: { jobs: number; billedCents: number; ownShareCents: number };
  jobs: DrilldownJob[];
  offset: number;
  hasMore: boolean;
}> {
  const extra = Object.entries(filters)
    .filter(([, value]) => value)
    .map(([key, value]) => `&${key}=${encodeURIComponent(String(value))}`)
    .join('');
  return call(`/v1/reports/jobs?${window(from, to)}${extra}`);
}
