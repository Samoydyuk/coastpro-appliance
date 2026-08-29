import Link from 'next/link';
import { count } from '@/lib/admin/format';
import { serverTranslator } from '@/lib/i18n/server';

/**
 * Moving through a list that is longer than one screen.
 *
 * Written because the alternative was a page size pretending to be a report:
 * a list that stops at fifty rows looks complete, and a total that disagrees
 * with the rows under it is how somebody stops trusting the screen.
 */
export function Pager({
  base,
  offset,
  shown,
  total,
  hasMore,
}: {
  /** The current URL with everything except `offset` already on it. */
  base: string;
  offset: number;
  shown: number;
  /** Absent when the source only knows whether there is more, not how much. */
  total?: number;
  hasMore: boolean;
}) {
  if (offset === 0 && !hasMore) return null;

  const t = serverTranslator();
  const step = shown || 200;
  const href = (next: number) =>
    `${base}${base.includes('?') ? '&' : '?'}offset=${Math.max(0, next)}`;

  const link =
    'inline-flex h-8 items-center rounded-card border border-primary-500/30 px-3 font-heading text-[10px] font-semibold uppercase tracking-label text-gray-600 hover:border-ink hover:text-ink';
  const dead =
    'inline-flex h-8 items-center rounded-card border border-primary-500/15 px-3 font-heading text-[10px] font-semibold uppercase tracking-label text-gray-400';

  return (
    <div className="mt-3 flex items-center gap-2">
      {offset > 0 ? (
        <Link href={href(offset - step)} className={link}>
          {t('common.previous')}
        </Link>
      ) : (
        <span className={dead}>{t('common.previous')}</span>
      )}
      {hasMore ? (
        <Link href={href(offset + step)} className={link}>
          {t('common.next')}
        </Link>
      ) : (
        <span className={dead}>{t('common.next')}</span>
      )}
      <span className="text-[11px] text-gray-500">
        {total === undefined
          ? t('shared.pager.range', {
              from: count(offset + 1, t.lang),
              to: count(offset + shown, t.lang),
            })
          : t('shared.pager.rangeOfTotal', {
              from: count(offset + 1, t.lang),
              to: count(offset + shown, t.lang),
              total: count(total, t.lang),
            })}
      </span>
    </div>
  );
}
