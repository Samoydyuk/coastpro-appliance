'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/components/admin/LanguageProvider';

/**
 * Pull from Google now, rather than waiting for tomorrow.
 *
 * The importer runs once a night, which is all the scheduler allows, and
 * Search Console updates several times a day. So between runs this screen
 * always trails what Google is showing — and the newest day in particular
 * looks empty, because the night's run reached it before Google had filled it
 * in.
 *
 * That gap is not a fault, but it does need an answer other than "wait", or
 * anyone comparing the two screens concludes the importer is broken.
 */
export function SearchRefresh({ lastDay }: { lastDay: string | null }) {
  const router = useRouter();
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setNote(null);
    try {
      const response = await fetch('/api/admin/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refresh' }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        setNote(body?.error ?? t('marketing.search.refreshFailed'));
        return;
      }
      const search = (body?.outcomes ?? []).find(
        (o: { channel: string }) => o.channel === 'google_search'
      );
      // `error`, `skipped` and `note` are the importer's own words and stay as
      // they arrived; only the sentence around them is ours to translate.
      setNote(
        search?.error ??
          search?.skipped ??
          (search
            ? t('marketing.search.rowsWritten', {
                rows: t.plural(search.rows, 'marketing.plural.row'),
              }) + (search.note ? ` — ${search.note}` : '')
            : t('marketing.search.nothingToFetch'))
      );
      router.refresh();
    } catch {
      setNote(t('marketing.msg.noServer'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="h-8 rounded-card border border-primary-500/40 px-3 font-heading text-[10px] font-semibold uppercase tracking-label text-ink transition-colors hover:bg-cream-dark/50 disabled:opacity-50"
      >
        {busy ? t('marketing.search.fetching') : t('marketing.search.fetch')}
      </button>
      <span className="text-[11px] text-gray-500">
        {note ??
          (lastDay
            ? t('marketing.search.heldThrough', { day: lastDay })
            : t('marketing.search.nothingImported'))}
      </span>
    </div>
  );
}
