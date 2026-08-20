import { NextRequest, NextResponse } from 'next/server';
import {
  redirectUri,
  saveGoogleConnection,
  saveMetaConnection,
} from '@/lib/presence/credentials';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Where Google and Meta send the browser back, and where the useful part
 * happens.
 *
 * Both providers hand over a code that is worth very little on its own. What
 * this does with it is the reason the Connect button is better than pasting a
 * token into an env var:
 *
 *   Google — exchanges the code for a refresh token, then walks the account and
 *     location lists so nobody has to go hunting for a numeric location id in a
 *     dashboard that does not display it.
 *
 *   Meta — exchanges twice. The code buys a short-lived user token; that buys a
 *     long-lived one; and a Page token derived from a long-lived user token does
 *     not expire on a timer. Storing the first token would have meant
 *     reconnecting every couple of months, which is the problem this was
 *     supposed to solve.
 *
 * Failures come back to the screen as a readable message in the URL rather than
 * as JSON, because the person triggering this is looking at a browser tab.
 */

const STATE_COOKIE = 'cp_oauth_state';

function back(message: string, ok = false): NextResponse {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'https://coastpro.us').replace(/\/$/, '');
  const url = new URL(`${base}/admin/presence`);
  url.searchParams.set(ok ? 'connected' : 'error', message.slice(0, 300));
  const response = NextResponse.redirect(url);
  response.cookies.delete(STATE_COOKIE);
  return response;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  const provider = params.provider;
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const denied =
    request.nextUrl.searchParams.get('error') ??
    request.nextUrl.searchParams.get('error_description');

  if (denied) return back(`Consent was not given: ${denied}`);
  if (!code) return back('No code came back from the provider.');

  const expected = request.cookies.get(STATE_COOKIE)?.value;
  if (!expected || expected !== `${provider}:${state}`) {
    return back('That sign-in did not start here. Try Connect again from this page.');
  }

  try {
    if (provider === 'google') return await finishGoogle(code);
    if (provider === 'meta') return await finishMeta(code);
    return back('Unknown provider.');
  } catch (error) {
    return back(error instanceof Error ? error.message : String(error));
  }
}

// ---------------------------------------------------------------------------

async function finishGoogle(code: string): Promise<NextResponse> {
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GBP_CLIENT_ID ?? '',
      client_secret: process.env.GBP_CLIENT_SECRET ?? '',
      redirect_uri: redirectUri('google'),
      grant_type: 'authorization_code',
    }),
  });
  const token = (await tokenResponse.json()) as {
    refresh_token?: string;
    access_token?: string;
    error_description?: string;
  };

  if (!tokenResponse.ok || !token.access_token) {
    throw new Error(`Google refused the code: ${token.error_description ?? tokenResponse.status}`);
  }
  if (!token.refresh_token) {
    // Happens when this Google account has consented before and the previous
    // refresh token still exists somewhere. Revoking is the only way back.
    throw new Error(
      'Google returned no refresh token. Remove CoastPro from your Google account permissions and connect again.'
    );
  }

  const auth = { Authorization: `Bearer ${token.access_token}` };

  const accountsResponse = await fetch(
    'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
    { headers: auth }
  );
  if (!accountsResponse.ok) {
    const detail = await accountsResponse.text();
    if (accountsResponse.status === 403) {
      throw new Error(
        'Google accepted the sign-in but the Business Profile APIs are not enabled for this project yet — that access request has to be approved first.'
      );
    }
    throw new Error(`Could not list Business Profile accounts: ${detail.slice(0, 200)}`);
  }
  const accounts = (await accountsResponse.json()) as {
    accounts?: Array<{ name?: string; accountName?: string }>;
  };
  const account = accounts.accounts?.[0];
  if (!account?.name) throw new Error('That Google account manages no Business Profile.');

  const locationsResponse = await fetch(
    `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name,title&pageSize=20`,
    { headers: auth }
  );
  if (!locationsResponse.ok) {
    const detail = await locationsResponse.text();
    throw new Error(`Could not list locations: ${detail.slice(0, 200)}`);
  }
  const locations = (await locationsResponse.json()) as {
    locations?: Array<{ name?: string; title?: string }>;
  };
  const location = locations.locations?.[0];
  if (!location?.name) {
    throw new Error('That Business Profile has no locations yet — finish verifying it first.');
  }

  await saveGoogleConnection({
    refreshToken: token.refresh_token,
    locationId: location.name.startsWith('locations/') ? location.name : `locations/${location.name}`,
    accountName: account.accountName ?? account.name,
    locationName: location.title,
    connectedAt: new Date().toISOString(),
  });

  const extra =
    (locations.locations?.length ?? 0) > 1
      ? ` (first of ${locations.locations!.length} locations)`
      : '';
  return back(`Google Business Profile connected: ${location.title ?? location.name}${extra}`, true);
}

