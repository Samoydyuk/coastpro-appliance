'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { cn } from '@/lib/utils';
import { RANGE_PRESETS } from '@/lib/admin/range';

/**
 * The way around the business.
 *
 * This began as a marketing console and the navigation said so: seventeen tabs
 * in one row, ordered by when each screen happened to be built. It is not a
 * marketing console. It is where CoastPro is run from, and the first thing
 * somebody opening it wants is the work — who is booked, who is waiting, who
 * rang — not a chart of last week's traffic.
 *
 * So: grouped, down the side, work first. A sidebar also stops the list
 * growing sideways into the date controls every time a screen is added, which
 * is what a seventeenth tab in a row does.
 */

interface Section {
  href: string;
  label: string;
  /** Screens read through a date window; the rest ignore it. */
  ranged?: boolean;
}

interface Group {
  title: string;
  sections: Section[];
}

const OVERVIEW: Section = { href: '/admin', label: 'Overview', ranged: true };

const GROUPS: Group[] = [
  {
    // What is happening, and what needs an answer today. First because it is
    // what the business runs on.
    title: 'Work',
    sections: [
      { href: '/admin/calendar', label: 'Calendar' },
      { href: '/admin/bookings', label: 'Bookings' },
      { href: '/admin/leads', label: 'Enquiries', ranged: true },
      { href: '/admin/calls', label: 'Calls', ranged: true },
    ],
  },
  {
    // What the work was worth, and what is still owed for it. Second because
    // money is the outcome of the work above and the justification for the
    // spending below.
    title: 'Money',
    sections: [
      { href: '/admin/money', label: 'Profit', ranged: true },
      // Deliberately not ranged: ageing is measured to today, and a date window
      // on an ageing report hides the ninety-day debts, which are the only ones
      // that matter.
      { href: '/admin/money/unpaid', label: 'Unpaid' },
      { href: '/admin/money/dispatchers', label: 'Dispatchers', ranged: true },
      { href: '/admin/money/technicians', label: 'Technicians', ranged: true },
      { href: '/admin/money/payments', label: 'Payments', ranged: true },
    ],
  },
  {
    // What it costs to be found, and what that buys.
    title: 'Getting found',
    sections: [
      { href: '/admin/channels', label: 'Channels', ranged: true },
      { href: '/admin/spend', label: 'Ad spend', ranged: true },
      { href: '/admin/search', label: 'Search', ranged: true },
      { href: '/admin/presence', label: 'Listings' },
      { href: '/admin/marketing', label: 'Content' },
    ],
  },
  {
    // The site itself: whether it works, and where people give up on it.
    title: 'Website',
    sections: [
      { href: '/admin/live', label: 'Live now' },
      { href: '/admin/funnel', label: 'Funnel', ranged: true },
      { href: '/admin/pages', label: 'Pages', ranged: true },
      { href: '/admin/geo', label: 'Geography', ranged: true },
      { href: '/admin/quality', label: 'Lead quality', ranged: true },
      { href: '/admin/speed', label: 'Speed', ranged: true },
    ],
  },
];

const SETTINGS: Section = { href: '/admin/settings', label: 'Settings' };

const ALL: Section[] = [OVERVIEW, ...GROUPS.flatMap((g) => g.sections), SETTINGS];

function matches(pathname: string, href: string): boolean {
  return href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
}

/**
 * The one section that is actually being looked at.
 *
 * Longest match wins, because a section's href can be a prefix of another's —
 * `/admin/money` and `/admin/money/unpaid`. Highlighting on a bare `startsWith`
 * lights both, and then the sidebar is telling the reader they are in two
 * places at once.
 */
function activeHref(pathname: string): string | null {
  const match = ALL.filter((s) => matches(pathname, s.href)).sort(
    (a, b) => b.href.length - a.href.length
  )[0];
  return match?.href ?? null;
}

/** Whether the screen being looked at is one a date window applies to. */
function currentIsRanged(pathname: string): boolean {
  const href = activeHref(pathname);
  return Boolean(ALL.find((s) => s.href === href)?.ranged);
}

function Nav() {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const range = params.get('range') ?? '30d';
  const query = params.toString();
  const suffix = query ? `?${query}` : '';

  const setRange = (key: string) => {
    const next = new URLSearchParams(params.toString());
    next.set('range', key);
    // A new window invalidates the page cursor — otherwise you land on page
    // four of a list that now has two pages.
    next.delete('offset');
    router.push(`${pathname}?${next.toString()}`);
  };

  const link = (section: Section) => (
    <Link
      key={section.href}
      href={`${section.href}${suffix}`}
      onClick={() => setOpen(false)}
      className={cn(
        'block rounded-card px-3 py-1.5 font-heading text-[11px] font-semibold uppercase tracking-label transition-colors',
        activeHref(pathname) === section.href
          ? 'bg-ink text-cream'
          : 'text-gray-600 hover:bg-cream-dark hover:text-ink'
      )}
    >
      {section.label}
    </Link>
  );

  return (
    <>
      {/* Narrow screens get a disclosure rather than a sidebar that eats the
          page. The date controls stay visible either way. */}
      <div className="flex items-center gap-2 border-b border-primary-500/15 px-5 py-2 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="rounded-card border border-primary-500/30 px-3 py-1.5 font-heading text-[10px] font-semibold uppercase tracking-label text-gray-600"
        >
          {open ? 'Close' : 'Menu'}
        </button>
        {currentIsRanged(pathname) && (
          <RangeButtons range={range} setRange={setRange} className="ml-auto" />
        )}
      </div>

      <nav
        className={cn(
          'shrink-0 border-primary-500/15 bg-[#fcfcfb] lg:block lg:w-52 lg:border-r',
          open ? 'block border-b' : 'hidden'
        )}
      >
        <div className="space-y-5 px-3 py-4">
          <div>{link(OVERVIEW)}</div>

          {GROUPS.map((group) => (
            <div key={group.title}>
              <div className="px-3 pb-1.5 font-heading text-[9px] uppercase tracking-label text-gray-400">
                {group.title}
              </div>
              <div className="space-y-0.5">{group.sections.map(link)}</div>
            </div>
          ))}

          <div className="border-t border-primary-500/15 pt-4">{link(SETTINGS)}</div>
        </div>
      </nav>
    </>
  );
}

function RangeButtons({
  range,
  setRange,
  className,
}: {
  range: string;
  setRange: (key: string) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {RANGE_PRESETS.map((preset) => (
        <button
          key={preset.key}
          type="button"
          onClick={() => setRange(preset.key)}
          className={cn(
            'rounded-card border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-label transition-colors',
            range === preset.key
              ? 'border-ink bg-ink text-cream'
              : 'border-primary-500/25 text-gray-600 hover:border-ink hover:text-ink'
          )}
        >
          {preset.label.replace('Last ', '')}
        </button>
      ))}
    </div>
  );
}

/** The date window, shown only on the screens that are read through one. */
function RangeBarInner() {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();

  if (!currentIsRanged(pathname)) return null;

  const setRange = (key: string) => {
    const next = new URLSearchParams(params.toString());
    next.set('range', key);
    next.delete('offset');
    router.push(`${pathname}?${next.toString()}`);
  };

  return (
    <div className="hidden justify-end pb-4 lg:flex">
      <RangeButtons range={params.get('range') ?? '30d'} setRange={setRange} />
    </div>
  );
}

export function AdminNav() {
  return (
    <Suspense fallback={<div className="lg:w-52" />}>
      <Nav />
    </Suspense>
  );
}

export function AdminRangeBar() {
  return (
    <Suspense fallback={null}>
      <RangeBarInner />
    </Suspense>
  );
}
