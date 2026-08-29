'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PAID_CHANNELS } from '@/lib/attribution';
import { useT } from '@/components/admin/LanguageProvider';
import type { TranslationKey } from '@/lib/i18n';

/**
 * Entering what the advertising cost.
 *
 * Typed in by hand because that is honest about where the number comes from —
 * and because a figure copied off the invoice once a week is more reliable than
 * an API integration that silently stops refreshing. One row per day per
 * campaign; re-saving the same day and campaign overwrites it.
 */
export function SpendEditor() {
  const router = useRouter();
  const t = useT();
  const [day, setDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [channel, setChannel] = useState<string>('google_ads');
  const [campaign, setCampaign] = useState('');
  const [cost, setCost] = useState('');
  const [clicks, setClicks] = useState('');
  const [impressions, setImpressions] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/spend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day,
          channel,
          campaign: campaign.trim(),
          costCents: Math.round(Number(cost) * 100),
          clicks: clicks === '' ? null : Number(clicks),
          impressions: impressions === '' ? null : Number(impressions),
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(body?.error ?? t('marketing.msg.couldNotSave'));
        return;
      }
      setMessage(t('marketing.msg.saved'));
      setCost('');
      setClicks('');
      setImpressions('');
      router.refresh();
    } catch {
      setError(t('marketing.msg.noServer'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <Field label={t('marketing.col.day')}>
        <input
          type="date"
          value={day}
          onChange={(event) => setDay(event.target.value)}
          required
          className="h-9 rounded-card border border-primary-500/30 bg-[#fcfcfb] px-3 text-sm"
        />
      </Field>

      <Field label={t('marketing.col.channel')}>
        <select
          value={channel}
          onChange={(event) => setChannel(event.target.value)}
          className="h-9 rounded-card border border-primary-500/30 bg-[#fcfcfb] px-3 text-sm"
        >
          {/* The value posted is the slug; only the label is translated. */}
          {PAID_CHANNELS.map((entry) => (
            <option key={entry} value={entry}>
              {t(`marketing.channel.${entry}` as TranslationKey)}
            </option>
          ))}
        </select>
      </Field>

      <Field label={t('marketing.spend.campaignOptional')}>
        <input
          type="text"
          value={campaign}
          onChange={(event) => setCampaign(event.target.value)}
          placeholder={t('marketing.spend.campaignPlaceholder')}
          className="h-9 w-56 rounded-card border border-primary-500/30 bg-[#fcfcfb] px-3 text-sm"
        />
      </Field>

      <Field label={t('marketing.col.cost')}>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
            $
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={cost}
            onChange={(event) => setCost(event.target.value)}
            required
            className="h-9 w-28 rounded-card border border-primary-500/30 bg-[#fcfcfb] pl-7 pr-3 text-sm tabular-nums"
          />
        </div>
      </Field>

      <Field label={t('marketing.col.clicks')}>
        <input
          type="number"
          min="0"
          value={clicks}
          onChange={(event) => setClicks(event.target.value)}
          className="h-9 w-24 rounded-card border border-primary-500/30 bg-[#fcfcfb] px-3 text-sm tabular-nums"
        />
      </Field>

      <Field label={t('marketing.col.impressions')}>
        <input
          type="number"
          min="0"
          value={impressions}
          onChange={(event) => setImpressions(event.target.value)}
          className="h-9 w-28 rounded-card border border-primary-500/30 bg-[#fcfcfb] px-3 text-sm tabular-nums"
        />
      </Field>

      <button
        type="submit"
        disabled={busy}
        className="h-9 rounded-card bg-ink px-4 font-heading text-[10px] font-semibold uppercase tracking-label text-cream disabled:opacity-50"
      >
        {t('marketing.action.save')}
      </button>

      <span className="h-9 self-end text-xs leading-9">
        {error && <span className="text-[#8f2323]">{error}</span>}
        {message && !error && <span className="text-[#006300]">{message}</span>}
      </span>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-heading text-[10px] uppercase tracking-label text-gray-500">
        {label}
      </span>
      {children}
    </label>
  );
}
