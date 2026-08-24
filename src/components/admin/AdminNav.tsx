'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { cn } from '@/lib/utils';
import { RANGE_PRESETS } from '@/lib/admin/range';

const SECTIONS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/live', label: 'Live' },
  { href: '/admin/channels', label: 'Channels' },
  { href: '/admin/search', label: 'Search' },
  { href: '/admin/funnel', label: 'Funnel' },
  { href: '/admin/leads', label: 'Leads' },
  { href: '/admin/calls', label: 'Calls' },
  { href: '/admin/pages', label: 'Pages' },
  { href: '/admin/geo', label: 'Geography' },
  { href: '/admin/presence', label: 'Presence' },
  { href: '/admin/spend', label: 'Spend' },
  { href: '/admin/quality', label: 'Quality' },
  { href: '/admin/speed', label: 'Speed' },
  { href: '/admin/marketing', label: 'Marketing' },
  { href: '/admin/settings', label: 'Settings' },
];

/** The section tabs and the one date range every screen is read through. */
function Nav() {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();

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

  return (
    <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-1 gap-y-2 px-5 pb-2">
      <nav className="flex flex-wrap items-center gap-x-1">
        {SECTIONS.map((section) => {
          const active =
            section.href === '/admin' ? pathname === '/admin' : pathname.startsWith(section.href);
          return (
            <Link
              key={section.href}
              href={`${section.href}${suffix}`}
              className={cn(
                'rounded-card px-3 py-1.5 font-heading text-[10px] font-semibold uppercase tracking-label transition-colors',
                active ? 'bg-ink text-cream' : 'text-gray-600 hover:bg-cream-dark hover:text-ink'
              )}
            >
              {section.label}
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-1">
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
    </div>
  );
}

export function AdminNav() {
  return (
    <Suspense fallback={<div className="h-10" />}>
      <Nav />
    </Suspense>
  );
}
