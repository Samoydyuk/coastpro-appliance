'use client';

import { createContext, useContext } from 'react';
import { translator, type Lang, type Translator } from '@/lib/i18n';

/**
 * The language, for the quarter of the console that runs in the browser.
 *
 * Twenty-six components under /admin are client components — the call bar, the
 * navigation, the map, every editor. Handing each of them a `lang` prop would
 * mean touching twenty-six call sites and every component in between, so the
 * layout wraps them once and they read it from here.
 *
 * The dictionary is a plain object, so what crosses the boundary is a two-letter
 * string, not a serialised function.
 */
const LanguageContext = createContext<Lang>('en');

export function LanguageProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <LanguageContext.Provider value={lang}>{children}</LanguageContext.Provider>;
}

export function useLang(): Lang {
  return useContext(LanguageContext);
}

/** The same `t` the server uses, built from the language in context. */
export function useT(): Translator {
  return translator(useContext(LanguageContext));
}
