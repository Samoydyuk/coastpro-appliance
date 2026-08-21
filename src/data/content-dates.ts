/**
 * When each page's content last actually changed.
 *
 * The sitemap used to stamp every URL with `new Date()`, which meant all
 * thirty-five static entries claimed to have changed at the moment the crawler
 * asked — and claimed it again, with a new timestamp, on the next request. A
 * `lastmod` that moves every time it is read carries no information, and Google
 * stops reading it. That costs the one lever available for saying "this page,
 * specifically, is worth re-crawling now".
 *
 * So the dates are stated here instead, and they are true. Seeded from the last
 * commit that touched each route's source; the city entries are the day their
 * copy was rewritten.
 *
 * MAINTENANCE: when you meaningfully change a page's content, bump its date.
 * Not for a styling tweak or a typo — for a change a reader would notice. An
 * inflated `lastmod` decays into the same worthless signal as the timestamp it
 * replaced, just more slowly.
 *
 * Articles are exempt: they carry a real `updatedAt` in the database and the
 * sitemap reads it directly.
 */

/** Keyed by path, without the leading slash; the home page is ''. */
export const pageUpdated: Record<string, string> = {
  '': '2026-08-15',
  services: '2026-08-14',
  about: '2026-08-12',
  contact: '2026-08-12',
  faq: '2026-08-14',
  'service-areas': '2026-08-15',
  gallery: '2026-08-12',
  'book-appointment': '2026-08-14',
  blog: '2026-08-14',
  'same-day': '2026-08-21',
  sitemap: '2026-08-21',
  brands: '2026-08-18',
  'error-codes': '2026-08-18',
  privacy: '2026-08-13',
  terms: '2026-08-14',
};

/**
 * Brand detail pages, keyed by slug.
 *
 * This was one date for all six pages, which was true on the day they were
 * written and stopped being true the moment a second batch went up: adding nine
 * mainstream brands under a shared constant would have claimed Sub-Zero changed
 * as well. It did not. One date per page, and they are each the day that page's
 * copy was actually written.
 */
export const brandUpdated: Record<string, string> = {
  'sub-zero': '2026-08-15',
  wolf: '2026-08-15',
  viking: '2026-08-15',
  thermador: '2026-08-15',
  miele: '2026-08-15',
  bosch: '2026-08-15',
  samsung: '2026-08-18',
  whirlpool: '2026-08-18',
  ge: '2026-08-18',
  lg: '2026-08-18',
  maytag: '2026-08-18',
  kitchenaid: '2026-08-18',
  frigidaire: '2026-08-18',
  electrolux: '2026-08-18',
  kenmore: '2026-08-18',
};

/** Error code pages, keyed by brand slug. */
export const errorCodesUpdated: Record<string, string> = {
  samsung: '2026-08-18',
  lg: '2026-08-18',
  whirlpool: '2026-08-18',
  ge: '2026-08-18',
  maytag: '2026-08-18',
  kitchenaid: '2026-08-18',
  frigidaire: '2026-08-18',
  electrolux: '2026-08-18',
  bosch: '2026-08-18',
  kenmore: '2026-08-18',
};

/** Service detail pages, keyed by slug. */
export const serviceUpdated: Record<string, string> = {
  refrigerator: '2026-08-14',
  washer: '2026-08-14',
  dryer: '2026-08-14',
  dishwasher: '2026-08-14',
  'oven-range': '2026-08-14',
  microwave: '2026-08-14',
  'garbage-disposal': '2026-08-14',
  'dryer-vent-cleaning': '2026-08-14',
  freezer: '2026-08-21',
};

/** The day the local copy for every city page was rewritten. */
export const CITY_CONTENT_UPDATED = '2026-08-15';

/** Anything not listed falls back to this rather than to "now". */
const FALLBACK = '2026-08-14';

export function updatedAt(date: string | undefined): Date {
  return new Date(`${date ?? FALLBACK}T12:00:00Z`);
}

/**
 * Brand × appliance pages. One date for the batch, which is honest while they
 * were all written in one sitting — split it the moment they stop moving
 * together, as the brand pages had to be.
 */
export const BRAND_APPLIANCE_UPDATED = '2026-08-20';

/** Service × city intersections. One date while they were written together. */
export const SERVICE_CITY_UPDATED = '2026-08-21';
