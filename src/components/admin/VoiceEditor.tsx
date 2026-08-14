'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { BrandVoice } from '@/lib/marketing/voice';

const field =
  'w-full rounded-card border border-primary-500/30 bg-[#fcfcfb] p-3 text-sm leading-relaxed';
const legend = 'font-heading text-[10px] uppercase tracking-label text-gray-500';

/** How the drafts sound, and what they are allowed to assert. */
export function VoiceEditor({ voice }: { voice: BrandVoice }) {
  const router = useRouter();
  const [form, setForm] = useState({
    businessName: voice.businessName,
    serviceArea: voice.serviceArea,
    tone: voice.tone,
    callToAction: voice.callToAction,
    facts: voice.facts.join('\n'),
    forbidden: voice.forbidden.join('\n'),
  });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (event: { target: { value: string } }) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setSaved(false);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/marketing/voice', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? 'Could not save.');
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError('Could not reach the server.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className={legend}>Business name</span>
          <input value={form.businessName} onChange={set('businessName')} className={field} />
        </label>
        <label className="flex flex-col gap-1">
          <span className={legend}>Service area</span>
          <input value={form.serviceArea} onChange={set('serviceArea')} className={field} />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className={legend}>How it should read</span>
        <textarea value={form.tone} onChange={set('tone')} rows={5} className={field} />
      </label>

      <label className="flex flex-col gap-1">
        <span className={legend}>Call to action</span>
        <input value={form.callToAction} onChange={set('callToAction')} className={field} />
      </label>

      <label className="flex flex-col gap-1">
        <span className={legend}>Facts a draft may state — one per line</span>
        <textarea value={form.facts} onChange={set('facts')} rows={6} className={field} />
        <span className="text-[11px] leading-relaxed text-gray-500">
          This is the whole list. Anything about the business that is not here, and anything
          about the repair that is not in the job&rsquo;s own data, is an invention — and a
          number that appears in a draft from neither source is flagged before you read past it.
        </span>
      </label>

      <label className="flex flex-col gap-1">
        <span className={legend}>Never write — one per line</span>
        <textarea value={form.forbidden} onChange={set('forbidden')} rows={6} className={field} />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="h-9 rounded-card bg-ink px-4 font-heading text-[10px] font-semibold uppercase tracking-label text-cream disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
        {saved && <span className="text-xs text-gray-500">Saved</span>}
        {error && <span className="text-xs text-red-700">{error}</span>}
      </div>
    </form>
  );
}
