import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { readAdminToken } from '@/lib/admin-token';
import { ADMIN_COOKIE } from '@/lib/cookies';

/**
 * A second lock on the admin API.
 *
 * `src/middleware.ts` already rejects an unauthenticated request before any of
 * these handlers run, and for a long time that was the only check anywhere —
 * every route under `/api/admin` trusted it completely.
 *
 * That is one edit away from a bad afternoon. The middleware's `matcher` is a
 * list of path patterns; adding an exclusion for static files, or moving a route,
 * or a future framework change to how matchers resolve, silently opens every
 * route behind it at once. There is no error, no test failure — just an open
 * door, and the data behind these particular routes is customers' names,
 * addresses and phone numbers.
 *
 * So each handler checks for itself. The cost is one HMAC verification per
 * request; the benefit is that no single mistake is enough.
 */

export interface AdminIdentity {
  sub: string;
}

/**
 * Reads one cookie off the raw header.
 *
 * Deliberately not `NextRequest.cookies`: the handlers under `/api/admin` are
 * split between `NextRequest` and plain `Request`, and a guard that only fits
 * half of them is a guard somebody skips.
 */
function cookieValue(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) {
      return decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return null;
}

/**
 * Returns the caller, or a 401 response to hand straight back.
 *
 *   const auth = await requireAdmin(request);
 *   if (auth instanceof Response) return auth;
 */
export async function requireAdmin(
  request: Request
): Promise<AdminIdentity | NextResponse> {
  const token = cookieValue(request.headers.get('cookie'), ADMIN_COOKIE);
  const claims = token ? await readAdminToken(token) : null;

  if (!claims) {
    return NextResponse.json(
      { error: 'Not signed in' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  return { sub: claims.sub };
}

/**
 * The signed-in admin, for a server component that has no `Request`.
 *
 * Pages under `/admin` render for anyone who asks — the sign-in page most of
 * all — so anything the layout puts on the page is public until this says
 * otherwise. Returns null rather than redirecting: the middleware owns where an
 * unauthenticated visitor goes, and two opinions about that is one too many.
 */
export async function currentAdmin(): Promise<AdminIdentity | null> {
  const token = cookies().get(ADMIN_COOKIE)?.value ?? null;
  const claims = token ? await readAdminToken(token) : null;
  return claims ? { sub: claims.sub } : null;
}

/**
 * Admin responses carry customer data, so nothing may keep a copy: not the
 * browser's back-forward cache, not a proxy, not Vercel's edge.
 */
export function adminJson(body: unknown, init?: ResponseInit): NextResponse {
  const response = NextResponse.json(body, init);
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  return response;
}
