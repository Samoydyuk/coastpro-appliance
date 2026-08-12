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

/** Two years — the window in which a repeat customer is still the same person. */
export const VISITOR_MAX_AGE = 60 * 60 * 24 * 730;
/** Thirty minutes of inactivity ends a visit, matching what ad platforms do. */
export const SESSION_MAX_AGE = 60 * 30;
/** Admin stays signed in for a working week. */
export const ADMIN_MAX_AGE = 60 * 60 * 24 * 7;

export function newId(): string {
  return crypto.randomUUID().replace(/-/g, '');
}
