'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { flush, resolveVisitChannel, track, trackVital } from '@/lib/analytics';

/**
 * Mounted once in the root layout. Everything a visitor does that we can read
 * without asking them anything is collected here.
 *
 * Deliberately *not* using `useSearchParams`: reading it in a client component
 * forces every page that renders this into dynamic rendering, and the query
 * string is available from `window.location` anyway.
 */

const SCROLL_MILESTONES = [25, 50, 75, 90];
const HEARTBEAT_MS = 15_000;
/** Someone who has not touched the page in this long is not reading it. */
const IDLE_MS = 30_000;

export function Tracker() {
  const pathname = usePathname();
  const activeSeconds = useRef(0);
  const lastActivity = useRef(Date.now());
  const reachedMilestones = useRef<Set<number>>(new Set());

  // Page views — one per route change, plus the first render.
  useEffect(() => {
    resolveVisitChannel();
    reachedMilestones.current = new Set();
    track('pageview', {
      path: pathname,
      label: document.title.slice(0, 200),
      meta: { query: window.location.search.slice(1, 500) || null },
    });
  }, [pathname]);

  // Engagement: only time the visitor is actually present is counted. A tab
  // left open overnight would otherwise report the best session we ever had.
  useEffect(() => {
    const markActive = () => {
      lastActivity.current = Date.now();
    };
    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll', 'mousemove'] as const;
    activityEvents.forEach((event) =>
      window.addEventListener(event, markActive, { passive: true })
    );

    const heartbeat = setInterval(() => {
      const idle = Date.now() - lastActivity.current > IDLE_MS;
      if (document.visibilityState !== 'visible' || idle) return;
      activeSeconds.current += HEARTBEAT_MS / 1000;
      track('engagement', { value: HEARTBEAT_MS / 1000 });
    }, HEARTBEAT_MS);

    return () => {
      clearInterval(heartbeat);
      activityEvents.forEach((event) => window.removeEventListener(event, markActive));
    };
  }, []);

  // Scroll depth.
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const depth = Math.round(((window.scrollY || doc.scrollTop) / scrollable) * 100);
      for (const milestone of SCROLL_MILESTONES) {
        if (depth >= milestone && !reachedMilestones.current.has(milestone)) {
          reachedMilestones.current.add(milestone);
          track('scroll', { value: milestone });
        }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Clicks: phone, email, calls to action and links off the site.
  useEffect(() => {
    const recentClicks: { x: number; y: number; at: number }[] = [];

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      // Rage clicks — three hits on the same spot means something looked
      // clickable and was not, and that is a page worth fixing before paying
      // for clicks to it.
      const now = Date.now();
      recentClicks.push({ x: event.clientX, y: event.clientY, at: now });
      while (recentClicks.length && now - recentClicks[0]!.at > 1200) recentClicks.shift();
      if (recentClicks.length >= 3) {
        const first = recentClicks[0]!;
        const clustered = recentClicks.every(
          (click) => Math.abs(click.x - first.x) < 40 && Math.abs(click.y - first.y) < 40
        );
        if (clustered) {
          recentClicks.length = 0;
          track('rage_click', { label: describe(target) });
        }
      }

      const link = target.closest('a');
      const button = target.closest('button');

      if (link) {
        const href = link.getAttribute('href') ?? '';
        if (href.startsWith('tel:')) {
          track('click_phone', { label: describe(link), meta: { number: href.slice(4) } });
          return;
        }
        if (href.startsWith('mailto:')) {
          track('click_email', { label: describe(link) });
          return;
        }
        if (/^https?:\/\//i.test(href) && !href.includes(window.location.hostname)) {
          track('outbound', { label: href.slice(0, 200) });
          return;
        }
        if (/\/(book-appointment|contact)/.test(href)) {
          track('click_cta', { label: describe(link), meta: { to: href } });
          return;
        }
      }

      const cta = (link ?? button)?.getAttribute('data-cp-cta');
      if (cta) track('click_cta', { label: cta });
    };

    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, []);

  // Script errors. A form that throws on submit looks identical to a visitor
  // who changed their mind, unless this is recorded.
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      track('js_error', {
        label: event.message?.slice(0, 200),
        meta: { source: event.filename?.slice(0, 200), line: event.lineno },
      });
    };
    window.addEventListener('error', onError);
    return () => window.removeEventListener('error', onError);
  }, []);

  // Leaving: flush with a beacon, since a normal request would be cancelled.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') {
        track('exit', { value: Math.round(activeSeconds.current) });
        flush(true);
      }
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onHide);
    };
  }, []);

  useWebVitals();

  return null;
}

