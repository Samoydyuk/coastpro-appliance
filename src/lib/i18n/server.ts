import { cookies } from 'next/headers';
import { isLang, translator, LANG_COOKIE, type Lang, type Translator } from './index';

/**
 * The language this request is being read in.
 *
 * Server components only. Kept apart from the dictionary because `format.ts`
 * imports that, and `format.ts` is used on both sides of the client boundary —
 * one `next/headers` import in the wrong file and the whole build stops.
 *
 * Reading a cookie here costs nothing: every page under /admin is already
 * dynamic, because the layout reads the session cookie before it renders a
 * thing. That bill was paid the day the console got a login.
 */
export function currentLang(): Lang {
  const value = cookies().get(LANG_COOKIE)?.value;
  return isLang(value) ? value : 'en';
}

/** The translator for this request. */
export function serverTranslator(): Translator {
  return translator(currentLang());
}
