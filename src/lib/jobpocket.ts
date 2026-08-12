import { db, quietly } from '@/lib/db';
import { queueWonConversion, flushConversionQueue } from '@/lib/conversions';

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
      baseUrl: process.env.JOBPOCKET_BASE_URL || DEFAULT_BASE_URL,
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
      apiKey: row.value.apiKey,
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
  problem: string | null;
  message: string | null;
  device: string | null;
  geo_city: string | null;
  geo_region: string | null;
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
    service: lead.appliance ? `${lead.appliance.replace(/-/g, ' ')} repair` : undefined,
    description: lead.problem || lead.message || undefined,
    address: {
      line1: lead.address ?? undefined,
      city: lead.city ?? undefined,
      zip: lead.zip ?? undefined,
    },
    appliance: lead.appliance ? { type: lead.appliance } : undefined,
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
      select id, name, email, phone, address, city, zip, appliance, problem, message,
             device, geo_city, geo_region,
             lt_source, lt_medium, lt_campaign, lt_term, lt_content,
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
  status?: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
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
  if (result.status === 'CANCELLED') {
    return previous && previous !== 'pending' ? 'cancelled_post' : 'cancelled_pre';
  }

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
  if (state.startsWith('cancelled') && ['booked', 'won'].includes(currentStatus)) {
    return 'cancelled_after_booked';
  }
  if (state === 'refunded' && currentStatus === 'won') return 'refund_after_won';
  return null;
}

/** How long until this lead is worth asking about again. */
function nextPollInterval(state: string): string | null {
  if (['declined', 'cancelled_pre', 'cancelled_post', 'refunded', 'gone'].includes(state)) {
    return null; // settled
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
