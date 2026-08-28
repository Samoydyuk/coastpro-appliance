import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import {
  googleAppConfigured,
  metaAppConfigured,
  searchConsoleApp,
  searchConsoleAppConfigured,
  makeState,
  redirectUri,
} from '@/lib/presence/credentials';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Sends the browser off to Google or Meta to ask for consent.
 *
 * Behind the admin sign-in, so only somebody already inside the console can
 * start this. The `state` value goes out with the request and into a short
 * cookie at the same time; the callback refuses to do anything unless the two
 * still match, which is what stops a link in an email from connecting somebody
 * else's account to this console.
 */

const STATE_COOKIE = 'cp_oauth_state';

const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/business.manage';

/** Read-only: this console never needs to submit a sitemap or request indexing. */
const SEARCH_CONSOLE_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';

/**
 * Reading insights needs all five. `pages_show_list` finds the Page,
 * `pages_read_engagement` and `read_insights` read its numbers, and the two
 * instagram scopes reach the professional account attached to it.
 */
const META_SCOPE = [
  'pages_show_list',
  'pages_read_engagement',
  'read_insights',
  'instagram_basic',
  'instagram_manage_insights',
].join(',');

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  // This arrives as a top-level navigation, so an unauthenticated caller is
  // sent to sign in — a JSON 401 would render as a blank page of text.
  if ((await requireAdmin(request)) instanceof Response) {
    return NextResponse.redirect(new URL('/admin/login?next=/admin/presence', request.url));
  }

  const provider = params.provider;
  const state = makeState();

  let authorizeUrl: string;

  if (provider === 'google') {
    if (!googleAppConfigured()) {
      return NextResponse.json(
        {
          error:
            'No Google application registered. GBP_CLIENT_ID and GBP_CLIENT_SECRET identify the app itself and have to be set once before anyone can connect an account.',
        },
        { status: 400 }
      );
    }
    const query = new URLSearchParams({
      client_id: process.env.GBP_CLIENT_ID ?? '',
      redirect_uri: redirectUri('google'),
      response_type: 'code',
      scope: GOOGLE_SCOPE,
      // Offline plus a forced prompt, because Google only returns a refresh
      // token on the first consent — and this is exactly the flow somebody
      // runs a second time after the first token stopped working.
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true',
      state,
    });
    authorizeUrl = `https://accounts.google.com/o/oauth2/v2/auth?${query}`;
  } else if (provider === 'search-console') {
    if (!searchConsoleAppConfigured()) {
      return NextResponse.json(
        {
          error:
            'No Google application registered. Set GBP_CLIENT_ID and GBP_CLIENT_SECRET (or GSC_CLIENT_ID and GSC_CLIENT_SECRET) once, and both Google connections can use them.',
        },
        { status: 400 }
      );
    }
    const query = new URLSearchParams({
      client_id: searchConsoleApp().clientId,
      redirect_uri: redirectUri('search-console'),
      response_type: 'code',
      scope: SEARCH_CONSOLE_SCOPE,
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true',
      state,
    });
    authorizeUrl = `https://accounts.google.com/o/oauth2/v2/auth?${query}`;
  } else if (provider === 'meta') {
    if (!metaAppConfigured()) {
      return NextResponse.json(
        {
          error:
            'No Meta application registered. META_APP_ID and META_APP_SECRET identify the app itself and have to be set once before anyone can connect an account.',
        },
        { status: 400 }
      );
    }
    const query = new URLSearchParams({
      client_id: process.env.META_APP_ID ?? '',
      redirect_uri: redirectUri('meta'),
      response_type: 'code',
      scope: META_SCOPE,
      state,
    });
    authorizeUrl = `https://www.facebook.com/v21.0/dialog/oauth?${query}`;
  } else {
    return NextResponse.json({ error: 'Unknown provider' }, { status: 404 });
  }

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(STATE_COOKIE, `${provider}:${state}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 600,
  });
  return response;
}
