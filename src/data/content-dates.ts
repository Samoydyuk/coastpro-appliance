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
  brands: '2026-08-15',
  privacy: '2026-08-13',
  terms: '2026-08-14',
};

/** The day the brand pages were written. */
export const BRAND_CONTENT_UPDATED = '2026-08-15';

/** Service detail pages, keyed by slug. */
export const serviceUpdated: Record<string, string> = {
  refrigerator: '2026-08-14',
  washer: '2026-08-14',
  dryer: '2026-08-14',
  dishwasher: '2026-08-14',
  'oven-range': '2026-08-14',
  microwave: '2026-08-14',
  'garbage-disposal': '2026-08-14',
  'ice-maker': '2026-08-14',
  'dryer-vent-cleaning': '2026-08-14',
};

/** The day the local copy for every city page was rewritten. */
export const CITY_CONTENT_UPDATED = '2026-08-15';

/** Anything not listed falls back to this rather than to "now". */
const FALLBACK = '2026-08-14';

export function updatedAt(date: string | undefined): Date {
  return new Date(`${date ?? FALLBACK}T12:00:00Z`);
}
