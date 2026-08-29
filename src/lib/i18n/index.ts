import { en } from './en/index';
import { uk } from './uk/index';

/**
 * Two languages in the console, without a dependency and without moving a file.
 *
 * The language lives in a cookie rather than in the path. A `[lang]` segment
 * would move every page under `src/app/admin/` and rewrite every `href` in the
 * navigation and the money screens — a large, risky change to answer a question
 * that one cookie answers. It also keeps a shared link working: send somebody a
 * report and they read it in their own language, not yours.
 *
 * The dictionary is a plain object and `t` is one function, on purpose. This
 * repo already declines dependencies where a small amount of code will do, and
 * the whole of what a translation library offers here is interpolation and
 * plurals — the second of which needs care no library removes.
 */

export type Lang = 'en' | 'uk';

export const LANGS: readonly Lang[] = ['en', 'uk'] as const;

export const LANG_COOKIE = 'coastpro_lang';

export function isLang(value: unknown): value is Lang {
  return value === 'en' || value === 'uk';
}

/**
 * Which locale to hand `Intl`.
 *
 * Deliberately not the same string as the language: `uk-UA` is what Ukrainian
 * months and comma decimals come from, and `en-US` is what the dollar amounts
 * have always used. Neither is `en-CA`, which appears elsewhere in this
 * codebase as an ISO-8601 date *formatter* rather than as anybody's language —
 * a sweep that replaced locale strings would silently break date parsing.
 */
export function numberLocale(lang: Lang): string {
  return lang === 'uk' ? 'uk-UA' : 'en-US';
}

/** The Ukrainian file must answer every key the English one does. */
export type TranslationKey = keyof typeof en;
// `as const` on the English file makes each value its own literal type, which
// no translation could ever satisfy. The keys are what must match; the strings
// are just strings.
export type Dictionary = Record<TranslationKey, string>;

const DICTIONARIES: Record<Lang, Dictionary> = { en, uk };

export function dictionary(lang: Lang): Dictionary {
  return DICTIONARIES[lang];
}

/**
 * Ukrainian has four plural categories where English has two.
 *
 * One робота, two роботи, five робіт, and a fourth for fractions. Every
 * `n === 1 ? 'job' : 'jobs'` in this codebase assumes the English shape and
 * produces nonsense in Ukrainian for exactly the counts a report is full of.
 * `Intl.PluralRules` knows the rule; the dictionary supplies the words.
 */
export function plural(lang: Lang, n: number, forms: Partial<Record<Intl.LDMLPluralRule, string>>): string {
  const rule = new Intl.PluralRules(numberLocale(lang)).select(n);
  return forms[rule] ?? forms.other ?? forms.many ?? forms.one ?? '';
}

export interface Translator {
  (key: TranslationKey, values?: Record<string, string | number>): string;
  lang: Lang;
  /** `plural(3, 'jobs')` → "3 роботи", using the `jobs.one/few/many/other` keys. */
  plural: (n: number, stem: string) => string;
}

function interpolate(template: string, values?: Record<string, string | number>): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (whole, name) =>
    name in values ? String(values[name]) : whole
  );
}

export function translator(lang: Lang): Translator {
  const table = dictionary(lang);

  const t = ((key: TranslationKey, values?: Record<string, string | number>) => {
    // Falling back to the English string rather than to the key: a missing
    // Ukrainian entry should read as untranslated, not as `money.billed`.
    const template = table[key] ?? en[key] ?? String(key);
    return interpolate(template, values);
  }) as Translator;

  t.lang = lang;
  t.plural = (n: number, stem: string) => {
    const rule = new Intl.PluralRules(numberLocale(lang)).select(n);
    const pick = (suffix: string) =>
      (table as Record<string, string>)[`${stem}.${suffix}`] ??
      (en as Record<string, string>)[`${stem}.${suffix}`];
    const word = pick(rule) ?? pick('other') ?? pick('many') ?? pick('one') ?? stem;
    return interpolate(word, { n: n.toLocaleString(numberLocale(lang)) });
  };

  return t;
}

/**
 * Nothing here may touch `next/headers`.
 *
 * `format.ts` imports this file, and a quarter of the admin — twenty-six
 * components — is client-side, so anything server-only in here ends up in the
 * browser bundle and the build refuses it. The cookie reader lives in
 * `./server`, which only server components import.
 */
