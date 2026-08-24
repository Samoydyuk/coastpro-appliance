import { NextRequest, NextResponse } from 'next/server';
import { INTERNAL_COOKIE } from '@/lib/cookies';
import { db, quietly } from '@/lib/db';
import { readAttribution } from '@/lib/attribution';
import {
  CHANNEL_COOKIE,
  EVENT_TYPES,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  VISITOR_COOKIE,
  clientIp,
  detectBot,
  hashIp,
  parseUserAgent,
  readGeo,
  type EventType,
} from '@/lib/tracking';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The site's own analytics collector.
 *
 * It lives on coastpro.us rather than on an analytics vendor's domain, which is
 * the entire point: content blockers and Safari's tracking protection remove a
 * fifth to a third of the traffic from Google Analytics, and that missing third
 * is not random — it skews young, mobile and technical. Numbers that decide
 * where ad money goes should not have a hole in them.
 *
 * Nothing in here is allowed to fail loudly. A visitor never sees an error
 * because a write went wrong; the endpoint answers 204 either way.
 */

const MAX_EVENTS_PER_REQUEST = 40;

interface IncomingEvent {
  type: string;
  path?: string;
  label?: string;
  value?: number;
  meta?: Record<string, unknown>;
}

interface IncomingVital {
  metric: string;
  value: number;
  rating?: string;
  path?: string;
}

interface Payload {
  events?: IncomingEvent[];
  vitals?: IncomingVital[];
  url?: string;
  referrer?: string;
  viewport?: number;
  screen?: number;
  language?: string;
}

const noContent = () => new NextResponse(null, { status: 204 });

