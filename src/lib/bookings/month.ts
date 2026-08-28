import { SHOP_TIMEZONE } from '@/lib/admin/range';

/**
 * Months, as the shop lives them.
 *
 * Every date here is a day in the shop's own timezone, not in UTC. A job at
 * 5pm on the last day of September in California is the 1st of October in UTC,
 * and a calendar that quietly put it in the wrong month would be worse than no
 * calendar — it would be a calendar nobody could trust twice.
 */

export interface MonthView {
  /** `YYYY-MM`, the value that travels in the query string. */
  key: string;
  year: number;
  /** 1–12, the way people say it rather than the way JavaScript counts. */
  month: number;
  label: string;
  previousKey: string;
  nextKey: string;
}

const MONTH_PARAM = /^(\d{4})-(\d{2})$/;

/** Today's date in the shop's timezone, as `YYYY-MM-DD`. */
export function todayInShopTz(now: Date = new Date()): string {
  return dayKey(now);
}

/**
 * Which day a moment falls on, in the shop's timezone.
 *
 * `formatToParts` rather than arithmetic on the offset: the offset changes
 * twice a year, and the day either side of that change is exactly the day
 * somebody notices the calendar is wrong.
 */
export function dayKey(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SHOP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** The time of day, in the shop's timezone — "9:00 AM". */
export function timeOfDay(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('en-US', {
    timeZone: SHOP_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function parseMonth(param: string | undefined, now: Date = new Date()): MonthView {
  const matched = param && MONTH_PARAM.exec(param);

  let year: number;
  let month: number;

  if (matched) {
    year = Number(matched[1]);
    month = Number(matched[2]);
  } else {
    // Default to the month the shop is currently in, not the server's.
    const [y, m] = dayKey(now).split('-');
    year = Number(y);
    month = Number(m);
  }

  if (month < 1 || month > 12 || year < 2000 || year > 2100) {
    const [y, m] = dayKey(now).split('-');
    year = Number(y);
    month = Number(m);
  }

  const shift = (delta: number) => {
    const total = year * 12 + (month - 1) + delta;
    const shiftedYear = Math.floor(total / 12);
    const shiftedMonth = (total % 12) + 1;
    return `${shiftedYear}-${String(shiftedMonth).padStart(2, '0')}`;
  };

  return {
    key: `${year}-${String(month).padStart(2, '0')}`,
    year,
    month,
    label: new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
      new Date(Date.UTC(year, month - 1, 15))
    ),
    previousKey: shift(-1),
    nextKey: shift(1),
  };
}

/**
 * The window to ask the API for.
 *
 * Deliberately a day wider at each end than the month: the request is in UTC
 * and the month is in local time, so the true boundary sits somewhere inside
 * that day. Everything is bucketed by local day afterwards, and the extra days
 * simply find no home and are dropped — which is cheaper and far harder to get
 * wrong than computing the offset for a date that may straddle a clock change.
 */
export function monthWindow(view: MonthView): { from: string; to: string } {
  return {
    from: new Date(Date.UTC(view.year, view.month - 1, 1, 0, 0, 0) - 86_400_000).toISOString(),
    to: new Date(Date.UTC(view.year, view.month, 1, 0, 0, 0) + 86_400_000).toISOString(),
  };
}

export interface DayCell {
  /** `YYYY-MM-DD` in shop time, or null for the padding before/after the month. */
  key: string | null;
  day: number | null;
  isToday: boolean;
}

/** Weeks of seven cells, Sunday first, padded so the grid stays rectangular. */
export function buildWeeks(view: MonthView, today = todayInShopTz()): DayCell[][] {
  const firstWeekday = new Date(Date.UTC(view.year, view.month - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(view.year, view.month, 0)).getUTCDate();

  const cells: DayCell[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push({ key: null, day: null, isToday: false });

  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${view.year}-${String(view.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    cells.push({ key, day, isToday: key === today });
  }

  while (cells.length % 7 !== 0) cells.push({ key: null, day: null, isToday: false });

  const weeks: DayCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ---------------------------------------------------------------------------
// Weeks and days
//
// All three views share one anchor date in the query string rather than each
// carrying its own, so switching from a week to the day you were looking at
// lands on that day instead of on today.
// ---------------------------------------------------------------------------

/** `YYYY-MM-DD` shifted by whole days, without touching a timezone. */
export function shiftDay(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number);
  const shifted = new Date(Date.UTC(y, m - 1, d + days));
  return shifted.toISOString().slice(0, 10);
}

/** Sunday-first, matching the month grid. */
export function weekOf(key: string): { key: string; label: string; isToday: boolean }[] {
  const [y, m, d] = key.split('-').map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const start = shiftDay(key, -weekday);
  const today = todayInShopTz();

  return Array.from({ length: 7 }, (_, i) => {
    const dayKeyValue = shiftDay(start, i);
    const [yy, mm, dd] = dayKeyValue.split('-').map(Number);
    return {
      key: dayKeyValue,
      label: new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(Date.UTC(yy, mm - 1, dd))),
      isToday: dayKeyValue === today,
    };
  });
}

/** A window wide enough to hold the local day, whatever the offset. */
export function dayWindow(key: string): { from: string; to: string } {
  const [y, m, d] = key.split('-').map(Number);
  const noon = Date.UTC(y, m - 1, d, 12);
  return {
    from: new Date(noon - 36 * 3_600_000).toISOString(),
    to: new Date(noon + 36 * 3_600_000).toISOString(),
  };
}

export function weekWindow(days: { key: string }[]): { from: string; to: string } {
  return { from: dayWindow(days[0].key).from, to: dayWindow(days[days.length - 1].key).to };
}

/** The long label above a day board. */
export function dayLabel(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function isDayKey(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}
