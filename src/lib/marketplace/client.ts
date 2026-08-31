import { operationsConfig, OperationsApiError } from '@/lib/bookings/client';

/**
 * Reading the paid marketplaces out of JobPocket, and writing back the one
 * figure nobody can push.
 *
 * A Thumbtack lead never touches this website. It has no visitor, no session
 * and no click id, so it cannot go in the console's own `leads` table and
 * `thumbtack` is deliberately absent from `CHANNELS` — a channel row that could
 * only ever read zero would sit on the channels page contradicting this one.
 * The lead lands in JobPocket as a booking request, its price lands in
 * JobPocket's lead ledger, and the console asks JobPocket what both add up to.
 *
 * Same bargain as `lib/money/client.ts`: JobPocket computes, the console draws.
 * Money arrives as whole cents and is formatted, never recalculated. The two
 * writes at the bottom do not break that bargain — they hand JobPocket a figure
 * to keep, and every total on the screen still comes back from JobPocket.
 *
 * The request helper below is this file's own rather than borrowed from the
 * money client. It is four lines of fetch either way, and sharing it would mean
 * exporting a private function out of a module about profit so that a module
 * about advertising could set a different timeout on it.
 */

const REQUEST_TIMEOUT_MS = 10_000;

async function call<T>(path: string, init?: RequestInit): Promise<T> {
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
      ...init,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
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
  /**
   * A street line, and not just the town.
   *
   * Counted because it stopped being a constant. Everything here used to say a
   * marketplace lead carries a town and never a street — that came from a third
   * party's write-up of Thumbtack's API, and the first payload a live account
   * sent carried one. It is the figure on this table that decides whether a lead
   * can be planned without ringing the customer first.
   */
  withAddress: number;
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
  /**
   * `chargedCents` split by where each figure came from, keyed by
   * `LeadCostOrigin` — `API` for what the marketplace pushed, `MANUAL` for what
   * somebody typed, and three more for statements, allocations and standing
   * prices. All five keys are always present and they sum to `chargedCents`.
   *
   * The enum's own comment in JobPocket's schema says these "differ enormously
   * in how far they can be trusted, and the report is required to say which one
   * it is standing on". This is the field that lets the page say it.
   *
   * Only reaches charges hanging off a lead that arrived in the window, which
   * is nearly always none of the hand-entered ones — those hang off nothing at
   * all and are counted in `MarketplaceReport.manual` instead.
   */
  chargedByOrigin: Record<string, number>;
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

/**
 * One lead cost somebody typed in.
 *
 * It has a channel and, usually, nothing else. `bookingRequestId` is null for
 * most of them and that is the ordinary case, not a fault: a lead that arrived
 * before the webhook existed never reached JobPocket, so there is no request to
 * hang the cost on. JobPocket's schema names this case in the field's own
 * comment, which is why the console can show it as a plain row rather than an
 * error.
 */
export interface ManualCharge {
  id: string;
  channelId: string;
  /** Set only when the owner knew which job the lead became. Usually null. */
  bookingRequestId: string | null;
  chargedAt: string;
  amountCents: number;
  kind: string;
  status: string;
  /** `MANUAL` throughout this list — that is what put it in the list. */
  origin: string;
  /** The marketplace's own id for the lead, when the owner could see one. */
  externalId: string | null;
  description: string | null;
}

export interface MarketplaceReport {
  period: { from: string; to: string; days: number; label: string; timezone: string };
  scope: { companies: Array<{ id: string; name: string }>; ownBusiness: string };
  providers: MarketplaceProvider[];
  /**
   * Top-level, not inside a provider, because a typed-in charge has no
   * connection and no business id to file it under. Dated by the day the
   * marketplace charged rather than by the cohort of leads, so it answers "what
   * did I type in for this stretch" — which is a different question from the
   * one every figure above answers, and the reason the page keeps them apart.
   */
  manual: {
    rows: number;
    chargedCents: number;
    /** More typed in than one page holds; `charges` and the total cover the listed ones. */
    truncated: boolean;
    charges: ManualCharge[];
  };
}

export async function getMarketplace(from: Date, to: Date): Promise<MarketplaceReport> {
  return call(
    `/v1/reports/marketplace?from=${from.toISOString()}&to=${to.toISOString()}`
  );
}

/**
 * The marketplace a hand-entered charge belongs to.
 *
 * One value, because JobPocket accepts one: the endpoint's `provider` is
 * restricted to the keys of its own `PROVIDER_CHANNELS`, and that table decides
 * which `LeadChannel` the charge lands on. A second marketplace turns this into
 * a select on the form and a second entry here — until then a dropdown of one
 * would be a control that cannot be used.
 */
export const MANUAL_CHARGE_PROVIDER = 'THUMBTACK';

export interface ManualChargeInput {
  provider: string;
  /** An instant, not a bare date — see the route handler for why it is midday. */
  chargedAt: string;
  amountCents: number;
  description?: string;
  externalId?: string;
  bookingRequestId?: string;
}

export interface ManualChargeResult {
  ok: true;
  /** False when an `externalId` matched and the earlier entry was corrected instead. */
  created: boolean;
  keyedOn: 'externalId' | null;
  /**
   * Same channel, same day, same amount, already typed in.
   *
   * A warning and never a refusal: two leads at $25 on one Tuesday is an
   * ordinary week, so the server hands the collision back and lets the person
   * who was reading the billing page decide.
   */
  possibleDuplicates: ManualCharge[];
  charge: ManualCharge;
}

/**
 * Writing down what a lead cost, because nothing will ever push it.
 *
 * Thumbtack's webhook only goes forward and they publish no backfill — reaching
 * a past negotiation needs the partner OAuth API, which is gated — so a lead
 * that arrived before the integration did can be recorded in exactly one way:
 * somebody reads the billing page and types it.
 *
 * JobPocket writes it as a `LeadCharge` with no lead attached and
 * `origin: MANUAL`, which is what keeps a typed figure from ever being counted
 * as one the marketplace sent. This side cannot ask for anything else: `origin`,
 * `kind` and `status` are not part of the body and JobPocket strips them.
 */
export async function recordManualCharge(input: ManualChargeInput): Promise<ManualChargeResult> {
  return call('/v1/reports/marketplace/charges', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/**
 * Taking a typed figure back.
 *
 * The first thing anybody does after typing a number by hand is type it wrong,
 * and a wrong lead cost is subtracted from the channel's profit and divided into
 * cost-per-customer on every screen that draws either. JobPocket refuses this
 * for a charge the marketplace sent — that one is a fact nothing here could put
 * back.
 */
export async function deleteManualCharge(
  id: string
): Promise<{ ok: true; id: string; origin: string }> {
  return call(`/v1/reports/marketplace/charges/${encodeURIComponent(id)}`, { method: 'DELETE' });
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
