'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { resolveVisitChannel, track } from '@/lib/analytics';
import { siteConfig } from '@/data/site-config';

/**
 * Dynamic number insertion.
 *
 * Most people who need a fridge fixed today do not fill in a form — they call.
 * A call is invisible to every click-based analytics tool, so the number itself
 * has to carry the attribution: each channel gets its own tracking number, and
 * whichever one rings tells us which ad paid for the call before anyone speaks.
 *
 * It rewrites the numbers already on the page instead of asking every component
 * to render through a wrapper. That keeps the whole feature in one file, and
 * means a page added later is covered without anybody remembering to do it.
 *
 * If the lookup fails, or no number is configured for the channel, the page
 * keeps the real business number. A missed call costs far more than a missing
 * row of attribution.
 */
export function PhoneSwap() {
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    const channel = resolveVisitChannel();

    const apply = (numberE164: string, display: string) => {
      if (cancelled) return;
      const defaultDigits = siteConfig.contact.phoneClean;
      const defaultDisplay = siteConfig.contact.phone;
      if (numberE164.replace(/\D/g, '').endsWith(defaultDigits)) return;

      document.querySelectorAll<HTMLAnchorElement>('a[href^="tel:"]').forEach((link) => {
        const href = link.getAttribute('href') ?? '';
        if (!href.replace(/\D/g, '').endsWith(defaultDigits)) return;
        link.setAttribute('href', `tel:${numberE164}`);
        link.dataset.cpSwapped = channel;
      });

      // Visible text is replaced separately: plenty of visitors read the number
      // off the screen and dial it by hand, and if the printed number is not
      // the tracked one, those calls go missing.
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const patterns = [
        defaultDisplay,
        defaultDisplay.replace(/[()\s]/g, '').replace(/^(\d{3})(\d{3})/, '$1-$2'),
        defaultDigits,
      ];
      const pending: Text[] = [];
      while (walker.nextNode()) {
        const node = walker.currentNode as Text;
        if (patterns.some((pattern) => node.nodeValue?.includes(pattern))) pending.push(node);
      }
      pending.forEach((node) => {
        let text = node.nodeValue ?? '';
        patterns.forEach((pattern) => {
          text = text.split(pattern).join(display);
        });
        node.nodeValue = text;
      });
    };

    fetch(`/api/phone?channel=${encodeURIComponent(channel)}`, { credentials: 'same-origin' })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!data?.number || !data?.display) return;
        apply(data.number, data.display);
        track('pageview', { path: pathname, label: 'number_swapped', meta: { channel, number: data.number } });
      })
      .catch(() => {
        /* keep the printed number */
      });

    return () => {
      cancelled = true;
    };
    // Re-run per route: a client-side navigation renders fresh markup carrying
    // the default number again.
  }, [pathname]);

  return null;
}
