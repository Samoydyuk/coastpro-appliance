'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Phone } from 'lucide-react';
import { siteConfig } from '@/data/site-config';
import { trackPhoneClick, trackBookNowClick } from '@/lib/gtag';

/**
 * The two things to do, always within reach of a thumb.
 *
 * The home page runs to about thirty-four screens on a phone and carries
 * fourteen telephone links, none of them pinned — so the moment somebody
 * decides they want this fixed, they are somewhere in the middle of a
 * paragraph with no way to act on it.
 *
 * Deliberately quiet. A black slab with a shouting button across the bottom of
 * every screen is how a discount site behaves; this is a hairline, a cream
 * ground and two small labels, and it earns its place by being there rather
 * than by being loud.
 *
 * Held back until the hero has scrolled away: showing it at once puts a bar
 * over the one screen that already has both actions on it.
 */
export function StickyCallBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 0.9);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-primary-500/20 bg-cream/95 backdrop-blur transition-transform duration-300 lg:hidden ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
      // Clear of the home indicator, where a bar flush with the bottom edge is
      // a bar half of which cannot be pressed.
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch">
        <a
          href={`tel:${siteConfig.contact.phoneClean}`}
          onClick={() => trackPhoneClick('sticky_bar')}
          className="flex flex-1 items-center justify-center gap-2 py-3.5 font-heading text-[11px] font-semibold uppercase tracking-label text-ink"
        >
          <Phone className="h-3.5 w-3.5" strokeWidth={1.5} />
          {siteConfig.contact.phone}
        </a>

        {/* A hairline between them rather than a gap: two floating pills read
            as an advert, one divided row reads as a bar. */}
        <span className="my-2 w-px bg-primary-500/20" />

        <Link
          href="/book-appointment"
          onClick={() => trackBookNowClick('sticky_bar')}
          className="flex flex-1 items-center justify-center py-3.5 font-heading text-[11px] font-semibold uppercase tracking-label text-brand"
        >
          Book a visit
        </Link>
      </div>
    </div>
  );
}
