import { createHash } from 'crypto';

/**
 * Server-side plumbing for first-party analytics: identifiers, the visitor and
 * session cookies, bot filtering, device parsing and the geo headers Vercel
 * puts on every request.
 */

export {
  VISITOR_COOKIE,
  SESSION_COOKIE,
  CHANNEL_COOKIE,
  ADMIN_COOKIE,
  VISITOR_MAX_AGE,
  SESSION_MAX_AGE,
  ADMIN_MAX_AGE,
  newId,
} from './cookies';

/**
 * Visitor addresses are personal data we have no reason to keep. Hashing with a
 * server-side salt still lets us count unique visitors and spot one address
 * hammering the form, without storing anyone's address.
 */
export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const salt = process.env.ANALYTICS_IP_SALT || 'coastpro-local-salt';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32);
}

export function clientIp(headers: Headers): string | null {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim();
  return headers.get('x-real-ip');
}

export interface Geo {
  country: string | null;
  region: string | null;
  city: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
}

function decode(value: string | null): string | null {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Vercel resolves the address at the edge and hands us the result. */
export function readGeo(headers: Headers): Geo {
  const lat = headers.get('x-vercel-ip-latitude');
  const lon = headers.get('x-vercel-ip-longitude');
  return {
    country: headers.get('x-vercel-ip-country'),
    region: headers.get('x-vercel-ip-country-region'),
    city: decode(headers.get('x-vercel-ip-city')),
    postalCode: headers.get('x-vercel-ip-postal-code'),
    latitude: lat ? Number(lat) : null,
    longitude: lon ? Number(lon) : null,
    timezone: headers.get('x-vercel-ip-timezone'),
  };
}

/**
 * Anything matching this is a crawler, an uptime check or a scraper. Keeping
 * them out matters more than usual here: a bot that visits every service page
 * every hour would otherwise sit at the top of the "most viewed pages" report
 * and quietly ruin the bounce rate for every real channel.
 */
const BOT_PATTERN =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegram|preview|monitor|uptime|pingdom|lighthouse|pagespeed|gtmetrix|headless|phantom|puppeteer|playwright|selenium|curl|wget|python-requests|axios|node-fetch|go-http|java\/|scrapy|ahrefs|semrush|mj12|dotbot|petalbot|yandex|baidu|applebot|duckduckbot|gptbot|claudebot|ccbot|perplexity|bytespider/i;

export function detectBot(userAgent: string | null): { isBot: boolean; reason: string | null } {
  if (!userAgent) return { isBot: true, reason: 'no user agent' };
  if (userAgent.length < 15) return { isBot: true, reason: 'stub user agent' };
  const match = userAgent.match(BOT_PATTERN);
  if (match) return { isBot: true, reason: match[0].toLowerCase() };
  return { isBot: false, reason: null };
}

export interface DeviceInfo {
  device: 'mobile' | 'tablet' | 'desktop';
  os: string;
  browser: string;
}

export function parseUserAgent(userAgent: string | null): DeviceInfo {
  const ua = userAgent || '';

  const device: DeviceInfo['device'] = /iPad|Tablet|Nexus 7|SM-T/i.test(ua)
    ? 'tablet'
    : /Mobi|Android|iPhone|iPod|Windows Phone/i.test(ua)
      ? 'mobile'
      : 'desktop';

  const os = /iPhone|iPad|iPod/i.test(ua)
    ? 'iOS'
    : /Android/i.test(ua)
      ? 'Android'
      : /Mac OS X|Macintosh/i.test(ua)
        ? 'macOS'
        : /Windows/i.test(ua)
          ? 'Windows'
          : /Linux/i.test(ua)
            ? 'Linux'
            : 'Other';

  // Order matters — Edge and Chrome both claim to be Safari, and Chrome claims
  // to be Safari too, so the most specific token has to be tested first.
  const browser = /Edg\//i.test(ua)
    ? 'Edge'
    : /OPR\/|Opera/i.test(ua)
      ? 'Opera'
      : /SamsungBrowser/i.test(ua)
        ? 'Samsung Internet'
        : /FBAN|FBAV|Instagram/i.test(ua)
          ? 'In-app (Meta)'
          : /CriOS|Chrome\//i.test(ua)
            ? 'Chrome'
            : /FxiOS|Firefox/i.test(ua)
              ? 'Firefox'
              : /Safari\//i.test(ua)
                ? 'Safari'
                : 'Other';

  return { device, os, browser };
}

/** US numbers to E.164, so a call from the carrier matches a typed number. */
export function toE164(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (phone.trim().startsWith('+') && digits.length >= 8) return `+${digits}`;
  return null;
}

/** The event names the ingest endpoint accepts. Anything else is dropped. */
export const EVENT_TYPES = [
  'pageview',
  'engagement',
  'scroll',
  'click_phone',
  'click_cta',
  'click_email',
  'outbound',
  'form_start',
  'form_field',
  'form_step',
  'form_submit',
  'form_error',
  'calendly_view',
  'calendly_booked',
  'rage_click',
  'js_error',
  'exit',
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

/** Events that mean the visitor asked us to do something. */
export const CONVERSION_EVENTS: EventType[] = ['click_phone', 'form_submit', 'calendly_booked'];
