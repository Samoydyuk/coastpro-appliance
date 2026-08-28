import { db, quietly } from '@/lib/db';
import { openSecret } from '@/lib/secrets';

/**
 * Reading JobPocket's booking inbox and calendar.
 *
 * A third key, separate from the website's and the marketing one, and the
 * separation is the point. The website key can only file leads; if it leaked out
 * of the public site all somebody could do is post junk enquiries. This key can
 * read the schedule and every customer on it, so it lives on the server only,
 * sealed in the database, and JobPocket refuses it on any endpoint that is not
 * this scope.
 *
 * Nothing here is cached to disk. The console holds no copy of the customer
 * base — a stolen dump of this site's database is a list of website visits, not
 * a list of the customers. That is a stronger guarantee than encrypting a copy
 * would be, and it is the reason there is no `bookings` table.
 */

const DEFAULT_BASE_URL = 'https://portal.jobpocket.app';
const REQUEST_TIMEOUT_MS = 8000;

export interface OperationsConfig {
  baseUrl: string;
  apiKey: string;
}

let cached: { at: number; value: OperationsConfig | null } | null = null;
const CONFIG_TTL_MS = 60_000;

/**
 * The key, from the environment or the settings table.
 *
 * Same reasoning as the other two: re-enabling the integration in JobPocket
 * mints a new secret and kills the old one on the spot, so the key has to be
 * replaceable without a redeploy. Stored sealed; `openSecret` passes an
 * unsealed value through untouched, so a key pasted in before the encryption
 * existed keeps working until it is next saved.
 */
export async function operationsConfig(): Promise<OperationsConfig | null> {
  if (cached && Date.now() - cached.at < CONFIG_TTL_MS) return cached.value;

  const baseUrl = process.env.JOBPOCKET_API_BASE || DEFAULT_BASE_URL;

  const envKey = process.env.JOBPOCKET_OPERATIONS_KEY;
  if (envKey) {
    const value = { baseUrl, apiKey: envKey };
    cached = { at: Date.now(), value };
    return value;
  }

  const sql = db();
  if (!sql) return null;

  const value = await quietly(async () => {
    const [row] = (await sql`
      select value from settings where key = 'jobpocket_operations'
    `) as unknown as { value: { apiKey?: string; baseUrl?: string; enabled?: boolean } }[];

    if (!row?.value?.apiKey) return null;
    if (row.value.enabled === false) return null;

    return { baseUrl: row.value.baseUrl || baseUrl, apiKey: openSecret(row.value.apiKey) };
  });

  cached = { at: Date.now(), value: value ?? null };
  return value ?? null;
}

/** Called after the key is changed in the console, so the next read sees it. */
export function forgetOperationsConfig(): void {
  cached = null;
}

/**
 * A failure the owner can act on.
 *
 * The console shows this message verbatim. "Something went wrong" tells nobody
 * whether to paste a new key, wait, or call somebody.
 */
export type OperationsFailure =
  /** No key has been pasted yet — a setup step, not a fault. */
  | 'not_configured'
  /** The key was rejected: rotated, revoked, or the wrong scope. */
  | 'rejected'
  /** JobPocket could not be reached, or answered with something unusable. */
  | 'unreachable';

export class OperationsApiError extends Error {
  readonly status: number;
  /**
   * Why it failed, in the terms a screen needs to decide what to draw.
   * "Not connected yet" and "connected but broken" look identical if all you
   * have is a message, and drawing an empty month for the first one reads as
   * "no work booked" — which is a different and much more alarming sentence.
   */
  readonly code: OperationsFailure;

  constructor(message: string, status: number, code: OperationsFailure) {
    super(message);
    this.name = 'OperationsApiError';
    this.status = status;
    this.code = code;
  }
}

