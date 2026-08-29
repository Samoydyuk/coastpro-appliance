'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/components/admin/LanguageProvider';

/**
 * Pulling the released jobs across from JobPocket.
 *
 * Deliberately a button and not a schedule. Nothing downstream is automatic —
 * the owner marks a job as publishable in the app, comes here, and asks for it.
 * A cron would make the list quietly grow on its own, which is the opposite of
 * what this module is for.
 */
export function MarketingRefresh({ lastRefresh }: { lastRefresh: string | null }) {
  const router = useRouter();
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const refresh = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch('/api/admin/marketing/refresh', { method: 'POST' });
      const body = (await response.json().catch(() => null)) as {
        jobs?: number;
        photos?: number;
        error?: string;
      } | null;
      if (!response.ok) {
        setError(body?.error ?? t('marketing.jobs.readFailed'));
        return;
      }
      setResult(
        t('marketing.jobs.refreshResult', {
          jobs: t.plural(body?.jobs ?? 0, 'plural.job'),
          photos: t.plural(body?.photos ?? 0, 'marketing.plural.photo'),
        })
      );
      router.refresh();
    } catch {
      setError(t('marketing.msg.noServer'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={refresh}
        disabled={busy}
        className="h-8 rounded-card bg-ink px-3 font-heading text-[10px] font-semibold uppercase tracking-label text-cream disabled:opacity-50"
      >
        {busy ? t('marketing.jobs.reading') : t('marketing.jobs.refresh')}
      </button>
      {result && <span className="text-xs text-gray-600">{result}</span>}
      {error && <span className="text-xs text-red-700">{error}</span>}
      {!result && !error && lastRefresh && (
        <span className="text-xs text-gray-500">
          {t('marketing.jobs.lastRead', { when: lastRefresh })}
        </span>
      )}
    </div>
  );
}