export async function POST(request: NextRequest) {
  const sql = db();
  if (!sql) return noContent();

  const visitorId = request.cookies.get(VISITOR_COOKIE)?.value;
  const sessionId = request.cookies.get(SESSION_COOKIE)?.value;
  if (!visitorId || !sessionId || !/^[a-f0-9]{32}$/.test(visitorId) || !/^[a-f0-9]{32}$/.test(sessionId)) {
    return noContent();
  }

  const userAgent = request.headers.get('user-agent');
  const bot = detectBot(userAgent);
  // Not a bot — one of ours. Set by /?cp_internal=1, read here so the session
  // carries it for every page of the visit.
  const isInternal = request.cookies.get(INTERNAL_COOKIE)?.value === '1';

  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return noContent();
  }

  const events = (payload.events ?? [])
    .filter((event) => EVENT_TYPES.includes(event.type as EventType))
    .slice(0, MAX_EVENTS_PER_REQUEST);
  const vitals = (payload.vitals ?? []).slice(0, 10);

  if (!events.length && !vitals.length) return noContent();

  const host = request.headers.get('host')?.split(':')[0] ?? null;
  const attribution = readAttribution(
    payload.url || `https://${host ?? 'coastpro.us'}/`,
    payload.referrer || null,
    host
  );
  const device = parseUserAgent(userAgent);
  const geo = readGeo(request.headers);

  const response = noContent();

  await quietly(async () => {
    // A session row appears the first time we hear from a session id. Losing
    // the race with a second tab is fine — `do nothing` means the first one
    // wins and its landing page is the one we keep.
    const created = await sql`
      insert into sessions (
        id, visitor_id, channel, source, medium, campaign, content, term,
        click_id, click_id_type, gclid, gbraid, wbraid, fbclid, msclkid, ttclid, li_fat_id,
        referrer, referrer_domain, landing_path, landing_query,
        device, os, browser, viewport_w, screen_w, language,
        country, region, city, postal_code, latitude, longitude, timezone,
        ip_hash, user_agent, is_bot, bot_reason, is_internal
      ) values (
        ${sessionId}, ${visitorId}, ${attribution.channel}, ${attribution.source},
        ${attribution.medium}, ${attribution.campaign}, ${attribution.content}, ${attribution.term},
        ${attribution.clickId}, ${attribution.clickIdType},
        ${attribution.clickIds.gclid ?? null}, ${attribution.clickIds.gbraid ?? null},
        ${attribution.clickIds.wbraid ?? null}, ${attribution.clickIds.fbclid ?? null},
        ${attribution.clickIds.msclkid ?? null}, ${attribution.clickIds.ttclid ?? null},
        ${attribution.clickIds.li_fat_id ?? null},
        ${attribution.referrer}, ${attribution.referrerDomain},
        ${attribution.landingPath}, ${attribution.landingQuery},
        ${device.device}, ${device.os}, ${device.browser},
        ${payload.viewport ?? null}, ${payload.screen ?? null}, ${payload.language ?? null},
        ${geo.country}, ${geo.region}, ${geo.city}, ${geo.postalCode},
        ${geo.latitude}, ${geo.longitude}, ${geo.timezone},
        ${hashIp(clientIp(request.headers))}, ${userAgent?.slice(0, 400) ?? null},
        ${bot.isBot}, ${bot.reason}, ${isInternal}
      )
      on conflict (id) do nothing
      returning id
    `;

    const isNewSession = created.length > 0;

    if (isNewSession) {
      // A visit that lands on an internal link — the session cookie lapsed
      // while the visitor sat on a page, then they clicked through — would
      // otherwise be filed as its own "internal" channel and quietly steal
      // credit from the ad that brought them. Carry the previous channel over.
      if (attribution.channel === 'internal') {
        await sql`
          update sessions s set
            channel = prev.channel, source = prev.source, medium = prev.medium,
            campaign = prev.campaign, content = prev.content, term = prev.term
          from (
            select channel, source, medium, campaign, content, term
            from sessions
            where visitor_id = ${visitorId} and id <> ${sessionId} and channel <> 'internal'
            order by started_at desc limit 1
          ) prev
          where s.id = ${sessionId}
        `;
      }

      await sql`
        insert into visitors (
          id, is_bot, ft_channel, ft_source, ft_medium, ft_campaign, ft_content, ft_term,
          ft_click_id, ft_click_id_type, ft_landing_path, ft_referrer, ft_at
        ) values (
          ${visitorId}, ${bot.isBot}, ${attribution.channel}, ${attribution.source},
          ${attribution.medium}, ${attribution.campaign}, ${attribution.content}, ${attribution.term},
          ${attribution.clickId}, ${attribution.clickIdType},
          ${attribution.landingPath}, ${attribution.referrer}, now()
        )
        on conflict (id) do update set
          last_seen_at = now(),
          sessions_count = visitors.sessions_count + 1
      `;
    }

    if (events.length) {
      const rows = events.map((event) => ({
        session_id: sessionId,
        visitor_id: visitorId,
        type: event.type,
        path: typeof event.path === 'string' ? event.path.slice(0, 300) : null,
        label: typeof event.label === 'string' ? event.label.slice(0, 200) : null,
        value: Number.isFinite(event.value) ? event.value! : null,
        // Wrapped so the driver sends it as jsonb rather than trying to infer a
        // column type from a plain object.
        meta:
          event.meta && typeof event.meta === 'object'
            ? sql.json(event.meta as Record<string, never>)
            : null,
      }));
      await sql`insert into events ${sql(rows, 'session_id', 'visitor_id', 'type', 'path', 'label', 'value', 'meta')}`;

      const pageviews = events.filter((event) => event.type === 'pageview').length;
      const engagement = events
        .filter((event) => event.type === 'engagement')
        .reduce((total, event) => total + (Number(event.value) || 0), 0);
      const scroll = events
        .filter((event) => event.type === 'scroll')
        .reduce((deepest, event) => Math.max(deepest, Number(event.value) || 0), 0);
      const converting = events.some((event) =>
        ['click_phone', 'form_submit', 'calendly_booked'].includes(event.type)
      );

      await sql`
        update sessions set
          last_seen_at    = now(),
          pageviews       = pageviews + ${pageviews},
          event_count     = event_count + ${events.length},
          engaged_seconds = engaged_seconds + ${Math.round(engagement)},
          max_scroll      = greatest(max_scroll, ${Math.round(scroll)}),
          converted       = converted or ${converting}
        where id = ${sessionId}
      `;
      await sql`update visitors set last_seen_at = now() where id = ${visitorId}`;
    }

    if (vitals.length) {
      const rows = vitals
        .filter((vital) => typeof vital.metric === 'string' && Number.isFinite(vital.value))
        .map((vital) => ({
          session_id: sessionId,
          path: (vital.path ?? attribution.landingPath).slice(0, 300),
          metric: vital.metric.slice(0, 20),
          value: vital.value,
          rating: vital.rating?.slice(0, 20) ?? null,
          device: device.device,
        }));
      if (rows.length) {
        await sql`insert into web_vitals ${sql(rows, 'session_id', 'path', 'metric', 'value', 'rating', 'device')}`;
      }
    }
  });

  // The phone-number swap reads this on the client, and re-writing it here
  // keeps it alive for as long as the visit is. An internal hop carries no
  // attribution of its own, so it must never overwrite what the landing page
  // established — that would hand every second pageview to "direct".
  const knownChannel = request.cookies.get(CHANNEL_COOKIE)?.value;
  const channelCookie =
    knownChannel && (attribution.channel === 'internal' || attribution.channel === 'direct')
      ? knownChannel
      : attribution.channel;

  response.cookies.set(CHANNEL_COOKIE, channelCookie, {
    maxAge: SESSION_MAX_AGE,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false,
  });

  return response;
}
