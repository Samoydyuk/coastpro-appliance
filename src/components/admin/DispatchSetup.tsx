'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/components/admin/LanguageProvider';

/**
 * Setting the desk up.
 *
 * Two switches, deliberately separate, because the pair is what people get
 * wrong: a seat that exists but is not in the ring group looks entirely set up
 * and rings for nobody.
 */
export function DispatchSetup({
  seat,
  ringing,
}: {
  seat: { id: string; name: string } | null;
  ringing: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const send = async (action: string, body: unknown = {}) => {
    setBusy(action);
    setError(null);
    try {
      const response = await fetch(`/api/admin/dispatch/${action}`, {
        method: action === 'ringing' ? 'POST' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const parsed = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(parsed?.error ?? t('settings.desk.failed'));
        return;
      }
      router.refresh();
    } catch {
      setError(t('settings.unreachable'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span
          aria-hidden
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: seat ? '#0ca30c' : '#898781' }}
        />
        <span className="text-sm text-ink">
          {seat
            ? t('settings.desk.seatReady', { name: seat.name })
            : t('settings.desk.noSeat')}
        </span>
        {!seat && (
          <button
            type="button"
            onClick={() => send('seat')}
            disabled={busy !== null}
            className="h-9 rounded-card bg-ink px-4 font-heading text-[10px] font-semibold uppercase tracking-label text-cream disabled:opacity-50"
          >
            {busy === 'seat' ? t('settings.desk.creating') : t('settings.desk.createSeat')}
          </button>
        )}
      </div>

      {seat && (
        <div className="flex flex-wrap items-center gap-3">
          <span
            aria-hidden
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: ringing ? '#0ca30c' : '#fab219' }}
          />
          <span className="text-sm text-ink">
            {ringing ? t('settings.desk.ringing') : t('settings.desk.notRinging')}
          </span>
          <button
            type="button"
            onClick={() => send('ringing', { ringing: !ringing })}
            disabled={busy !== null}
            className="h-9 rounded-card border border-primary-500/30 px-4 font-heading text-[10px] font-semibold uppercase tracking-label text-gray-600 hover:border-ink hover:text-ink disabled:opacity-50"
          >
            {busy === 'ringing'
              ? t('settings.desk.saving')
              : ringing
                ? t('settings.desk.stopRinging')
                : t('settings.desk.startRinging')}
          </button>
        </div>
      )}

      {error && <p className="text-xs" style={{ color: '#8f2323' }}>{error}</p>}

      {/* The quoted button is the one in the call bar at the top of the page,
          so it is interpolated rather than written out twice. */}
      <p className="text-xs text-gray-600">
        {t('settings.desk.hint', { button: t('settings.desk.takeCalls') })}
      </p>
    </div>
  );
}
