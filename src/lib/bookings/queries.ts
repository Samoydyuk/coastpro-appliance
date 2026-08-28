import { requireDb } from '@/lib/db';

/**
 * What this console knows that JobPocket does not.
 *
 * A booking request in JobPocket is a name, a problem and a time. The same
 * enquiry in this database also carries where the person came from — which ad,
 * which search, which campaign — because that was captured on the website
 * before the request was ever filed.
 *
 * Joining the two is the whole reason a booking screen belongs here rather
 * than only in the app. On the phone it reads "Ann wants a washer looked at".
 * Here it reads "Ann, Google Ads, appliance repair irvine" — and that is the
 * sentence that decides where next month's budget goes.
 *
 * The join key is `leads.jp_request_id`, written when the lead was pushed.
 */

export interface LeadAttribution {
  leadId: string;
  channel: string | null;
  source: string | null;
  campaign: string | null;
  term: string | null;
  status: string;
  valueCents: number | null;
  /** Set when a human's verdict and JobPocket's disagree. Shown, never resolved. */
  conflict: string | null;
}

/**
 * Attribution for a set of JobPocket request ids, keyed by request id.
 *
 * One query for the page. Requests with no row here came in some other way —
 * the booking page directly, or a phone call somebody typed in — and that
 * absence is itself worth showing: it is the share of work advertising did not
 * pay for.
 */
export async function attributionForRequests(
  requestIds: string[]
): Promise<Map<string, LeadAttribution>> {
  const found = new Map<string, LeadAttribution>();
  if (requestIds.length === 0) return found;

  const sql = requireDb();

  const rows = (await sql`
    select
      jp_request_id,
      id,
      lt_channel,
      lt_source,
      lt_campaign,
      lt_term,
      status,
      value_cents,
      jp_conflict
    from leads
    where jp_request_id = any(${requestIds}::text[])
  `) as unknown as Record<string, unknown>[];

  for (const row of rows) {
    found.set(String(row.jp_request_id), {
      leadId: String(row.id),
      channel: (row.lt_channel as string) ?? null,
      source: (row.lt_source as string) ?? null,
      campaign: (row.lt_campaign as string) ?? null,
      term: (row.lt_term as string) ?? null,
      status: String(row.status),
      valueCents: row.value_cents === null ? null : Number(row.value_cents),
      conflict: (row.jp_conflict as string) ?? null,
    });
  }

  return found;
}

/**
 * Nudge one lead to be re-read from JobPocket on the next sweep.
 *
 * Called after accepting from this console so the local status catches up now
 * rather than at tomorrow's cron. It only moves the queue forward — the state
 * itself is still applied by `syncJobPocketOutcomes`, which is where the rules
 * live about never overruling a person's own verdict.
 */
export async function markLeadForImmediatePoll(requestId: string): Promise<void> {
  const sql = requireDb();
  await sql`
    update leads
    set jp_next_poll_at = now(),
        jp_poll_state = case when jp_poll_state = 'settled' then 'open' else jp_poll_state end
    where jp_request_id = ${requestId}
  `;
}
