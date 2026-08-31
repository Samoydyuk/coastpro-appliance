import { db, quietly } from '@/lib/db';
import { openSecret } from '@/lib/secrets';
import { queueWonConversion, flushConversionQueue } from '@/lib/conversions';
import { CHANNELS, CHANNEL_LABELS, type Channel } from '@/lib/attribution';
import { pushChannelSpend, type SpendEntry } from '@/lib/channels/client';

/**
 * Talking to JobPocket.
 *
 * Two directions. Outward: every lead this site captures becomes a booking
 * request on the owner's phone, so a form submission is a dispatch rather than
 * an email nobody opens. Inward: once that job is paid, its value comes back
 * here and goes on to Google Ads as real revenue — which is the only way the
 * advertising can optimise for paid work instead of for form fills.
 *
 * The hard rule running through this file: **a person's judgement outranks a
 * synchronisation.** The console's status is set by someone who spoke to the
 * customer. This code may raise it, never lower it, and never touch it at all
 * once somebody has written the lead off.
 */

const DEFAULT_BASE_URL = 'https://portal.jobpocket.app';
/**
 * The visitor is waiting. A lead that arrives a second late is fine; a form
 * that hangs is not. Anything slower than this goes to the queue instead, and
 * the retry is safe because the API keys on our lead id.
 */
const PUSH_TIMEOUT_MS = 1500;
const POLL_TIMEOUT_MS = 8000;

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface JobPocketConfig {
  baseUrl: string;
  apiKey: string;
  enabled: boolean;
}

let cached: { at: number; value: JobPocketConfig | null } | null = null;
const CONFIG_TTL_MS = 60_000;

/**
 * The key lives in the `settings` table rather than an environment variable,
 * with the env as an override for local work.
 *
 * The deciding argument is rotation: the key is minted by a screen on the other
 * side, and the old one dies the instant it is replaced. If it lived in Vercel,
 * the gap between rotating there and redeploying here is a window where every
 * submission is rejected — and nobody redeploys a website at nine on a Friday
 * because a key changed. A settings row is paste-and-done.
 *
 * Cached including the negative case, so a site with no integration pays one
 * query a minute rather than one per visitor.
 */
export async function jobPocketConfig(): Promise<JobPocketConfig | null> {
  if (cached && Date.now() - cached.at < CONFIG_TTL_MS) return cached.value;

  const envKey = process.env.JOBPOCKET_API_KEY;
  if (envKey) {
    const value = {
      baseUrl: process.env.JOBPOCKET_API_BASE || process.env.JOBPOCKET_BASE_URL || DEFAULT_BASE_URL,
      apiKey: envKey,
      enabled: true,
    };
    cached = { at: Date.now(), value };
    return value;
  }

  const sql = db();
  if (!sql) return null;

  const value = await quietly(async () => {
    const [row] = (await sql`select value from settings where key = 'jobpocket'`) as unknown as {
      value: { apiKey?: string; baseUrl?: string; enabled?: boolean };
    }[];
    if (!row?.value?.apiKey) return null;
    return {
      baseUrl: row.value.baseUrl || DEFAULT_BASE_URL,
      // Sealed at rest since the console started showing customers; an
      // unsealed value from before that passes through untouched.
      apiKey: openSecret(row.value.apiKey),
      enabled: row.value.enabled !== false,
    };
  });

  cached = { at: Date.now(), value: value ?? null };
  return value ?? null;
}

/** Called after the key is changed in the console, so the next request sees it. */
export function forgetJobPocketConfig() {
  cached = null;
}

/**
 * The booking form's reads.
 *
 * These three are the public face of a JobPocket booking page — no key, no
 * lead, nothing written. They are what lets the form show the technician's
 * real calendar instead of a wishlist the office has to phone back and undo.
 *
 * The slug identifies whose calendar, and is the one piece of this file that
 * is genuinely per-site, so it stays an environment variable.
 */
const BOOKING_SLUG = process.env.JOBPOCKET_BOOKING_SLUG || 'coastpro';

export interface BookingService {
  id: string;
  name: string;
  description: string | null;
  duration: number | null;
  priceFrom: number | null;
  priceTo: number | null;
}

export interface ArrivalWindow {
  label: string;
  start: string;
  end: string;
  startISO: string;
  endISO: string;
}

/**
 * Where the public booking endpoints live.
 *
 * Deliberately *not* the settings row the API key comes from. The key rotates
 * and must be read fresh; the host does not. Looking it up in Postgres would
 * put a database round-trip inside a public page render — and, worse, would
 * hide these fetches from Next's cache, freezing the service list at whatever
 * it was on the day of the last deploy.
 */
