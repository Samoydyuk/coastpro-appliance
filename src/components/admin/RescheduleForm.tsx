'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Moving a visit.
 *
 * The windows offered are the ones the booking page is showing, because most
 * of the time that is what you want. They are not a limit — a dispatcher
 * moving somebody's own van is not bound by what the website happens to be
 * advertising, so any time can be typed in.
 *
 * A clash with another visit is reported and then allowed. Two an hour apart
 * is sometimes deliberate, and a tool that refuses is a tool people work
 * around.
 */

const field = 'h-9 w-full rounded-card border border-primary-500/30 bg-[#fcfcfb] px-3 text-sm';

interface ArrivalWindow {
  label: string;
  startISO: string;
  endISO: string;
}

function nextDays(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate()
    ).padStart(2, '0')}`;
    return {
      value,
      weekday: i === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' }),
      day: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
  });
}

export function RescheduleForm({ jobId, canMove }: { jobId: string; canMove: boolean }) {
  const router = useRouter();

  const days = useRef(nextDays(21)).current;
  const [date, setDate] = useState(days[0].value);
  const [windows, setWindows] = useState<ArrivalWindow[]>([]);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState<ArrivalWindow | null>(null);
  const [exactTime, setExactTime] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [clash, setClash] = useState<string | null>(null);

  useEffect(() => {
    if (!canMove) return;
    let cancelled = false;
    setLoading(true);
    setPicked(null);

    fetch(`/api/booking/windows?date=${date}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setWindows(d.windows ?? []);
      })
      .catch(() => {
        if (!cancelled) setWindows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [date, canMove]);

  if (!canMove) {
    return (
      <p className="text-sm text-gray-600">
        This job is finished or called off. Reopen it in the app before moving it.
      </p>
    );
  }

  const submit = async () => {
    const when = picked?.startISO ?? (exactTime ? new Date(exactTime).toISOString() : null);
    if (!when) {
      setError('Pick a window or set a time.');
      return;
    }

    setBusy(true);
    setError(null);
    setDone(null);
    setClash(null);

    try {
      const response = await fetch(`/api/admin/jobs/${jobId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledAt: when,
          ...(picked
            ? {
                estimatedDuration: Math.round(
                  (new Date(picked.endISO).getTime() - new Date(picked.startISO).getTime()) / 60000
                ),
              }
            : {}),
        }),
      });

      const body = (await response.json().catch(() => null)) as
        | { error?: string; warning?: { jobType?: string; scheduledAt?: string } }
        | null;

      if (!response.ok) {
        setError(body?.error ?? 'Could not move that visit.');
        return;
      }

      setDone('Moved. The technician has been told and the app has it already.');
      if (body?.warning) {
        setClash(
          `Note: there is another visit within the hour${
            body.warning.jobType ? ` (${body.warning.jobType})` : ''
          }. Moved anyway.`
        );
      }
      setPicked(null);
      setExactTime('');
      router.refresh();
    } catch {
      setError('Could not reach the server.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* -mx-1/px-1 so the focus ring of the first chip is not clipped */}
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-2">
        {days.map((d) => (
          <button
            key={d.value}
            type="button"
            onClick={() => setDate(d.value)}
            className={`shrink-0 rounded-card border px-2.5 py-2 text-center transition-colors ${
              date === d.value
                ? 'border-ink bg-ink text-cream'
                : 'border-primary-500/25 text-gray-600 hover:border-ink hover:text-ink'
            }`}
          >
            <span className="block font-heading text-[9px] font-semibold uppercase tracking-label">
              {d.weekday}
            </span>
            <span className="mt-0.5 block text-xs">{d.day}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-xs text-gray-600">Checking the calendar…</p>
      ) : windows.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {windows.map((w) => (
            <button
              key={w.startISO}
              type="button"
              onClick={() => {
                setPicked(picked?.startISO === w.startISO ? null : w);
                setExactTime('');
              }}
              className={`rounded-card border px-2 py-2 font-heading text-[10px] font-semibold uppercase tracking-label transition-colors ${
                picked?.startISO === w.startISO
                  ? 'border-ink bg-ink text-cream'
                  : 'border-primary-500/25 text-ink hover:border-ink'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-600">
          No free windows that day on the booking page. Set a time below instead.
        </p>
      )}

      <label className="flex flex-col gap-1">
        <span className="font-heading text-[10px] uppercase tracking-label text-gray-500">
          Or a time of your own
        </span>
        <input
          type="datetime-local"
          value={exactTime}
          onChange={(e) => {
            setExactTime(e.target.value);
            setPicked(null);
          }}
          className={field}
        />
      </label>

      <button
        type="button"
        onClick={submit}
        disabled={busy || (!picked && !exactTime)}
        className="h-9 w-full rounded-card bg-ink px-4 font-heading text-[10px] font-semibold uppercase tracking-label text-cream disabled:opacity-50"
      >
        {busy ? 'Moving…' : 'Move the visit'}
      </button>

      {error && <p className="text-xs" style={{ color: '#8f2323' }}>{error}</p>}
      {done && <p className="text-xs" style={{ color: '#006300' }}>{done}</p>}
      {clash && <p className="text-xs" style={{ color: '#8a5a12' }}>{clash}</p>}
    </div>
  );
}
