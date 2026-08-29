'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useT } from '@/components/admin/LanguageProvider';

/**
 * The one place in the console where data is written by hand.
 *
 * Status and job value are not decoration — they are the only source of truth
 * for what a channel is actually worth, and they are what gets pushed back to
 * the ad platforms. Everything else on this screen is observed; this is judged.
 */

/**
 * The key is what is written to the database and read back by every report;
 * only the label is a dictionary key. Saving a translated word here would
 * write a status nothing else recognises.
 */
const STATUSES = [
  { key: 'new', label: 'work.leadStatus.new' },
  { key: 'contacted', label: 'work.leadStatus.contacted' },
  { key: 'booked', label: 'work.leadStatus.booked' },
  { key: 'won', label: 'work.leadStatus.won' },
  { key: 'lost', label: 'work.leadStatus.lost' },
  { key: 'spam', label: 'work.leadStatus.spam' },
] as const;

export function LeadEditor({
  leadId,
  status,
  valueCents,
  notes,
}: {
  leadId: string;
  status: string;
  valueCents: number | null;
  notes: string | null;
}) {
  const t = useT();
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState(status);
  const [value, setValue] = useState(valueCents ? String(valueCents / 100) : '');
  const [note, setNote] = useState(notes ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (patch: Record<string, unknown>) => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(body?.error ?? t('work.editor.saveFailed'));
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } catch {
      setError(t('work.form.noServer'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="font-heading text-[10px] uppercase tracking-label text-gray-500">
          {t('common.status')}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {STATUSES.map((entry) => (
            <button
              key={entry.key}
              type="button"
              disabled={saving}
              onClick={() => {
                setCurrentStatus(entry.key);
                save({ status: entry.key });
              }}
              className={cn(
                'rounded-card border px-3 py-1.5 font-heading text-[10px] font-semibold uppercase tracking-label transition-colors',
                currentStatus === entry.key
                  ? 'border-ink bg-ink text-cream'
                  : 'border-primary-500/25 text-gray-600 hover:border-ink hover:text-ink'
              )}
            >
              {t(entry.label)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="font-heading text-[10px] uppercase tracking-label text-gray-500">
          {t('work.editor.jobValue')}
        </label>
        <div className="mt-2 flex gap-2">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
              $
            </span>
            <input
              type="number"
              min="0"
              step="1"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              className="h-9 w-36 rounded-card border border-primary-500/30 bg-[#fcfcfb] pl-7 pr-3 text-sm tabular-nums"
              placeholder="0"
            />
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              save({ valueCents: value === '' ? null : Math.round(Number(value) * 100) })
            }
            className="h-9 rounded-card bg-ink px-4 font-heading text-[10px] font-semibold uppercase tracking-label text-cream disabled:opacity-50"
          >
            {t('work.form.save')}
          </button>
        </div>
        <p className="mt-1.5 text-xs text-gray-500">{t('work.editor.valueHint')}</p>
      </div>

      <div>
        <label className="font-heading text-[10px] uppercase tracking-label text-gray-500">
          {t('work.editor.notes')}
        </label>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          onBlur={() => note !== (notes ?? '') && save({ notes: note })}
          rows={4}
          className="mt-2 w-full rounded-card border border-primary-500/30 bg-[#fcfcfb] p-3 text-sm"
          placeholder={t('work.editor.notesPlaceholder')}
        />
      </div>

      <div className="h-4 text-xs">
        {error && <span className="text-[#8f2323]">{error}</span>}
        {saved && !error && <span className="text-[#006300]">{t('work.form.saved')}</span>}
      </div>
    </div>
  );
}
