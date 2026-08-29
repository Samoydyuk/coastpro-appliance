import { SHOP_TIMEZONE } from '@/lib/admin/range';

/**
 * The hour of the day at the shop, as a number.
 *
 * Written down once because it is read back from a *formatted* string, and
 * that is a trap with two teeth.
 *
 * The first: `hour12: false` renders midnight as "24" in en-US and as "00" in
 * uk-UA. Code that does `Number(format(date))` therefore returns 24 or 0 for
 * the same instant depending on a locale nobody thought was load-bearing —
 * `BookingActions` already carried its own patch for this.
 *
 * The second: the locale here is a *format*, not a language. It must stay
 * pinned whatever the console is being read in, or a layout calculation starts
 * moving with the interface language.
 */
export function shopHour(when: Date, timeZone: string = SHOP_TIMEZONE): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    hour12: false,
  }).formatToParts(when);

  const raw = Number(parts.find((part) => part.type === 'hour')?.value ?? '0');
  // 24 and 0 are the same moment; only one of them is a row on a day board.
  return raw % 24;
}