const BOOKING_BASE = process.env.JOBPOCKET_API_BASE || DEFAULT_BASE_URL;

/** The service list shown in the form, straight from JobPocket. */
export async function getServices(): Promise<BookingService[]> {
  const res = await fetch(`${BOOKING_BASE}/book/${BOOKING_SLUG}/services`, {
    // The list changes when the owner edits it in the app, not per request.
    next: { revalidate: 300 },
  }).catch(() => null);
  if (!res?.ok) return [];
  const data = (await res.json().catch(() => ({}))) as { services?: BookingService[] };
  return data.services ?? [];
}

/** Arrival windows still open on a given day, for a given service. */
export async function getWindows(date: string, serviceId?: string): Promise<ArrivalWindow[]> {
  const url = new URL(`${BOOKING_BASE}/book/${BOOKING_SLUG}/slots`);
  url.searchParams.set('date', date);
  if (serviceId) url.searchParams.set('serviceId', serviceId);

  // Availability is the one thing that must never be cached.
  const res = await fetch(url, { cache: 'no-store' }).catch(() => null);
  if (!res?.ok) return [];
  const data = (await res.json().catch(() => ({}))) as {
    windows?: ArrivalWindow[];
    slots?: ArrivalWindow[];
  };
  return data.windows ?? data.slots ?? [];
}

/** Google address suggestions, proxied so we need no Google key of our own. */
export async function getAddressSuggestions(input: string): Promise<string[]> {
  if (input.trim().length < 4) return [];
  const url = new URL(`${BOOKING_BASE}/book/${BOOKING_SLUG}/address-autocomplete`);
  url.searchParams.set('input', input);

  const res = await fetch(url, { cache: 'no-store' }).catch(() => null);
  if (!res?.ok) return [];
  const data = (await res.json().catch(() => ({}))) as {
    predictions?: Array<{ description: string }>;
  };
  return (data.predictions ?? []).map((p) => p.description);
}

// ---------------------------------------------------------------------------
// A breaker, so an outage costs one slow request rather than all of them
// ---------------------------------------------------------------------------

let consecutiveFailures = 0;
let breakerOpenUntil = 0;

function breakerIsOpen(): boolean {
  return Date.now() < breakerOpenUntil;
}

function noteTransportResult(ok: boolean) {
  if (ok) {
    consecutiveFailures = 0;
    breakerOpenUntil = 0;
    return;
  }
  consecutiveFailures += 1;
  if (consecutiveFailures >= 3) breakerOpenUntil = Date.now() + 60_000;
}

// ---------------------------------------------------------------------------
// Pushing a lead
// ---------------------------------------------------------------------------

export type PushOutcome =
  | { kind: 'created'; requestId: string; statusToken: string | null }
  | { kind: 'duplicate'; requestId: string; statusToken: string | null }
  /** Bad data. Retrying sends the same bad data, so it never retries. */
  | { kind: 'rejected'; message: string }
  /** Key wrong, revoked or switched off. Retrying will not help either. */
  | { kind: 'unauthorised'; message: string }
  /**
   * We do not know whether it arrived. Always retry: the API keys on our lead
   * id, so a second attempt returns the first one's result rather than a second
   * customer.
   */
  | { kind: 'unknown'; message: string }
  | { kind: 'disabled' };

interface LeadRow {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  zip: string | null;
  appliance: string | null;
  brand: string | null;
  problem: string | null;
  message: string | null;
  service_name: string | null;
  preferred_start: string | null;
  preferred_end: string | null;
  device: string | null;
  geo_city: string | null;
  geo_region: string | null;
  lt_channel: string | null;
  lt_source: string | null;
  lt_medium: string | null;
  lt_campaign: string | null;
  lt_term: string | null;
  lt_content: string | null;
  lt_landing_path: string | null;
  lt_referrer: string | null;
  gclid: string | null;
  gbraid: string | null;
  wbraid: string | null;
  fbclid: string | null;
  msclkid: string | null;
  ttclid: string | null;
}

/**
 * Takes ownership of a lead before sending it.
 *
 * One statement does the work of a lock. Zero rows back means somebody else is
 * already carrying this lead — a second form submission, or the retry job
 * running while a visitor's request is still in flight.
 *
 * The two minutes must exceed the platform's function timeout, or the reaper
 * would re-send on top of a send that is still running. Attempts are counted
 * here rather than after the call, because an instance frozen mid-flight never
 * reaches an afterwards — and would then retry forever.
 */
