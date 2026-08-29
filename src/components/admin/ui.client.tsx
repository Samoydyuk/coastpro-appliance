'use client';

import { useT } from '@/components/admin/LanguageProvider';
import type { TranslationKey } from '@/lib/i18n';

/**
 * The two shared building blocks that have words of their own.
 *
 * Everything else in `ui.tsx` is given its text by whoever renders it, so it
 * needs no language at all. These two carry sentences, and a sentence needs a
 * translator — which is why they sit here rather than beside their siblings.
 *
 * `ui.tsx` cannot ask for the language itself. It is imported by the live-now
 * screen, which is a client component, so the whole file is compiled into the
 * browser bundle — and `next/headers` in the browser bundle is a build error,
 * not a warning. The one thing `ui.tsx` may not do is read a cookie.
 *
 * So the split runs along the boundary that already exists: these two read the
 * language from React context like every other client component in the
 * console, and `ui.tsx` stays free of anything server-only. What crosses the
 * boundary is a status string and three primitives — never the `Error` object
 * itself, which a Server Component cannot hand to a Client Component at all.
 */

/**
 * The keys are enum identifiers — a lead status, a JobPocket booking or job
 * status — and they are what arrives from the database and the API. Renaming
 * one would stop the pill matching. The `label` beside it is a dictionary key,
 * so the words change with the language and the lookup does not.
 */
const STATUS_STYLES: Record<string, { bg: string; text: string; label: TranslationKey }> = {
  new: { bg: '#e8f1fd', text: '#1c5cab', label: 'shared.status.new' },
  contacted: { bg: '#fdf2e3', text: '#8a5a12', label: 'shared.status.contacted' },
  booked: { bg: '#e6f4ec', text: '#0b5c34', label: 'shared.status.booked' },
  won: { bg: '#e3f3e3', text: '#06600d', label: 'shared.status.won' },
  lost: { bg: '#f4e6e6', text: '#8f2323', label: 'shared.status.lost' },
  spam: { bg: '#eceae6', text: '#635c56', label: 'shared.status.spam' },

  // Booking requests, as JobPocket names them. Without these the pill fell back
  // to grey with the raw enum in it — "PENDING" shouted at the reader in a
  // column where every other row said something a person would say.
  PENDING: { bg: '#fdf2e3', text: '#8a5a12', label: 'shared.status.PENDING' },
  ACCEPTED: { bg: '#e6f4ec', text: '#0b5c34', label: 'shared.status.ACCEPTED' },
  DECLINED: { bg: '#f4e6e6', text: '#8f2323', label: 'shared.status.DECLINED' },
  CANCELLED: { bg: '#eceae6', text: '#635c56', label: 'shared.status.CANCELLED' },

  // And the job it becomes.
  SCHEDULED: { bg: '#e8f1fd', text: '#1c5cab', label: 'shared.status.SCHEDULED' },
  IN_PROGRESS: { bg: '#fdf2e3', text: '#8a5a12', label: 'shared.status.IN_PROGRESS' },
  PAUSED: { bg: '#eceae6', text: '#635c56', label: 'shared.status.PAUSED' },
  COMPLETED: { bg: '#e6f4ec', text: '#0b5c34', label: 'shared.status.COMPLETED' },
  INVOICED: { bg: '#e8f1fd', text: '#1c5cab', label: 'shared.status.INVOICED' },
  PAID: { bg: '#e3f3e3', text: '#06600d', label: 'shared.status.PAID' },
  DRAFT: { bg: '#eceae6', text: '#635c56', label: 'shared.status.DRAFT' },
};

export function StatusPill({ status }: { status: string }) {
  const t = useT();
  const style = STATUS_STYLES[status];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 font-heading text-[10px] font-semibold uppercase tracking-label"
      style={{ backgroundColor: style?.bg ?? '#eceae6', color: style?.text ?? '#635c56' }}
    >
      {/* A status nobody has a word for yet is shown as it arrived. Better a
          raw enum than a blank pill: it names the thing to add here. */}
      {style ? t(style.label) : status}
    </span>
  );
}

/**
 * The words of the database-not-connected screen.
 *
 * Takes the two questions already answered — is the URL missing, are the
 * tables missing — rather than the error, because the matching is done against
 * English text inside a Postgres driver message and that has to stay on the
 * server side of the boundary, in English, where the driver writes it.
 */
export function SetupNoticeBody({
  missingUrl,
  missingTables,
  message,
}: {
  missingUrl: boolean;
  missingTables: boolean;
  message: string;
}) {
  const t = useT();

  return (
    <div className="mx-auto max-w-2xl py-16">
      <h1 className="font-heading text-xl font-bold uppercase tracking-label text-ink">
        {missingUrl
          ? t('shared.setup.noDatabase')
          : missingTables
            ? t('shared.setup.noTables')
            : t('shared.setup.failed')}
      </h1>
      <div className="mt-4 space-y-3 text-sm text-gray-700">
        {missingUrl && (
          <>
            <p>
              {t('shared.setup.copy')}{' '}
              <code className="rounded bg-cream-dark px-1.5 py-0.5">DATABASE_PUBLIC_URL</code>{' '}
              {t('shared.setup.addToVercel')}{' '}
              <code className="rounded bg-cream-dark px-1.5 py-0.5">DATABASE_URL</code>
              {t('shared.setup.andRedeploy')}
            </p>
            <p className="text-gray-500">
              {t('shared.setup.publicOne')}{' '}
              <code className="rounded bg-cream-dark px-1.5 py-0.5">*.railway.internal</code>{' '}
              {t('shared.setup.internalOnly')}
            </p>
          </>
        )}
        {missingTables && (
          <p>
            {t('shared.setup.emptyRun')}{' '}
            <code className="rounded bg-cream-dark px-1.5 py-0.5">
              psql &quot;$DATABASE_PUBLIC_URL&quot; -f db/schema.sql
            </code>{' '}
            {t('shared.setup.once')}
          </p>
        )}
        {/* The driver's own words, untranslated on purpose: they are what gets
            pasted into a search box or handed to whoever can fix it. */}
        {!missingUrl && !missingTables && (
          <p className="rounded-card bg-cream-dark p-3 font-mono text-xs">{message}</p>
        )}
      </div>
    </div>
  );
}
