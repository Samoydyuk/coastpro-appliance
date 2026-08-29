'use client';

import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { LANG_COOKIE, LANGS, type Lang } from '@/lib/i18n';
import { useLang } from '@/components/admin/LanguageProvider';
import { cn } from '@/lib/utils';

const NAME: Record<Lang, string> = { en: 'EN', uk: 'УКР' };

/**
 * Switching language, without a round trip to an API route.
 *
 * The cookie is set here and the router is refreshed: every admin page is
 * already server-rendered per request, so a refresh is all it takes for the
 * whole console to come back in the other language. A year is a long time for
 * a preference that one person sets once.
 */
export function LanguageSwitch() {
  const current = useLang();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const choose = (lang: Lang) => {
    if (lang === current) return;
    document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    // `refresh` rather than a reload: it re-renders the server components with
    // the new cookie and keeps the page, the scroll and the open call.
    router.refresh();
    // Belt and braces for the case where a cached RSC payload survives.
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ''}`);
  };

  return (
    <div className="flex items-center gap-0.5">
      {LANGS.map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => choose(lang)}
          aria-pressed={lang === current}
          className={cn(
            'rounded-card px-1.5 py-0.5 font-heading text-[10px] font-semibold uppercase tracking-label transition-colors',
            lang === current ? 'bg-ink text-cream' : 'text-gray-500 hover:text-ink'
          )}
        >
          {NAME[lang]}
        </button>
      ))}
    </div>
  );
}