async function claimForPush(leadId: string): Promise<boolean> {
  const sql = db();
  if (!sql) return false;

  const claimed = await quietly(async () => {
    const rows = (await sql`
      update leads set
        jp_push_state = 'sending',
        jp_push_attempts = jp_push_attempts + 1,
        jp_push_claimed_at = now()
      where id = ${leadId}::uuid
        and (
          jp_push_state = 'pending'
          or (jp_push_state = 'sending' and jp_push_claimed_at < now() - interval '2 minutes')
        )
      returning id
    `) as unknown as { id: string }[];
    return rows.length > 0;
  });

  return claimed === true;
}

/** HTTP only. Never writes, never throws — the caller decides what it means. */
async function sendLead(lead: LeadRow, config: JobPocketConfig): Promise<PushOutcome> {
  const attribution = {
    landingUrl: lead.lt_landing_path
      ? `https://coastpro.us${lead.lt_landing_path}`
      : undefined,
    referrerUrl: lead.lt_referrer ?? undefined,
    /**
     * The channel this console already worked out, and the one line that lets a
     * Google Ads enquiry be counted against Google Ads spend.
     *
     * JobPocket compares it literally against `LeadChannel.sourceMatch`, and
     * `mirrorAdSpend` below files the month's invoice under the same slug — so
     * the lead and the money it cost meet on one row without anybody mapping
     * anything by hand. `utmSource` beside it is the raw tag and is not a
     * substitute: `google` and `google_ads` and an untagged click with a `gclid`
     * are all this channel, and only `lib/attribution.ts` knows that.
     *
     * Checked against `CHANNELS` rather than passed straight through. JobPocket
     * answers an unrecognised shape with a 400, and a 400 is terminal here —
     * `recordPushOutcome` marks the lead `failed` and never tries it again. A
     * customer reaching the contractor's phone must not depend on a column that
     * only feeds a report, so an unfamiliar value is left off and the rest of
     * the attribution still lands.
     */
    channel: CHANNELS.includes(lead.lt_channel as never) ? lead.lt_channel ?? undefined : undefined,
    utmSource: lead.lt_source ?? undefined,
    utmMedium: lead.lt_medium ?? undefined,
    utmCampaign: lead.lt_campaign ?? undefined,
    utmTerm: lead.lt_term ?? undefined,
    utmContent: lead.lt_content ?? undefined,
    gclid: lead.gclid ?? undefined,
    gbraid: lead.gbraid ?? undefined,
    wbraid: lead.wbraid ?? undefined,
    fbclid: lead.fbclid ?? undefined,
    msclkid: lead.msclkid ?? undefined,
    ttclid: lead.ttclid ?? undefined,
    device: lead.device ?? undefined,
    city: lead.geo_city ?? undefined,
    region: lead.geo_region ?? undefined,
  };

  const body = {
    externalId: lead.id,
    name: lead.name || 'Website enquiry',
    phone: lead.phone || '',
    email: lead.email ?? undefined,
    // The booking form sends JobPocket's own service name; the contact form
    // only knows which appliance, so its label is built from that.
    service:
      lead.service_name ||
      (lead.appliance ? `${lead.appliance.replace(/-/g, ' ')} repair` : undefined),
    description: lead.problem || lead.message || undefined,
    address: {
      line1: lead.address ?? undefined,
      city: lead.city ?? undefined,
      zip: lead.zip ?? undefined,
    },
    appliance:
      lead.appliance || lead.brand
        ? { type: lead.appliance ?? undefined, brand: lead.brand ?? undefined }
        : undefined,
    // The window the visitor picked off the real calendar. Without it the
    // request lands with no time on it and somebody has to ring back to agree
    // the slot the customer already chose.
    preferredStart: lead.preferred_start ?? undefined,
    preferredEnd: lead.preferred_end ?? undefined,
    attribution,
  };

  try {
    const response = await fetch(`${config.baseUrl}/v1/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(PUSH_TIMEOUT_MS),
      cache: 'no-store',
    });

    const payload = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      duplicate?: boolean;
      leadId?: string;
      statusToken?: string | null;
      error?: string;
    };

    if (response.status === 401 || response.status === 403) {
      noteTransportResult(true); // reached them; the credential is the problem
      return { kind: 'unauthorised', message: payload.error || `HTTP ${response.status}` };
    }
    if (response.status === 400) {
      noteTransportResult(true);
      return { kind: 'rejected', message: payload.error || 'Rejected' };
    }
    if (!response.ok || !payload.leadId) {
      // Includes 5xx and 429. The request may well have been created, so this
      // is "unknown", never "failed".
      noteTransportResult(response.status >= 500 || response.status === 0);
      return { kind: 'unknown', message: payload.error || `HTTP ${response.status}` };
    }

    noteTransportResult(true);
    return {
      kind: payload.duplicate ? 'duplicate' : 'created',
      requestId: payload.leadId,
      statusToken: payload.statusToken ?? null,
    };
  } catch (error) {
    noteTransportResult(false);
    const message = error instanceof Error ? error.message : String(error);
    return { kind: 'unknown', message: message.slice(0, 300) };
  }
}

/** Writes only. Separate from the sending so either half can be retried alone. */
async function recordPushOutcome(leadId: string, outcome: PushOutcome): Promise<void> {
  const sql = db();
  if (!sql) return;

  await quietly(async () => {
    if (outcome.kind === 'created' || outcome.kind === 'duplicate') {
      await sql`
        update leads set
          jp_push_state   = 'sent',
          jp_pushed_at    = coalesce(jp_pushed_at, now()),
          jp_request_id   = coalesce(jp_request_id, ${outcome.requestId}),
          jp_status_token = coalesce(jp_status_token, ${outcome.statusToken}),
          jp_last_error   = null,
          jp_poll_state   = case when ${outcome.statusToken}::text is not null
                                 then 'open' else jp_poll_state end,
          jp_next_poll_at = case when ${outcome.statusToken}::text is not null
                                 then now() else jp_next_poll_at end
        where id = ${leadId}::uuid
      `;
      return;
    }

    // Rejected and unauthorised will not improve on their own — stop trying and
    // leave the reason where a human will see it. Everything else goes back on
    // the queue.
    const terminal = outcome.kind === 'rejected' || outcome.kind === 'unauthorised';
    await sql`
      update leads set
        jp_push_state = ${terminal ? 'failed' : 'pending'},
        jp_last_error = ${'message' in outcome ? outcome.message.slice(0, 800) : null}
      where id = ${leadId}::uuid
    `;
  });
}

/**
 * The whole push, as the form routes call it: claim, send, record.
 *
 * Awaited rather than fired and forgotten. On this platform there is no
 * guarantee a promise left running after the response survives — the instance
 * can be frozen the moment the response flushes. The durable queue is the row's
 * own `jp_push_state`, not a dangling promise.
 */
export async function pushLeadNow(leadId: string | null): Promise<PushOutcome> {
  if (!leadId) return { kind: 'disabled' };

  const config = await jobPocketConfig();
  if (!config || !config.enabled) return { kind: 'disabled' };

  // During an outage, do not make every visitor wait for the timeout. The lead
  // is already recorded and already queued.
  if (breakerIsOpen()) return { kind: 'unknown', message: 'circuit open' };

  if (!(await claimForPush(leadId))) return { kind: 'unknown', message: 'already in flight' };

  const sql = db();
  if (!sql) return { kind: 'disabled' };

  const lead = await quietly(async () => {
    const [row] = (await sql`
      select id, name, email, phone, address, city, zip, appliance, brand, problem, message,
             service_name, preferred_start, preferred_end,
             device, geo_city, geo_region,
             lt_channel, lt_source, lt_medium, lt_campaign, lt_term, lt_content,
             lt_landing_path, lt_referrer,
             gclid, gbraid, wbraid, fbclid, msclkid, ttclid
      from leads where id = ${leadId}::uuid
    `) as unknown as LeadRow[];
    return row ?? null;
  });

  if (!lead) {
    await recordPushOutcome(leadId, { kind: 'unknown', message: 'lead not found' });
    return { kind: 'unknown', message: 'lead not found' };
  }

  const outcome = await sendLead(lead, config);
  await recordPushOutcome(leadId, outcome);
  return outcome;
}

/** Retries whatever the visitor's request could not finish. Called by the cron. */
export async function flushLeadPushQueue(limit = 25) {
  const sql = db();
  const config = await jobPocketConfig();
  if (!sql || !config || !config.enabled) return { sent: 0, failed: 0 };

  const pending = (await sql`
    select id from leads
    where (
        jp_push_state = 'pending'
        or (jp_push_state = 'sending' and jp_push_claimed_at < now() - interval '2 minutes')
      )
      and jp_push_attempts < 8
      -- Triage first: a lead marked spam before the retry ran should never
      -- reach the contractor's phone at all.
      and status <> 'spam'
      -- And do not send the same customer twice when the original already
      -- arrived; a repeat within thirty days is one job, not two.
      and (
        duplicate_of is null
        or not exists (
          select 1 from leads original
          where original.id = leads.duplicate_of and original.jp_push_state = 'sent'
        )
      )
    order by created_at asc
    limit ${limit}
  `) as unknown as { id: string }[];

  let sent = 0;
  let failed = 0;
  for (const row of pending) {
    const outcome = await pushLeadNow(row.id);
    if (outcome.kind === 'created' || outcome.kind === 'duplicate') sent += 1;
    else failed += 1;
  }
  return { sent, failed };
}

// ---------------------------------------------------------------------------
// Reading the outcome back
// ---------------------------------------------------------------------------

interface StatusResult {
  token: string;
  found: boolean;
  externalId?: string | null;
  status?: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'LOST' | 'UNANSWERED';
  respondedAt?: string | null;
  job?: {
    id: string;
    status: string;
    paymentStatus: string;
    totalCents: number;
    paidAt: string | null;
    completedAt: string | null;
  } | null;
}

/**
 * Collapses JobPocket's two levels — the request, and the job underneath it —
 * into one ladder this side can reason about.
 *
 * `previous` matters for one distinction only: a cancellation before anyone
 * accepted is the customer changing their mind, while a cancellation after is
 * a job that was called off. They read completely differently in a report.
 */
export function deriveState(result: StatusResult, previous: string | null): string {
  if (!result.found) return 'gone';

  const job = result.job;
  if (result.status === 'PENDING') return 'pending';
  if (result.status === 'DECLINED') return 'declined';
  // Wanted it, somebody else got it. Read as its own outcome rather than as a
  // decline: on a paid channel how often this happens is most of what is being
  // judged, and folding it into "I said no" hides exactly that.
  if (result.status === 'LOST') return 'lost';
  // Nobody ever answered — the customer went quiet. Where a marketplace's
  // no-response refund attaches, so it must not read as work won.
  if (result.status === 'UNANSWERED') return 'unanswered';
  if (result.status === 'CANCELLED') {
    return previous && previous !== 'pending' ? 'cancelled_post' : 'cancelled_pre';
  }

  // Accepted, with no job behind it yet. Every status that is not work in
  // progress has been named above, and that matters: this line used to be
  // reached by LOST and UNANSWERED too, which marked a lead booked, set
  // `booked_at`, and left it being polled for ever. On a channel where most
  // leads are lost, the close rate read as very nearly perfect.
  if (!job) return 'accepted';
  if (job.paymentStatus === 'PAID' || job.status === 'PAID') return 'paid';
  if (job.paymentStatus === 'REFUNDED') return 'refunded';
  if (job.status === 'IN_PROGRESS') return 'working';
  if (job.status === 'INVOICED' || job.status === 'COMPLETED') return 'invoiced';
  return 'accepted';
}

/** What this state would make the lead, if a human had not already decided. */
function proposedStatus(state: string): 'booked' | 'won' | null {
  if (state === 'paid') return 'won';
  if (['accepted', 'working', 'invoiced'].includes(state)) return 'booked';
  return null;
}

/** A disagreement worth a person's attention, or null when there is none. */
function conflictFor(state: string, currentStatus: string): string | null {
  const written_off = currentStatus === 'lost' || currentStatus === 'spam';
  if (written_off && ['accepted', 'working', 'invoiced', 'paid'].includes(state)) {
    return `${state}_after_${currentStatus}`;
  }
  if (state === 'declined' && ['booked', 'won'].includes(currentStatus)) {
    return 'declined_after_booked';
  }
  // Somebody marked this booked here and JobPocket says it went elsewhere, or
  // was never answered. One of the two is wrong and a person has to say which.
  if ((state === 'lost' || state === 'unanswered') && ['booked', 'won'].includes(currentStatus)) {
    return `${state}_after_booked`;
  }
  if (state.startsWith('cancelled') && ['booked', 'won'].includes(currentStatus)) {
    return 'cancelled_after_booked';
  }
  if (state === 'refunded' && currentStatus === 'won') return 'refund_after_won';
  return null;
}

/** How long until this lead is worth asking about again. */
function nextPollInterval(state: string): string | null {
  // `lost` and `unanswered` are endings, not waypoints: the request went to
  // somebody else or died of silence, and neither comes back. Asking again
  // daily for ever is the failure this list exists to prevent.
  const settled = ['declined', 'lost', 'unanswered', 'cancelled_pre', 'cancelled_post', 'refunded', 'gone'];
  if (settled.includes(state)) {
    return null;
  }
  return '1 day';
}

/**
 * Applies one observation.
 *
 * Guarded three ways, and all three are needed:
 *  - it acts on a *change* in JobPocket's state, not on the state itself, so a
 *    lead a human deliberately demoted is not re-promoted by the next poll
 *    seeing the same unchanged answer;
 *  - it only ever moves the status up the ladder;
 *  - it never writes status at all once someone has marked the lead lost or
 *    spam. That is a verdict, not a rung.
 *
 * A disagreement is recorded and surfaced, never resolved automatically.
 * Promoting a written-off lead to won would upload a conversion that did not
 * happen, and teach Google Ads to buy more of whatever produced it.
 */
async function applyState(leadId: string, result: StatusResult): Promise<'promoted' | 'conflict' | 'noop'> {
  const sql = db();
  if (!sql) return 'noop';

  const outcome = await quietly(async () => {
    const [lead] = (await sql`
      select status, jp_applied_state, value_cents from leads where id = ${leadId}::uuid
    `) as unknown as { status: string; jp_applied_state: string | null; value_cents: number | null }[];
    if (!lead) return 'noop' as const;

    const state = deriveState(result, lead.jp_applied_state);
    const proposed = proposedStatus(state);
    const conflict = conflictFor(state, lead.status);
    const interval = nextPollInterval(state);
    const job = result.job ?? null;

    // Only ever set the value when we have none. What is already in
    // `value_cents` may have been uploaded to Google Ads under this lead's id,
    // and that upload cannot be amended from here — the newer figure goes into
    // jp_total_cents and the difference is shown, not silently applied.
    const rows = (await sql`
      update leads set
        jp_request_status = ${result.status ?? null},
        jp_job_id         = ${job?.id ?? null},
        jp_job_status     = ${job?.status ?? null},
        jp_payment_status = ${job?.paymentStatus ?? null},
        jp_total_cents    = ${job?.totalCents ?? null},
        jp_responded_at   = ${result.respondedAt ?? null},
        jp_paid_at        = ${job?.paidAt ?? null},
        jp_state          = ${state},
        jp_applied_state  = ${state},
        jp_synced_at      = now(),
        jp_poll_failures  = 0,
        jp_poll_state     = ${interval ? 'open' : state === 'gone' ? 'gone' : 'settled'},
        jp_next_poll_at   = ${interval ? sql`now() + interval '1 day'` : null},
        jp_conflict       = coalesce(${conflict}, jp_conflict),
        jp_conflict_at    = case when ${conflict}::text is not null and jp_conflict is distinct from ${conflict}
                                 then now() else jp_conflict_at end,
        status = case
          -- A person's verdict is final. This branch must come first: rank
          -- comparison against 'lost' yields null, which would fall through
          -- and promote it.
          when status in ('lost', 'spam') then status
          when ${proposed}::text is null then status
          when array_position(array['new','contacted','booked','won'], status)
               >= array_position(array['new','contacted','booked','won'], ${proposed}) then status
          else ${proposed}
        end,
        booked_at = case when ${proposed}::text in ('booked','won') and status not in ('lost','spam')
                         then coalesce(booked_at, now()) else booked_at end,
        won_at    = case when ${proposed}::text = 'won' and status not in ('lost','spam')
                         then coalesce(won_at, now()) else won_at end,
        value_cents = case when ${proposed}::text = 'won' and status not in ('lost','spam')
                             and value_cents is null
                           then ${job?.totalCents ?? null} else value_cents end
      where id = ${leadId}::uuid
        and jp_applied_state is distinct from ${state}
      returning status
    `) as unknown as { status: string }[];

    if (!rows.length) {
      // Nothing changed on their side. Just move the cadence along.
      await sql`
        update leads set
          jp_synced_at = now(),
          jp_poll_failures = 0,
          jp_next_poll_at = ${interval ? sql`now() + interval '1 day'` : null},
          jp_poll_state = ${interval ? 'open' : state === 'gone' ? 'gone' : 'settled'}
        where id = ${leadId}::uuid
      `;
      return 'noop' as const;
    }

    if (rows[0]!.status === 'won' && lead.status !== 'won') return 'promoted' as const;
    return conflict ? ('conflict' as const) : ('noop' as const);
  });

  return outcome ?? 'noop';
}

/**
 * Asks about every open lead in one request.
 *
 * One request rather than one per lead: the single-lead route is rate limited
 * per address, and a serverless function has one address — polling that way
 * capped the whole daily sync at a handful of leads.
 */
export async function syncJobPocketOutcomes(limit = 50) {
  const sql = db();
  const config = await jobPocketConfig();
  if (!sql || !config || !config.enabled) return { polled: 0, promoted: 0, conflicts: 0 };

  const open = (await sql`
    select id, jp_status_token from leads
    where jp_poll_state = 'open'
      and jp_status_token is not null
      and (jp_next_poll_at is null or jp_next_poll_at <= now())
      and created_at > now() - interval '90 days'
    order by jp_next_poll_at asc nulls first
    limit ${limit}
  `) as unknown as { id: string; jp_status_token: string }[];

  if (!open.length) return { polled: 0, promoted: 0, conflicts: 0 };

  let results: StatusResult[] = [];
  try {
    const response = await fetch(`${config.baseUrl}/v1/lead-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({ tokens: open.map((row) => row.jp_status_token) }),
      signal: AbortSignal.timeout(POLL_TIMEOUT_MS),
      // Never a cached view of somebody else's state. This framework replaces
      // the global fetch with one that caches, and a stale answer here means
      // the console quietly reports a job as unaccepted long after it was
      // accepted — observed, not theorised: the same token returned ACCEPTED
      // to curl and PENDING to this function in the same minute.
      cache: 'no-store',
    });
    if (!response.ok) {
      console.error('[jobpocket] status poll failed:', response.status);
      return { polled: 0, promoted: 0, conflicts: 0 };
    }
    const payload = (await response.json()) as { results?: StatusResult[] };
    results = payload.results ?? [];
  } catch (error) {
    console.error('[jobpocket] status poll error:', error);
    return { polled: 0, promoted: 0, conflicts: 0 };
  }

  const byToken = new Map(results.map((result) => [result.token, result]));
  let promoted = 0;
  let conflicts = 0;

  for (const lead of open) {
    const result = byToken.get(lead.jp_status_token);
    if (!result) continue;

    // A single miss is not proof the request is gone — a deploy or a blip can
    // do that. Only a run of them settles it, and even then the lead is never
    // re-pushed: somebody deleted that request on purpose.
    if (!result.found) {
      await quietly(
        () => sql`
          update leads set
            jp_poll_failures = jp_poll_failures + 1,
            jp_poll_state = case when jp_poll_failures + 1 >= 3 then 'gone' else jp_poll_state end,
            jp_next_poll_at = now() + interval '1 day',
            jp_synced_at = now()
          where id = ${lead.id}::uuid
        `
      );
      continue;
    }

    const applied = await applyState(lead.id, result);
    if (applied === 'promoted') promoted += 1;
    if (applied === 'conflict') conflicts += 1;
  }

  // A lead JobPocket says was paid is the whole point of this — get it to
  // Google Ads in the same run rather than a day later.
  if (promoted > 0) {
    const won = (await sql`
      select id from leads
      where status = 'won' and jp_payment_status = 'PAID' and jp_synced_at > now() - interval '5 minutes'
    `) as unknown as { id: string }[];
    for (const lead of won) await queueWonConversion(lead.id);
    await flushConversionQueue(25);
  }

  return { polled: open.length, promoted, conflicts };
}

