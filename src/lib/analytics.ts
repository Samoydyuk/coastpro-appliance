'use client';

import { CHANNEL_COOKIE, SESSION_MAX_AGE } from '@/lib/cookies';
import { readAttribution } from '@/lib/attribution';
import type { EventType } from '@/lib/tracking';

/**
 * Client half of the first-party analytics.
 *
 * Events are queued and flushed in batches rather than sent one at a time: a
 * visitor scrolling a service page generates a dozen signals in a few seconds,
 * and a dozen separate requests would cost them bandwidth and us function
 * invocations for no extra information.
 */

interface QueuedEvent {
  type: EventType;
  path?: string;
  label?: string;
  value?: number;
  meta?: Record<string, unknown>;
}

interface QueuedVital {
  metric: string;
  value: number;
  rating?: string;
  path?: string;
}

const ENDPOINT = '/api/track';
const FLUSH_INTERVAL = 10_000;

let queue: QueuedEvent[] = [];
let vitals: QueuedVital[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

function currentPath(): string {
  if (typeof window === 'undefined') return '/';
  return window.location.pathname;
}

export function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]!) : null;
}

function writeCookie(name: string, value: string, maxAge: number) {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
}

/**
 * The channel this visit belongs to, worked out in the browser so the phone
 * number can be swapped before the first request comes back. Same resolver the
 * server uses, so the two never disagree.
 */
export function resolveVisitChannel(): string {
  if (typeof window === 'undefined') return 'direct';
  const stored = readCookie(CHANNEL_COOKIE);
  const attribution = readAttribution(
    window.location.href,
    document.referrer || null,
    window.location.hostname
  );
  if (attribution.channel === 'internal' || (attribution.channel === 'direct' && stored)) {
    return stored ?? attribution.channel;
  }
  writeCookie(CHANNEL_COOKIE, attribution.channel, SESSION_MAX_AGE);
  return attribution.channel;
}

function schedule() {
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    flush();
  }, FLUSH_INTERVAL);
}

export function flush(useBeacon = false) {
  if (typeof window === 'undefined') return;
  if (!queue.length && !vitals.length) return;

  const body = JSON.stringify({
    events: queue,
    vitals,
    url: window.location.href,
    referrer: document.referrer || null,
    viewport: window.innerWidth,
    screen: window.screen?.width ?? null,
    language: navigator.language,
  });

  queue = [];
  vitals = [];
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }

  // On the way out only sendBeacon survives — a fetch started during
  // `pagehide` is cancelled the moment the document is torn down, which is
  // exactly when the exit event we care most about is generated.
  if (useBeacon && navigator.sendBeacon) {
    navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }));
    return;
  }

  fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
    credentials: 'same-origin',
  }).catch(() => {
    /* analytics must never surface an error to a visitor */
  });
}

export function track(type: EventType, detail: Omit<QueuedEvent, 'type'> = {}) {
  if (typeof window === 'undefined') return;
  queue.push({ path: currentPath(), ...detail, type });

  // Anything that represents a person asking us for work goes out immediately —
  // a lead that arrives ten seconds late is a lead that can be lost to a
  // closed tab.
  if (type === 'form_submit' || type === 'click_phone' || type === 'calendly_booked') {
    flush();
    return;
  }
  if (queue.length >= 20) {
    flush();
    return;
  }
  schedule();
}

export function trackVital(vital: QueuedVital) {
  vitals.push({ path: currentPath(), ...vital });
  schedule();
}
