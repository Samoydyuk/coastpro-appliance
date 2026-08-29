import { numberLocale, type TranslationKey, type Translator } from '@/lib/i18n';
import { SHOP_TIMEZONE, type DateRange } from '@/lib/admin/range';

/**
 * The date window, in the language the console is being read in.
 *
 * `parseRange` builds its own English label — "Last 30 days", "August 2026" —
 * and seventeen screens print it straight into their subheading, so a
 * Ukrainian console said "Month to date" at the top of every page. Three of
 * them had grown a private copy of this map, which is how a fourth ends up
 * disagreeing with the other three.
 *
 * One answer, here, next to the dictionary keys it uses.
 */
const PRESET_KEYS: Record<string, TranslationKey> = {
  today: 'range.today',
  '7d': 'range.7d',
  '30d': 'range.30d',
  '90d': 'range.90d',
  mtd: 'range.mtd',
  last_month: 'range.last_month',
  all: 'range.all',
};

export function rangeLabel(range: DateRange, t: Translator): string {
  const key = PRESET_KEYS[range.key];
  if (key && range.key !== 'last_month') return t(key);

  // A named month, in the reader's own language and the shop's timezone.
  if (range.key === 'last_month') {
    return range.from.toLocaleDateString(numberLocale(t.lang), {
      month: 'long',
      year: 'numeric',
      timeZone: SHOP_TIMEZONE,
    });
  }

  // A custom window: two dates, formatted rather than the raw ISO the label
  // carries, so it reads the same way as every other date on the page.
  const day = (date: Date) =>
    date.toLocaleDateString(numberLocale(t.lang), {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: SHOP_TIMEZONE,
    });
  return `${day(range.from)} — ${day(range.to)}`;
}
