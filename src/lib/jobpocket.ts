/**
 * Server-side client for the JobPocket booking API.
 *
 * Everything here runs on the server. The integration key identifies this
 * business to JobPocket and can create work on its calendar, so it must never
 * reach the browser — the form talks to our own /api/booking routes, and those
 * talk to JobPocket.
 */

const BASE = process.env.JOBPOCKET_API_BASE || 'https://portal.jobpocket.app';
const SLUG = process.env.JOBPOCKET_BOOKING_SLUG || 'coastpro';

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

/** The service list shown in the form, straight from JobPocket. */
export async function getServices(): Promise<BookingService[]> {
  const res = await fetch(`${BASE}/book/${SLUG}/services`, {
    // The list changes when the owner edits it in the app, not per request.
    next: { revalidate: 300 },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { services?: BookingService[] };
  return data.services ?? [];
}

/** Arrival windows still open on a given day, for a given service. */
export async function getWindows(date: string, serviceId?: string): Promise<ArrivalWindow[]> {
  const url = new URL(`${BASE}/book/${SLUG}/slots`);
  url.searchParams.set('date', date);
  if (serviceId) url.searchParams.set('serviceId', serviceId);

  // Availability is the one thing that must never be cached.
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return [];
  const data = (await res.json()) as { windows?: ArrivalWindow[]; slots?: ArrivalWindow[] };
  return data.windows ?? data.slots ?? [];
}

/** Google address suggestions, proxied so we need no Google key of our own. */
export async function getAddressSuggestions(input: string): Promise<string[]> {
  if (input.trim().length < 4) return [];
  const url = new URL(`${BASE}/book/${SLUG}/address-autocomplete`);
  url.searchParams.set('input', input);

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return [];
  const data = (await res.json()) as { predictions?: Array<{ description: string }> };
  return (data.predictions ?? []).map((p) => p.description);
}

export interface LeadInput {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  serviceId?: string;
  serviceName?: string;
  brand?: string;
  problem?: string;
  windowStartISO?: string;
  windowEndISO?: string;
  /** Ours, so a retried submit does not become a second request. */
  externalId: string;
  landingUrl?: string;
}

export type LeadResult =
  | { ok: true; duplicate: boolean }
  | { ok: false; error: string };

/** Hand a booking to JobPocket as a lead. */
export async function createLead(input: LeadInput): Promise<LeadResult> {
  const key = process.env.JOBPOCKET_API_KEY;
  if (!key) {
    console.error('Booking: JOBPOCKET_API_KEY is not set — the request was not delivered.', {
      phone: input.phone,
      at: new Date().toISOString(),
    });
    return { ok: false, error: 'unconfigured' };
  }

  const res = await fetch(`${BASE}/v1/leads`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      externalId: input.externalId,
      name: input.name,
      phone: input.phone,
      email: input.email || undefined,
      // One line in, one line out — JobPocket keeps the parts separately but
      // does not require us to split what the customer typed.
      address: input.address ? { line1: input.address } : undefined,
      service: input.serviceName || undefined,
      description: input.problem || undefined,
      appliance: input.brand ? { brand: input.brand } : undefined,
      preferredStart: input.windowStartISO || undefined,
      preferredEnd: input.windowEndISO || undefined,
      attribution: { landingUrl: input.landingUrl },
    }),
  });

  if (res.ok) {
    const data = (await res.json().catch(() => ({}))) as { duplicate?: boolean };
    return { ok: true, duplicate: Boolean(data.duplicate) };
  }

  const body = await res.text();
  console.error('Booking: JobPocket rejected the lead', res.status, body.slice(0, 300));
  return { ok: false, error: `upstream_${res.status}` };
}