// ---------------------------------------------------------------------------
// Sending the spend the other way
// ---------------------------------------------------------------------------

/**
 * Which `ad_spend.source` values are a platform's own figure.
 *
 * An allowlist, and the direction matters. Anything not named here — the
 * `manual` a person types on `/admin/spend`, the `manual_entry` somebody copies
 * off a dashboard with no API, and any importer a later version adds without
 * touching this line — is reported as hand-typed. Calling an importer's number
 * hand-typed loses a little confidence; calling a hand-typed number a statement
 * is a claim nobody can check, and the channels page exists to say which is
 * which. `manual_csv` counts as a statement: the file is the platform's export,
 * even though a person had to fetch it.
 */
const IMPORTER_SOURCES: string[] = ['google_ads_script', 'meta_api', 'gbp_api', 'manual_csv'];

interface SpendGroupRow {
  channel: string;
  period_start: string;
  period_end: string;
  cost_cents: number;
  row_count: number;
  imported_count: number;
}

/**
 * The console's `ad_spend`, mirrored into JobPocket as period totals.
 *
 * Source of truth does not move: spend is still entered here and imported here.
 * What moves is where payback is *computed*, because only JobPocket holds both
 * halves — the ad money this table records and the marketplace charges that
 * never touch this database. `lib/channels/client.ts` opens with the full
 * argument.
 *
 * Three months, not one: the last two full months plus the one in progress, so
 * a late correction to July's invoice still reaches JobPocket in August.
 * Re-sending is the normal case rather than the exception — JobPocket keys each
 * figure on the channel and the two dates and upserts, so a month sent thirty
 * nights running is one row that keeps being corrected.
 *
 * Every channel gets a row for every month in the window, including the months
 * it spent nothing. That is what makes an emptied month reachable: if the owner
 * deletes August's Google Ads rows on `/admin/spend`, a query that only
 * returned what exists would simply stop mentioning August, and JobPocket would
 * go on reporting the old figure for ever. A zero is JobPocket's instruction to
 * delete the row rather than store a nought, which is the difference between a
 * month reading as *unknown* and reading as *free*.
 */