function notConfigured(): OperationsApiError {
  return new OperationsApiError(
    'No bookings key yet. Mint an "operations" key in JobPocket and paste it into Settings.',
    0,
    'not_configured'
  );
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const config = await operationsConfig();
  if (!config) throw notConfigured();

  let response: Response;
  try {
    response = await fetch(`${config.baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      // Next patches fetch and caches it by default; a schedule that is one
      // deploy stale is worse than no schedule at all.
      cache: 'no-store',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new OperationsApiError(`Could not reach JobPocket: ${message}`, 0, 'unreachable');
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;

    if (response.status === 401) {
      throw new OperationsApiError(
        'JobPocket rejected the bookings key. It was probably rotated — paste the new one in Settings.',
        401,
        'rejected'
      );
    }
    if (response.status === 403) {
      throw new OperationsApiError(
        body?.error ??
          'That key is not allowed to read bookings. Check it is the "operations" key, not the website one.',
        403,
        'rejected'
      );
    }
    throw new OperationsApiError(
      body?.error ?? `JobPocket answered ${response.status}.`,
      response.status,
      'unreachable'
    );
  }

  return (await response.json()) as T;
}

// ---------------------------------------------------------------------------
// Shapes
//
// Note what is missing from the list types: no phone, no email. Those come back
// only from the single-request endpoint, so one stolen request cannot walk off
// with the contact book.
// ---------------------------------------------------------------------------

export interface BookingRequestSummary {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
  clientName: string;
  clientAddress: string | null;
  serviceType: string;
  preferredDate: string | null;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  createdAt: string;
  respondedAt: string | null;
  jobId: string | null;
  externalId: string | null;
}

export interface BookingRequestDetail extends BookingRequestSummary {
  clientPhone: string;
  clientEmail: string | null;
  description: string | null;
  preferredTime: string | null;
  formData: Record<string, string> | null;
  job: {
    id: string;
    jobNumber: string | null;
    status: string;
    paymentStatus: string;
    totalCents: number;
    scheduledAt: string | null;
  } | null;
}

export interface CalendarJob {
  id: string;
  jobNumber: string | null;
  status: string;
  paymentStatus: string;
  clientName: string | null;
  address: string | null;
  scheduledAt: string;
  scheduledEnd: string | null;
  estimatedDuration: number | null;
  totalCents: number;
  type: string | null;
  company: { id: string; name: string } | null;
  /**
   * Whose name the work is done under. Null means the contractor's own —
   * dispatched work carries the dispatcher's brand, and on this account that
   * is most of the calendar.
   */
  brand: { id: string; name: string } | null;
}

export interface JobLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
  category: string | null;
  partNumber: string | null;
  isExcluded: boolean;
}

export interface JobDetail {
  id: string;
  jobNumber: string | null;
  status: string;
  paymentStatus: string;
  type: string | null;
  address: string | null;
  notes: string | null;
  diagnosis: string | null;
  resolution: string | null;
  appliance: { brand: string | null; model: string | null } | null;
  scheduledAt: string | null;
  scheduledEnd: string | null;
  estimatedDuration: number | null;
  startedAt: string | null;
  completedAt: string | null;
  paidAt: string | null;
  createdAt: string;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  taxRate: number;
  client: { id: string; name: string; phone: string | null; email: string | null } | null;
  brand: { id: string; name: string } | null;
  company: { id: string; name: string } | null;
  assignedTo: { id: string; name: string } | null;
  lineItems: JobLineItem[];
}

// ---------------------------------------------------------------------------
// Calls
// ---------------------------------------------------------------------------

export async function listBookingRequests(options: {
  status?: string;
  limit?: number;
  cursor?: string;
} = {}): Promise<{ requests: BookingRequestSummary[]; nextCursor: string | null }> {
  const params = new URLSearchParams();
  if (options.status) params.set('status', options.status);
  if (options.limit) params.set('limit', String(options.limit));
  if (options.cursor) params.set('cursor', options.cursor);

  const query = params.toString();
  return call(`/v1/booking-requests${query ? `?${query}` : ''}`);
}

export async function getBookingRequest(id: string): Promise<{ request: BookingRequestDetail }> {
  return call(`/v1/booking-requests/${encodeURIComponent(id)}`);
}

export async function acceptRequest(
  id: string,
  body: { scheduledStart?: string; scheduledEnd?: string; teamMemberId?: string } = {}
): Promise<{ ok: true; jobId: string; clientId: string; alreadyAccepted: boolean }> {
  return call(`/v1/booking-requests/${encodeURIComponent(id)}/accept`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function declineRequest(id: string): Promise<{ ok: true }> {
  return call(`/v1/booking-requests/${encodeURIComponent(id)}/decline`, {
    method: 'POST',
    body: '{}',
  });
}

export async function getCalendar(
  from: string,
  to: string
): Promise<{ jobs: CalendarJob[]; timezone: string; ownBusiness: string | null }> {
  const params = new URLSearchParams({ from, to });
  return call(`/v1/calendar?${params.toString()}`);
}

export interface BookJobInput {
  externalId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  service?: string;
  description?: string;
  /** When to turn up. Applied at the accept step, not at the lead step — see below. */
  scheduledStart?: string;
  scheduledEnd?: string;
}

/**
 * Booking a job from the console: file the request, then accept it.
 *
 * There is deliberately no third endpoint for this. A job booked by hand and a
 * job accepted from the website should be the same kind of job, made the same
 * way, or the two will slowly stop resembling each other — different numbering,
 * a different idea of what an appliance is, one of them missing from a report.
 *
 * The time is applied at the *accept* step rather than sent with the lead. The
 * lead endpoint re-checks a requested time against public availability and
 * refuses one that is taken, which is right for a customer and wrong for the
 * owner: somebody putting a visit in their own diary is not bound by the
 * windows their booking page happens to be offering.
 */
export async function bookJob(input: BookJobInput): Promise<{ requestId: string; jobId: string }> {
  const lead = await call<{ leadId: string; duplicate: boolean }>('/v1/leads', {
    method: 'POST',
    body: JSON.stringify({
      externalId: input.externalId,
      name: input.name,
      phone: input.phone,
      email: input.email || undefined,
      address: input.address ? { line1: input.address } : undefined,
      service: input.service || undefined,
      description: input.description || undefined,
      attribution: { landingUrl: 'https://coastpro.us/admin/calendar' },
    }),
  });

  const accepted = await acceptRequest(lead.leadId, {
    ...(input.scheduledStart ? { scheduledStart: input.scheduledStart } : {}),
    ...(input.scheduledEnd ? { scheduledEnd: input.scheduledEnd } : {}),
  });

  return { requestId: lead.leadId, jobId: accepted.jobId };
}

export async function getJob(id: string): Promise<{ job: JobDetail }> {
  return call(`/v1/jobs/${encodeURIComponent(id)}`);
}
