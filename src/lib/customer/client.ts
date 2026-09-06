/**
 * A household's own visits, read out of JobPocket.
 *
 * Three JobPocket clients already live in this repo and each holds a different
 * credential on purpose. This one holds the operations key — the same one
 * `bookings/client.ts` guards — and that needs justifying, because everything
 * else about the customer area is public-facing.
 *
 * The justification is where the key is used. It never reaches a browser: the
 * customer proves the phone number is theirs with a code, the site's own server
 * puts that fact in a signed cookie, and only the server ever calls this. A
 * visitor who has not been through the code has nothing to send, and a visitor
 * who has can only ever ask about the number they proved.
 *
 * The upstream endpoint does the part that matters — a client whose record came
 * from the dispatcher, or a job that did, is not returned at all. That filter
 * belongs there, next to the data, and not here where a forgotten `.filter()`
 * would put an Esquire job under a CoastPro letterhead.
 *
 * Types are a transcription of `api/src/routes/operationsApi.ts`, not an
 * import — the two repositories share no package. A field JobPocket adds does
 * not appear here until somebody adds it, which is the failure mode to want.
 */

import { operationsConfig } from '@/lib/bookings/client';

/** One indexed lookup and a serialisation; no scraping, no PDF work. */
const REQUEST_TIMEOUT_MS = 10_000;

export interface VisitWarranty {
  partsDays: number | null;
  laborDays: number | null;
  /** The day the work was finished — null while a visit is still ahead. */
  startsOn: string | null;
  partsUntil: string | null;
  laborUntil: string | null;
  active: boolean;
  /**
   * `fields` once the apps write the numbers, `terms` for a document whose
   * warranty is still only a sentence, null when none was ever recorded.
   */
  source: 'fields' | 'terms' | null;
}

export interface VisitDocument {
  id: string;
  type: 'ESTIMATE' | 'INVOICE';
  documentNumber: string;
  totalCents: number;
  paidAt: string | null;
}

export interface Visit {
  id: string;
  jobNumber: string | null;
  status: string;
  paymentStatus: string;
  title: string | null;
  type: string | null;
  diagnosis: string | null;
  resolution: string | null;
  appliance: { brand: string | null; model: string | null } | null;
  scheduledAt: string | null;
  completedAt: string | null;
  totalCents: number;
  paidCents: number;
  balanceCents: number;
  warranty: VisitWarranty;
  /** Opens the full paperwork at /report/<token>, which already exists. */
  reportToken: string | null;
  photoCount: number;
  documents: VisitDocument[];
}

export interface CustomerVisits {
  client: { name: string } | null;
  /**
   * The shop's own clock, IANA. Dates are formatted in it rather than in the
   * reader's: a warranty is a promise this business made, so "until 18
   * November" must mean its 18 November, not the 18 November of wherever the
   * customer happens to be holding the phone.
   */
  timeZone: string;
  visits: Visit[];
}

export class VisitsUnavailableError extends Error {}

/**
 * Everything on record for one phone number.
 *
 * An unknown number and a dispatcher-only number both come back as an empty
 * list rather than an error, and that sameness is the point: the page must not
 * become a way of asking whether somebody is a customer here.
 *
 * Never cached, for the same reason the report page is not — a balance settled
 * this afternoon has to read as settled this afternoon, and a copy of somebody
 * else's repair history in a shared edge cache is the one outcome worth
 * designing against.
 */
export async function fetchVisits(phoneE164: string): Promise<CustomerVisits> {
  const config = await operationsConfig();
  if (!config) throw new VisitsUnavailableError('JobPocket is not configured.');

  const url = new URL('/v1/customer/visits', config.baseUrl);
  url.searchParams.set('phone', phoneE164);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${config.apiKey}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new VisitsUnavailableError(`Could not reach JobPocket: ${message}`);
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new VisitsUnavailableError(body?.error ?? `JobPocket answered ${response.status}.`);
  }

  const body = (await response.json().catch(() => null)) as CustomerVisits | null;
  if (!body || !Array.isArray(body.visits)) {
    throw new VisitsUnavailableError('JobPocket answered without a list of visits.');
  }
  return body;
}

/**
 * "It has broken again."
 *
 * Deliberately not the lead path the booking form uses. A warranty callback is
 * not a marketing enquiry: counting it as a lead would credit an ad with a
 * customer we have already been paid for once, and quietly inflate whichever
 * channel they originally came from. It is also not ours to validate — whether
 * this job belongs to this phone is a question only JobPocket can answer, so it
 * is asked there, next to the data, rather than re-implemented here.
 *
 * A 404 means the visit is not theirs, or is dispatcher work. Both come back
 * the same way on purpose.
 */
export async function fileWarrantyCallback(
  phoneE164: string,
  jobId: string,
  description: string,
): Promise<{ ok: true; warrantyActive: boolean } | { ok: false; status: number }> {
  const config = await operationsConfig();
  if (!config) throw new VisitsUnavailableError('JobPocket is not configured.');

  let response: Response;
  try {
    response = await fetch(new URL('/v1/customer/callback', config.baseUrl), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({ phone: phoneE164, jobId, description }),
      cache: 'no-store',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new VisitsUnavailableError(`Could not reach JobPocket: ${message}`);
  }

  if (!response.ok) return { ok: false, status: response.status };

  const body = (await response.json().catch(() => null)) as { warrantyActive?: boolean } | null;
  return { ok: true, warrantyActive: Boolean(body?.warrantyActive) };
}

/**
 * Sending and checking the code.
 *
 * These two sit on JobPocket's public `/portal-api` and take no key — they are
 * the same endpoints its own customer portal uses, rate-limited upstream by IP
 * and by number, and they always answer "sent" so that neither can be used to
 * find out whether a number is known. Twilio Verify carries the message, which
 * is why this works at all while ordinary outbound SMS is still throttled.
 */
export async function requestCode(phone: string): Promise<boolean> {
  const config = await operationsConfig();
  const base = config?.baseUrl ?? 'https://portal.jobpocket.app';
  try {
    const response = await fetch(`${base}/portal-api/request-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
      cache: 'no-store',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * True only when Twilio says the code was right.
 *
 * JobPocket hands back a portal token of its own here and this deliberately
 * drops it. That token opens the JobPocket-branded portal for the whole of a
 * client's record, dispatcher jobs included; carrying it around in a browser
 * cookie on this domain would be handing out a second door into a room this
 * site is at pains to partition. All we need from the exchange is the fact that
 * the number was proved, and that fact goes into our own signed cookie.
 */
export async function verifyCode(phone: string, code: string): Promise<boolean> {
  const config = await operationsConfig();
  const base = config?.baseUrl ?? 'https://portal.jobpocket.app';
  try {
    const response = await fetch(`${base}/portal-api/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code }),
      cache: 'no-store',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) return false;
    const body = (await response.json().catch(() => null)) as { token?: string } | null;
    return Boolean(body?.token);
  } catch {
    return false;
  }
}
