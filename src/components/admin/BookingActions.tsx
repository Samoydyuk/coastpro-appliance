'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/components/admin/LanguageProvider';

/**
 * Answering a request.
 *
 * Accepting creates the job in JobPocket — the same call the button in the app
 * makes — so both sides end up looking at the same job whichever was pressed.
 * That also means a double press is possible and safe: the server answers a
 * second accept with the job the first one made rather than making another.
 */

const field = 'h-9 rounded-card border border-primary-500/30 bg-[#fcfcfb] px-3 text-sm';

interface Props {
  requestId: string;
  status: string;
  scheduledStart: string | null;
  scheduledEnd: string | null;
}

/** `2026-09-02T17:00:00Z` → the value a datetime-local input wants, in shop time. */
function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: process.env.NEXT_PUBLIC_SHOP_TIMEZONE || 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  // Intl gives "24" for midnight; the input wants "00".
  const hour = get('hour') === '24' ? '00' : get('hour');
  return `${get('year')}-${get('month')}-${get('day')}T${hour}:${get('minute')}`;
}

export function BookingActions({ requestId, status, scheduledStart, scheduledEnd }: Props) {
  const t = useT();
  const router = useRouter();
  const [start, setStart] = useState(toLocalInput(scheduledStart));
  const [busy, setBusy] = useState<'accept' | 'decline' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const answered = status !== 'PENDING';

  const send = async (action: 'accept' | 'decline') => {
    setBusy(action);
    setError(null);
    setDone(null);

    try {
      const response = await fetch(`/api/admin/bookings/${requestId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          action === 'accept' && start
            ? // Sent as an instant, not as wall-clock text: the browser knows
              // its own offset and the server should not have to guess.
              { scheduledStart: new Date(start).toISOString() }
            : {}
        ),
      });

      const body = (await response.json().catch(() => null)) as
        | { error?: string; jobId?: string; alreadyAccepted?: boolean }
        | null;

      if (!response.ok) {
        // The server's own wording, when it has one: it knows what went wrong
        // and this console does not.
        setError(body?.error ?? t('work.answer.failed'));
        return;
      }

      setDone(
        action === 'decline'
          ? t('work.answer.declined')
          : body?.alreadyAccepted
            ? t('work.answer.already')
            : t('work.answer.accepted')
      );
      router.refresh();
    } catch {
      setError(t('work.form.noServer'));
    } finally {
      setBusy(null);
    }
  };

  if (answered) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-gray-600">
          {status === 'ACCEPTED'
            ? t('work.answer.wasAccepted')
            : status === 'DECLINED'
              ? t('work.answer.wasDeclined')
              : t('work.answer.wasCancelled')}
        </p>
        {done && <p className="text-xs" style={{ color: '#006300' }}>{done}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="flex flex-col gap-1">
        <span className="font-heading text-[10px] uppercase tracking-label text-gray-500">
          {t('work.answer.whenToTurnUp')}
        </span>
        <input
          type="datetime-local"
          value={start}
          onChange={(event) => setStart(event.target.value)}
          className={field}
        />
        <span className="text-xs text-gray-500">
          {scheduledStart ? t('work.answer.theirTime') : t('work.answer.noTime')}
        </span>
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => send('accept')}
          disabled={busy !== null}
          className="h-9 rounded-card bg-ink px-4 font-heading text-[10px] font-semibold uppercase tracking-label text-cream disabled:opacity-50"
        >
          {busy === 'accept' ? t('work.answer.accepting') : t('work.answer.accept')}
        </button>
        <button
          type="button"
          onClick={() => send('decline')}
          disabled={busy !== null}
          className="h-9 rounded-card border border-primary-500/30 px-4 font-heading text-[10px] font-semibold uppercase tracking-label text-gray-600 hover:border-ink hover:text-ink disabled:opacity-50"
        >
          {busy === 'decline' ? t('work.answer.declining') : t('work.answer.decline')}
        </button>
      </div>

      {error && <p className="text-xs" style={{ color: '#8f2323' }}>{error}</p>}
      {done && <p className="text-xs" style={{ color: '#006300' }}>{done}</p>}

      <p className="text-xs text-gray-600">{t('work.answer.note')}</p>
    </div>
  );
}