export async function mirrorAdSpend(): Promise<
  | { ok: true; entries: number; written: number; deleted: number; totalCents: number }
  | { ok: false; reason: string }
> {
  const sql = db();
  if (!sql) return { ok: false, reason: 'no database' };

  /**
   * Read, never tripped.
   *
   * `flushLeadPushQueue` runs first in the same cron, against the same host, so
   * by the time this runs the breaker already carries this invocation's own
   * evidence — and if fifty lead pushes have just timed out there is nothing to
   * learn from a fifty-first attempt. It must not be *set* from here, though:
   * an opened breaker makes the next visitor's lead skip its push, and a
   * customer arriving on the contractor's phone outranks a figure on a report.
   */
  if (breakerIsOpen()) return { ok: false, reason: 'circuit open' };

  const rows = await quietly(
    async () =>
      (await sql`
        with months as (
          select generate_series(
                   date_trunc('month', current_date) - interval '2 months',
                   date_trunc('month', current_date),
                   interval '1 month'
                 )::date as period_start
        ),
        -- A year, so a channel that has gone quiet is still offered a zero and
        -- can still be cleared. Restricting this to the window would mean a
        -- channel whose every row was deleted vanished from the query in the
        -- same breath as it needed clearing.
        channels as (
          select distinct channel
          from ad_spend
          where day >= date_trunc('month', current_date) - interval '12 months'
        ),
        totals as (
          select channel,
                 date_trunc('month', day)::date as period_start,
                 coalesce(sum(cost_cents), 0)::int as cost_cents,
                 count(*)::int as row_count,
                 count(*) filter (where source = any(${IMPORTER_SOURCES}::text[]))::int
                   as imported_count
          from ad_spend
          where day >= date_trunc('month', current_date) - interval '2 months'
          group by 1, 2
        )
        select channels.channel,
               to_char(months.period_start, 'YYYY-MM-DD') as period_start,
               -- The calendar month's last day even for the month in progress,
               -- and that is what keeps the key stable: an end that followed
               -- today would make tonight's "Aug 1 – Aug 29" a different figure
               -- from last night's "Aug 1 – Aug 28", and the month would
               -- accumulate one row per night instead of being corrected.
               to_char(
                 (months.period_start + interval '1 month' - interval '1 day')::date,
                 'YYYY-MM-DD'
               ) as period_end,
               coalesce(totals.cost_cents, 0)     as cost_cents,
               coalesce(totals.row_count, 0)      as row_count,
               coalesce(totals.imported_count, 0) as imported_count
        from channels
        cross join months
        left join totals on totals.channel = channels.channel
                        and totals.period_start = months.period_start
        order by months.period_start, channels.channel
      `) as unknown as SpendGroupRow[]
  );

  if (!rows) return { ok: false, reason: 'could not read ad_spend' };
  if (!rows.length) return { ok: true, entries: 0, written: 0, deleted: 0, totalCents: 0 };

  const entries: SpendEntry[] = rows.map((row) => ({
    channel: row.channel,
    /**
     * English, from the constant rather than through `t()`. This is only used
     * if JobPocket has to create the channel, and it is then that channel's
     * name for good — in the phone app, on the owner's screen and in every
     * later report. Whichever language the console happened to be set to on the
     * night of the first sync has no business deciding that.
     */
    label: CHANNEL_LABELS[row.channel as Channel] ?? row.channel,
    /**
     * Midday, not the bare date, and this is the difference between August's
     * spend appearing in an August report and vanishing from it.
     *
     * JobPocket stamps the charge with the period's first day and every report
     * there filters on it. A bare `2026-08-01` reads as midnight UTC, which is
     * five o'clock the previous afternoon in the shop's timezone — before the
     * start of any window the console asks for, so the month's whole spend
     * would fall outside its own month. Midday UTC lands on the right calendar
     * day for every timezone on earth, and JobPocket takes the key off the ISO
     * day, so the key is unchanged.
     */
    periodStart: `${row.period_start}T12:00:00.000Z`,
    periodEnd: `${row.period_end}T12:00:00.000Z`,
    amountCents: Number(row.cost_cents),
    origin:
      Number(row.row_count) > 0 && Number(row.imported_count) === Number(row.row_count)
        ? 'STATEMENT'
        : 'MANUAL',
  }));

  try {
    const result = await pushChannelSpend(entries);
    return { ok: true, ...result };
  } catch (error) {
    // Swallowed here rather than thrown at the cron. This is the least
    // important thing that route does, and a JobPocket key that was rotated
    // this afternoon must not stop tonight's conversion upload.
    const message = error instanceof Error ? error.message : String(error);
    console.error('[jobpocket] ad spend mirror failed:', message);
    return { ok: false, reason: message.slice(0, 300) };
  }
}
