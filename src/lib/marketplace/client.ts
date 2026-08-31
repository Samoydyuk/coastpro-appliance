import { operationsConfig, OperationsApiError } from '@/lib/bookings/client';

/**
 * Reading the paid marketplaces out of JobPocket.
 *
 * A Thumbtack lead never touches this website. It has no visitor, no session
 * and no click id, so it cannot go in the console's own `leads` table and
 * `thumbtack` is deliberately absent from `CHANNELS` — a channel row that could
 * only ever read zero would sit on the channels page contradicting this one.
 * The lead lands in JobPocket as a booking request, its price lands in
 * JobPocket's lead ledger, and the console asks JobPocket what both add up to.
 *
 * Same bargain as `lib/money/client.ts`: JobPocket computes, the console draws.
 * Money arrives as whole cents and is formatted, never recalculated.
 *
 * The request helper below is this file's own rather than borrowed from the
 * money client. It is four lines of fetch either way, and sharing it would mean
 * exporting a private function out of a module about profit so that a module
 * about advertising could set a different timeout on it.
 */

const REQUEST_TIMEOUT_MS = 10_000;

async function call<T>(path: string): Promise<T> {
  const config = await operationsConfig();
  if (!config) {
    throw new OperationsApiError(
      'No JobPocket key yet. Paste one in Settings before reading the marketplaces.',
      0,
      'not_configured'
    );
  }

  let response: Response;
  try {
    response = await fetch(`${config.baseUrl}${path}`, {
      headers: { Authorization: `Bearer ${config.apiKey}` },
      cache: 'no-store',
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

export interface MarketplaceLeadCounts {
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

/**
 * How much of a lead actually arrives.
 *
 * The lead count says the channel is alive; it says nothing about what is in
 * them. A marketplace that keeps delivering but starts sending less — no
 * photograph, no name, no town — moves nothing else on this page, and only a
 * share can show it.
 */
export interface MarketplaceDetail {
  /**
   * What the three counts below are out of, and deliberately not
   * `leads.received`: the window's leads less the purged ones.
   */
  measured: number;
  /** The customer's own photograph or file — usually the model plate. */
  withAttachment: number;
  withProposedTime: number;
  /** Neither a name nor a town. */
  anonymous: number;
  /**
   * Destroyed under Thumbtack's five-business-day rule, so no longer readable.
   * Held out of `measured` rather than counted as empty — that deletion is ours.
   */
  purged: number;
}

export interface MarketplaceMoney {
  /** Charged less refunded. **Null means unknown, never zero** — a marketplace
   *  whose statement nobody has entered has not given its leads away. */
  leadCostCents: number | null;
  chargedCents: number;
  refundedCents: number;
  /** Still inside the marketplace's refund window, so still provisional. */
  pendingCents: number;
  leadsWithACost: number;
  /** Some of the window's leads carry no recorded cost at all. */
  costIsPartial: boolean;
  invoicedCents: number;
  paidCents: number;
  costPerAcquiredCustomerCents: number | null;
}

export interface MarketplaceConnection {
  id: string;
  externalBusinessId: string;
  businessName: string | null;
  enabled: boolean;
  lastEventAt: string | null;
  events: { received: number; failed: number };
  leads: MarketplaceLeadCounts;
  detail: MarketplaceDetail;
  money: MarketplaceMoney;
}

export interface MarketplaceEvent {
  id: string;
  connectionId: string | null;
  type: string;
  receivedAt: string;
  handled: boolean;
  error: string | null;
}

export interface MarketplaceProvider {
  /** `THUMBTACK`. The enum, not a label. */
  provider: string;
  /**
   * As of now, not as of the window.
   *
   * This is the single most valuable figure on the page: a webhook that quietly
   * stopped and a quiet week produce identical lead counts, and only the date of
   * the last delivery tells them apart.
   */
  lastEventAt: string | null;
  events: {
    received: number;
    failed: number;
    /** Arrived on the key but matched no linked business. */
    unattributed: number;
  };
  leads: MarketplaceLeadCounts;
  detail: MarketplaceDetail;
  money: MarketplaceMoney;
  connections: MarketplaceConnection[];
  recent: MarketplaceEvent[];
}

export interface MarketplaceReport {
  period: { from: string; to: string; days: number; label: string; timezone: string };
  scope: { companies: Array<{ id: string; name: string }>; ownBusiness: string };
  providers: MarketplaceProvider[];
}

export async function getMarketplace(from: Date, to: Date): Promise<MarketplaceReport> {
  return call(
    `/v1/reports/marketplace?from=${from.toISOString()}&to=${to.toISOString()}`
  );
}

/**
 * Brand names, and that is why they are not dictionary keys.
 *
 * "Thumbtack" is Thumbtack in both languages. A provider JobPocket adds later
 * falls through to its own enum, which reads as unfinished rather than
 * disappearing off the page.
 */
export const PROVIDER_LABELS: Record<string, string> = {
  THUMBTACK: 'Thumbtack',
};

export function providerLabel(provider: string): string {
  return PROVIDER_LABELS[provider] ?? provider;
}
