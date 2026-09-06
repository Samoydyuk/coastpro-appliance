/**
 * Cookie names and identifier generation, kept free of Node built-ins so the
 * Edge middleware can import them. `tracking.ts` re-exports everything here, so
 * server code has a single place to import from.
 */

export const VISITOR_COOKIE = 'cp_vid';
export const SESSION_COOKIE = 'cp_sid';
/** Set alongside the session so the number-swap script knows the channel. */
export const CHANNEL_COOKIE = 'cp_ch';
/** The admin panel's own session. */
export const ADMIN_COOKIE = 'cp_admin';
/** A customer who has proved their phone number, for /my. */
export const CUSTOMER_COOKIE = 'cp_customer';

/**
 * Marks a browser as the business's own.
 *
 * Set by visiting /?cp_internal=1 and cleared with /?cp_internal=0. Deliberately
 * a cookie rather than an IP list: the owner checks the site from a phone on
 * cellular as often as from the office, and an IP rule would miss exactly the
 * visits that matter most — the ones right after a deploy.
 *
 * Why this exists at all: over thirty days the console recorded 88 visits, 72
 * of them direct, with an 88.6% engagement rate. That is not a cold audience,
 * it is the owner reloading the site after each deploy — and it was burying
 * the sixteen real external visits underneath itself.
 */
export const INTERNAL_COOKIE = 'cp_internal';

/** Two years, like the visitor id. Set once and forget it. */
export const INTERNAL_MAX_AGE = 60 * 60 * 24 * 730;

/** Two years — the window in which a repeat customer is still the same person. */
export const VISITOR_MAX_AGE = 60 * 60 * 24 * 730;
/** Thirty minutes of inactivity ends a visit, matching what ad platforms do. */
export const SESSION_MAX_AGE = 60 * 30;
/**
 * A day. It used to be a working week, which was a fair trade when the console
 * held visit counts. It now shows customers' names, addresses and the week's
 * schedule, and a week-long session is a week in which a borrowed or forgotten
 * laptop is still signed in.
 */
export const ADMIN_MAX_AGE = 60 * 60 * 24;

/**
 * Thirty days for a customer, where an admin gets one.
 *
 * The asymmetry is not carelessness. The admin cookie opens the schedule, the
 * customer book and the money; this one opens one household's own repair
 * history, to that household. Making somebody re-prove their phone number every
 * day to check whether their own warranty has run out would mean nobody checks,
 * and the cost of getting back in is a text message.
 */
export const CUSTOMER_MAX_AGE = 60 * 60 * 24 * 30;

export function newId(): string {
  return crypto.randomUUID().replace(/-/g, '');
}
