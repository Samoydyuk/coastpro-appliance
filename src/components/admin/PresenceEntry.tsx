'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PresenceChannel } from '@/lib/presence/store';
import { useT } from '@/components/admin/LanguageProvider';
import type { TranslationKey } from '@/lib/i18n';

/**
 * Typing in the numbers Yelp and Apple will not hand over.
 *
 * One day at a time on purpose. The temptation is a "last 30 days" box, but a
 * single lump against a month cannot be charted, cannot be compared to the
 * previous period, and quietly ruins the day-by-day series the rest of the
 * console is built on. A week of entering yesterday takes a minute in total.
 *
 * The refresh button sits here rather than on its own because it answers the
 * same question — "are these numbers current" — for the half of the screen
 * that fetches itself.
 */
export function PresenceEntry({ channels }: { channels: PresenceChannel[] }) {
  const router = useRouter();
  const t = useT();
  const [open, setOpen] = useState(false);
  const [channelKey, setChannelKey] = useState(channels[0]?.key ?? '');
  const [day, setDay] = useState(() => {
    // Yesterday: today is still moving, and every one of these dashboards
    // restates the current day until it closes.
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const channel = channels.find((c) => c.key === channelKey);

  // The measure names live in the presence catalogue beside the importers, so
  // the dictionary answers by channel and measure; anything added there later
  // keeps its own English rather than showing a key.
  const measureLabel = (channelName: string, measure: { key: string; label: string }) => {
    const key = `marketing.presence.measure.${channelName}.${measure.key}`;
    const text = t(key as TranslationKey);
    return text === key ? measure.label : text;
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!channel) return;
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const measures: Record<string, number> = {};
      for (const measure of channel.measures) {
        measures[measure.key] = Number(values[measure.key] ?? 0) || 0;
      }
      const response = await fetch('/api/admin/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', channel: channel.key, day, measures }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(body?.error ?? t('marketing.msg.couldNotSave'));
        return;
      }
      setValues({});
      setNote(t('marketing.presence.savedDay', { channel: channel.name, day }));
      router.refresh();
    } catch {
      setError(t('marketing.msg.noServer'));
    } finally {
      setBusy(false);
    }
  };

  const refresh = async () => {
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const response = await fetch('/api/admin/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refresh' }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        setError(body?.error ?? t('marketing.presence.refreshFailed'));
        return;
      }
      // Say what actually happened per importer. "Done" would hide a channel
      // that skipped because nobody has added its credentials yet. The channel
      // key and the importer's own message are left exactly as they arrived.
      const outcomes: Array<{ channel: string; rows: number; skipped?: string; error?: string }> =
        body?.outcomes ?? [];
      setNote(
        outcomes
          .map((o) =>
            o.error
              ? `${o.channel}: ${o.error}`
              : o.skipped
                ? `${o.channel}: ${o.skipped}`
                : `${o.channel}: ${t.plural(o.rows, 'plural.day')}`
          )
          .join(' · ') || t('marketing.presence.nothingToFetch')
      );
      router.refresh();
    } catch {
      setError(t('marketing.msg.noServer'));
    } finally {
      setBusy(false);
    }
  };

  const field =
    'h-9 w-full rounded-card border border-primary-500/30 bg-[#fcfcfb] px-3 text-sm';
  const labelText = 'font-heading text-[10px] uppercase tracking-label text-gray-500';
  const button =
    'h-9 rounded-card border border-primary-500/40 px-3 font-heading text-[10px] font-semibold uppercase tracking-label text-ink transition-colors hover:bg-cream-dark/50 disabled:opacity-50';

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={refresh} disabled={busy} className={button}>
          {busy ? t('marketing.presence.working') : t('marketing.presence.refreshFetched')}
        </button>
        {channels.length > 0 && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            disabled={busy}
            className={button}
          >
            {open ? t('marketing.action.close') : t('marketing.presence.enterByHand')}
          </button>
        )}
      </div>

      {note && <p className="max-w-md text-right text-[11px] text-gray-600">{note}</p>}
      {error && <p className="max-w-md text-right text-[11px] text-red-800">{error}</p>}

      {open && channel && (
        <form
          onSubmit={save}
          className="w-full min-w-[19rem] rounded-card border border-primary-500/25 bg-cream-light p-4 text-left sm:w-auto"
        >
          <div className="flex flex-wrap gap-3">
            <label className="flex flex-col gap-1">
              <span className={labelText}>{t('marketing.presence.listing')}</span>
              <select
                value={channelKey}
                onChange={(event) => {
                  setChannelKey(event.target.value);
                  setValues({});
                }}
                className={`${field} w-48`}
              >
                {channels.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelText}>{t('marketing.col.day')}</span>
              <input
                type="date"
                value={day}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(event) => setDay(event.target.value)}
                required
                className={`${field} w-40`}
              />
            </label>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {channel.measures.map((measure) => (
              <label key={measure.key} className="flex flex-col gap-1">
                <span className={labelText}>{measureLabel(channel.key, measure)}</span>
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={values[measure.key] ?? ''}
                  onChange={(event) =>
                    setValues((prev) => ({ ...prev, [measure.key]: event.target.value }))
                  }
                  placeholder="0"
                  className={field}
                />
              </label>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between gap-4">
            <p className="text-[11px] text-gray-500">{t('marketing.presence.blankZero')}</p>
            <button type="submit" disabled={busy} className={button}>
              {busy ? t('marketing.presence.saving') : t('marketing.presence.saveDay')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
