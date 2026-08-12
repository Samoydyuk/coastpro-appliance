/**
 * The date range every admin screen is read through.
 *
 * Everything is computed in the shop's own timezone, not UTC. A job booked at
 * 6pm in California is a Tuesday evening call; in UTC it is Wednesday morning,
 * and an "hour of day" chart built on UTC would tell you to bid hardest at 2am.
 */

export const SHOP_TIMEZONE = process.env.NEXT_PUBLIC_SHOP_TIMEZONE || 'America/Los_Angeles';

export const RANGE_PRESETS = [
  { key: 'today', label: 'Today', days: 1 },
  { key: '7d', label: 'Last 7 days', days: 7 },
  { key: '30d', label: 'Last 30 days', days: 30 },
  { key: '90d', label: 'Last 90 days', days: 90 },
  { key: 'mtd', label: 'Month to date', days: 0 },
  { key: 'all', label: 'All time', days: 3650 },
] as const;

export type RangeKey = (typeof RANGE_PRESETS)[number]['key'] | 'custom';

export interface DateRange {
  key: RangeKey;
  label: string;
  from: Date;
  to: Date;
  /** The immediately preceding window of the same length, for comparisons. */
  previousFrom: Date;
  previousTo: Date;
  days: number;
}

function startOfDayInShop(date: Date): Date {
  // Format the instant as it reads in the shop's timezone, then re-read that
  // wall-clock date as an instant. Avoids pulling in a date library for the one
  // conversion this codebase needs.
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SHOP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  const offset = shopOffsetMinutes(date);
  return new Date(`${parts}T00:00:00.000${formatOffset(offset)}`);
}

function shopOffsetMinutes(date: Date): number {
  const utc = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const local = new Date(date.toLocaleString('en-US', { timeZone: SHOP_TIMEZONE }));
  return Math.round((local.getTime() - utc.getTime()) / 60000);
}

function formatOffset(minutes: number): string {
  const sign = minutes >= 0 ? '+' : '-';
  const abs = Math.abs(minutes);
  return `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
}

export function parseRange(params: { range?: string; from?: string; to?: string }): DateRange {
  const now = new Date();
  const today = startOfDayInShop(now);
  const key = (params.range ?? '30d') as RangeKey;

  if (key === 'custom' && params.from && params.to) {
    const from = new Date(`${params.from}T00:00:00${formatOffset(shopOffsetMinutes(now))}`);
    const to = new Date(`${params.to}T23:59:59${formatOffset(shopOffsetMinutes(now))}`);
    const days = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86_400_000));
    return {
      key,
      label: `${params.from} — ${params.to}`,
      from,
      to,
      previousFrom: new Date(from.getTime() - days * 86_400_000),
      previousTo: from,
      days,
    };
  }

  if (key === 'mtd') {
    const monthStart = new Date(today);
    monthStart.setDate(1);
    const days = Math.max(1, Math.ceil((now.getTime() - monthStart.getTime()) / 86_400_000));
    const previousStart = new Date(monthStart);
    previousStart.setMonth(previousStart.getMonth() - 1);
    return {
      key,
      label: 'Month to date',
      from: monthStart,
      to: now,
      previousFrom: previousStart,
      previousTo: monthStart,
      days,
    };
  }

  const preset = RANGE_PRESETS.find((entry) => entry.key === key) ?? RANGE_PRESETS[2];
  const from = new Date(today.getTime() - (preset.days - 1) * 86_400_000);
  return {
    key: preset.key,
    label: preset.label,
    from,
    to: now,
    previousFrom: new Date(from.getTime() - preset.days * 86_400_000),
    previousTo: from,
    days: preset.days,
  };
}

/** Postgres-side timezone name, so date_trunc buckets land on shop days. */
export const TZ = SHOP_TIMEZONE;
