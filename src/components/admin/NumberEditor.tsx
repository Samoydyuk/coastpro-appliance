'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PAID_CHANNELS, type Channel } from '@/lib/attribution';
import { useT } from '@/components/admin/LanguageProvider';
import type { TranslationKey } from '@/lib/i18n';

/**
 * The unpaid sources still worth their own number: someone who found the site
 * on Google, typed the address in, or was sent by a neighbour.
 */
const UNPAID_CHANNELS: Channel[] = ['google_organic', 'direct', 'referral'];

/** Adding and retiring tracking numbers. */
export function NumberEditor() {
  const t = useT();
  const router = useRouter();
  const [number, setNumber] = useState('');
  const [channel, setChannel] = useState('google_ads');
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/numbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number, channel, label }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(body?.error ?? t('settings.numbers.saveFailed'));
        return;
      }
      setNumber('');
      setLabel('');
      router.refresh();
    } catch {
      setError(t('settings.unreachable'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1">
        <span className="font-heading text-[10px] uppercase tracking-label text-gray-500">
          {t('settings.numbers.number')}
        </span>
        <input
          type="tel"
          value={number}
          onChange={(event) => setNumber(event.target.value)}
          placeholder="(949) 555-0142"
          required
          className="h-9 w-44 rounded-card border border-primary-500/30 bg-[#fcfcfb] px-3 text-sm"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-heading text-[10px] uppercase tracking-label text-gray-500">
          {t('settings.numbers.shownTo')}
        </span>
        {/* The option values are channel keys and stay in English — they are
            what gets stored and joined on. Only the names shown are translated,
            and they come from the same `marketing.channel.*` entries the
            channels report reads, so a number can never be filed under one name
            here and listed under another there. `default` is not a channel: it
            is the number everyone unmatched sees. */}
        <select
          value={channel}
          onChange={(event) => setChannel(event.target.value)}
          className="h-9 rounded-card border border-primary-500/30 bg-[#fcfcfb] px-3 text-sm"
        >
          {[...PAID_CHANNELS, ...UNPAID_CHANNELS].map((entry) => (
            <option key={entry} value={entry}>
              {t(`marketing.channel.${entry}` as TranslationKey)}
            </option>
          ))}
          <option value="default">{t('settings.numbers.fallback')}</option>
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-heading text-[10px] uppercase tracking-label text-gray-500">
          {t('settings.numbers.label')}
        </span>
        <input
          type="text"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder={t('settings.numbers.labelPlaceholder')}
          className="h-9 w-48 rounded-card border border-primary-500/30 bg-[#fcfcfb] px-3 text-sm"
        />
      </label>

      <button
        type="submit"
        disabled={busy}
        className="h-9 rounded-card bg-ink px-4 font-heading text-[10px] font-semibold uppercase tracking-label text-cream disabled:opacity-50"
      >
        {t('settings.numbers.add')}
      </button>

      {error && <span className="h-9 self-end text-xs leading-9 text-[#8f2323]">{error}</span>}
    </form>
  );
}

export function RetireNumberButton({ id }: { id: string }) {
  const t = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await fetch(`/api/admin/numbers?id=${id}`, { method: 'DELETE' }).catch(() => null);
        setBusy(false);
        router.refresh();
      }}
      className="font-heading text-[10px] uppercase tracking-label text-gray-500 hover:text-[#8f2323]"
    >
      {t('settings.numbers.retire')}
    </button>
  );
}
