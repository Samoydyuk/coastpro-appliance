import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_COOKIE,
  INTERNAL_COOKIE,
  INTERNAL_MAX_AGE,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  VISITOR_COOKIE,
  VISITOR_MAX_AGE,
  newId,
} from '@/lib/cookies';
import { verifyAdminToken } from '@/lib/admin-token';

/**
 * Two jobs, both of which have to happen before a page renders:
 *
 * 1. Make sure every visitor carries a visitor id and a session id. The session
 *    cookie's own expiry defines the visit — it is re-issued with a fresh
 *    thirty minutes on each request, so it lapses exactly when the visitor goes
 *    quiet, and the next page they open starts a new session by itself.
 * 2. Keep the admin panel behind its sign-in.
 *
 * These are first-party cookies set by our own domain, so they survive Safari's
 * cap on script-written storage in a way `document.cookie` does not.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    return guardAdmin(request);
  }

  // API routes read the cookies but never need them issued — the visitor got
  // them on the page that made the call. Skipping keeps Set-Cookie off those
  // responses.
  if (pathname.startsWith('/api/')) return NextResponse.next();

  const response = NextResponse.next();

  // /?cp_internal=1 marks this browser as ours; /?cp_internal=0 unmarks it.
  // Handled here rather than in the tracker because it has to survive a visit
  // that never runs the client script.
  const internalFlag = request.nextUrl.searchParams.get('cp_internal');
  if (internalFlag === '1' || internalFlag === '0') {
    response.cookies.set(INTERNAL_COOKIE, internalFlag === '1' ? '1' : '', {
      maxAge: internalFlag === '1' ? INTERNAL_MAX_AGE : 0,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false,
    });
  }

  const visitorId = request.cookies.get(VISITOR_COOKIE)?.value;
  const sessionId = request.cookies.get(SESSION_COOKIE)?.value;

  if (!visitorId || !/^[a-f0-9]{32}$/.test(visitorId)) {
    response.cookies.set(VISITOR_COOKIE, newId(), {
      maxAge: VISITOR_MAX_AGE,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false,
    });
  } else {
    // Refresh so an active visitor never ages out mid-relationship.
    response.cookies.set(VISITOR_COOKIE, visitorId, {
      maxAge: VISITOR_MAX_AGE,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false,
    });
  }

  const nextSessionId = sessionId && /^[a-f0-9]{32}$/.test(sessionId) ? sessionId : newId();
  response.cookies.set(SESSION_COOKIE, nextSessionId, {
    maxAge: SESSION_MAX_AGE,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false,
  });

  return response;
}

async function guardAdmin(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The sign-in page and the endpoint that processes it have to stay open, or
  // there is no way in.
  if (pathname === '/admin/login' || pathname === '/api/admin/login') {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  const valid = token ? await verifyAdminToken(token) : false;
  if (valid) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  const url = request.nextUrl.clone();
  url.pathname = '/admin/login';
  url.search = pathname === '/admin' ? '' : `?next=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Everything except Next's own assets and files with an extension: cookies on
  // an image request would be wasted work, and a session must not be started by
  // a favicon fetch.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images/|.*\\.[\\w]+$).*)'],
};