function describe(element: HTMLElement): string {
  const text = (element.innerText || element.getAttribute('aria-label') || '').trim();
  if (text) return text.replace(/\s+/g, ' ').slice(0, 80);
  return element.tagName.toLowerCase();
}

/**
 * Core Web Vitals, measured directly from the performance timeline.
 *
 * Reported because page speed is not a nicety once ads are running: Google
 * prices a slow landing page into its quality score, so every tenth of a second
 * here shows up on the invoice.
 */
function useWebVitals() {
  useEffect(() => {
    if (typeof PerformanceObserver === 'undefined') return;

    const observers: PerformanceObserver[] = [];
    const observe = (type: string, callback: (entries: PerformanceEntryList) => void) => {
      try {
        const observer = new PerformanceObserver((list) => callback(list.getEntries()));
        observer.observe({ type, buffered: true } as PerformanceObserverInit);
        observers.push(observer);
      } catch {
        /* the browser does not support this metric */
      }
    };

    const navigation = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined;
    if (navigation) {
      trackVital({ metric: 'TTFB', value: Math.round(navigation.responseStart), rating: rate('TTFB', navigation.responseStart) });
    }

    observe('paint', (entries) => {
      for (const entry of entries) {
        if (entry.name === 'first-contentful-paint') {
          trackVital({ metric: 'FCP', value: Math.round(entry.startTime), rating: rate('FCP', entry.startTime) });
        }
      }
    });

    let lcp = 0;
    observe('largest-contentful-paint', (entries) => {
      const last = entries[entries.length - 1];
      if (last) lcp = last.startTime;
    });

    // Layout shift is scored in session windows: a burst of shifts inside a
    // five-second window counts once, which is what the metric is defined as.
    let cls = 0;
    let windowValue = 0;
    let windowStart = 0;
    let windowLast = 0;
    observe('layout-shift', (entries) => {
      for (const entry of entries as unknown as { value: number; hadRecentInput: boolean; startTime: number }[]) {
        if (entry.hadRecentInput) continue;
        if (windowValue && entry.startTime - windowLast < 1000 && entry.startTime - windowStart < 5000) {
          windowValue += entry.value;
        } else {
          windowValue = entry.value;
          windowStart = entry.startTime;
        }
        windowLast = entry.startTime;
        cls = Math.max(cls, windowValue);
      }
    });

    let inp = 0;
    observe('event', (entries) => {
      for (const entry of entries as unknown as { duration: number; interactionId?: number }[]) {
        if (entry.interactionId) inp = Math.max(inp, entry.duration);
      }
    });

    const report = () => {
      if (document.visibilityState !== 'hidden') return;
      if (lcp) trackVital({ metric: 'LCP', value: Math.round(lcp), rating: rate('LCP', lcp) });
      trackVital({ metric: 'CLS', value: Number(cls.toFixed(3)), rating: rate('CLS', cls) });
      if (inp) trackVital({ metric: 'INP', value: Math.round(inp), rating: rate('INP', inp) });
      lcp = 0;
      inp = 0;
    };

    document.addEventListener('visibilitychange', report);
    return () => {
      document.removeEventListener('visibilitychange', report);
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);
}

const THRESHOLDS: Record<string, [number, number]> = {
  LCP: [2500, 4000],
  FCP: [1800, 3000],
  TTFB: [800, 1800],
  CLS: [0.1, 0.25],
  INP: [200, 500],
};

function rate(metric: string, value: number): string {
  const bounds = THRESHOLDS[metric];
  if (!bounds) return 'unknown';
  if (value <= bounds[0]) return 'good';
  if (value <= bounds[1]) return 'needs-improvement';
  return 'poor';
}
