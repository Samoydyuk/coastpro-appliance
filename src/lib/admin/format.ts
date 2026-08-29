import { SHOP_TIMEZONE } from '@/lib/admin/range';
import { type Lang, numberLocale } from '@/lib/i18n';

/**
 * Presentation helpers shared by every admin screen.
 *
 * Two rules hold here.
 *
 * **Every date is the shop's date.** Without an explicit `timeZone` these read
 * in whatever zone the process happens to run in — UTC on the server — so a job
 * finished at five in the afternoon in California was being dated to the next
 * day. The window in `range.ts` has always been careful about this; the
 * formatting was not, and the two disagreed.
 *
 * **Money stays in dollars whatever the language.** A Ukrainian reader wants
 * Ukrainian months, not hryvnia: the business bills in USD and translating the
 * currency would be inventing a number.
 */

export function money(cents: number | null | undefined, lang: Lang = 'en'): string {
  if (cents === null || cents === undefined) return '—';
  const dollars = cents / 100;
  return dollars.toLocaleString(numberLocale(lang), {
    style: 'currency',
    currency: 'USD',
    // Without this a Ukrainian locale writes "36,00 USD" and the dollar sign
    // disappears from a screen that is entirely about dollars.
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: dollars >= 1000 ? 0 : 2,
  });
}

export function count(value: number | null | undefined, lang: Lang = 'en'): string {
  if (value === null || value === undefined) return '—';
  return Math.round(value).toLocaleString(numberLocale(lang));
}

export function percent(
  value: number | null | undefined,
  digits = 1,
  lang: Lang = 'en'
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  // Through Intl rather than toFixed, or this is the one number on the screen
  // still using a full stop while everything beside it uses a comma.
  return `${(value * 100).toLocaleString(numberLocale(lang), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`;
}

export function duration(seconds: number | null | undefined): string {
  if (!seconds || seconds < 1) return '0s';
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes) return `${minutes}m ${rest}s`;
  return `${rest}s`;
}

export function shortDate(value: string | Date, lang: Lang = 'en'): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleDateString(numberLocale(lang), {
    month: 'short',
    day: 'numeric',
    timeZone: SHOP_TIMEZONE,
  });
}

export function dateTime(value: string | Date | null | undefined, lang: Lang = 'en'): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleString(numberLocale(lang), {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    // Kept to the shop's clock in both languages. Switching to 24-hour with
    // the language would be a product decision wearing a formatting hat.
    hour12: true,
    timeZone: SHOP_TIMEZONE,
  });
}

export function relativeTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
  if (seconds < 86_400) return `${Math.round(seconds / 3600)}h ago`;
  return `${Math.round(seconds / 86_400)}d ago`;
}

/**
 * A change against the previous period. Returns null when there is nothing to
 * compare against — showing "+100%" because last month was zero is noise
 * dressed up as insight.
 */
export function delta(current: number, previous: number): number | null {
  if (!previous) return null;
  return (current - previous) / previous;
}

export function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows: Record<string, unknown>[], columns?: string[]): string {
  if (!rows.length) return '';
  const keys = columns ?? Object.keys(rows[0]!);
  const header = keys.map(csvEscape).join(',');
  const body = rows.map((row) => keys.map((key) => csvEscape(row[key])).join(','));
  return [header, ...body].join('\n');
}