// ---------------------------------------------------------------------------

async function finishMeta(code: string): Promise<NextResponse> {
  const appId = process.env.META_APP_ID ?? '';
  const appSecret = process.env.META_APP_SECRET ?? '';

  const shortResponse = await fetch(
    `https://graph.facebook.com/v21.0/oauth/access_token?${new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: redirectUri('meta'),
      code,
    })}`
  );
  const short = (await shortResponse.json()) as {
    access_token?: string;
    error?: { message?: string };
  };
  if (!shortResponse.ok || !short.access_token) {
    throw new Error(`Meta refused the code: ${short.error?.message ?? shortResponse.status}`);
  }

  // Second exchange. Without it every Page token below inherits the sixty-day
  // clock of the short-lived user token it came from.
  const longResponse = await fetch(
    `https://graph.facebook.com/v21.0/oauth/access_token?${new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: short.access_token,
    })}`
  );
  const long = (await longResponse.json()) as {
    access_token?: string;
    error?: { message?: string };
  };
  if (!longResponse.ok || !long.access_token) {
    throw new Error(`Meta would not extend the token: ${long.error?.message ?? longResponse.status}`);
  }

  const pagesResponse = await fetch(
    `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token&access_token=${long.access_token}`
  );
  const pages = (await pagesResponse.json()) as {
    data?: Array<{ id?: string; name?: string; access_token?: string }>;
    error?: { message?: string };
  };
  if (!pagesResponse.ok) {
    throw new Error(`Could not list Pages: ${pages.error?.message ?? pagesResponse.status}`);
  }
  const page = pages.data?.find((p) => p.access_token && p.id);
  if (!page?.access_token || !page.id) {
    throw new Error(
      'That Meta account manages no Page this app can read. Instagram insights come through the Page the account is linked to.'
    );
  }

  // The Instagram professional account hangs off the Page rather than standing
  // on its own, which is why connecting Facebook is what reaches Instagram.
  let igUserId: string | undefined;
  let igUsername: string | undefined;
  try {
    const igResponse = await fetch(
      `https://graph.facebook.com/v21.0/${page.id}?fields=instagram_business_account{id,username}&access_token=${page.access_token}`
    );
    if (igResponse.ok) {
      const ig = (await igResponse.json()) as {
        instagram_business_account?: { id?: string; username?: string };
      };
      igUserId = ig.instagram_business_account?.id;
      igUsername = ig.instagram_business_account?.username;
    }
  } catch {
    // A Page with no Instagram attached is a normal state, not a failure.
  }

  await saveMetaConnection({
    pageToken: page.access_token,
    pageId: page.id,
    pageName: page.name,
    igUserId,
    igUsername,
    connectedAt: new Date().toISOString(),
  });

  const both = igUsername ? `${page.name} and @${igUsername}` : `${page.name} (no Instagram linked)`;
  return back(`Meta connected: ${both}`, true);
}
