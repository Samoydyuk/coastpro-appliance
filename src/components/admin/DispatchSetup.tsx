'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
        setError(parsed?.error ?? 'That did not go through.');
        return;
      }
      router.refresh();
    } catch {
      setError('Could not reach the server.');
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
          {seat ? `Seat ready — ${seat.name}` : 'No dispatcher seat yet'}
        </span>
        {!seat && (
          <button
            type="button"
            onClick={() => send('seat')}
            disabled={busy !== null}
            className="h-9 rounded-card bg-ink px-4 font-heading text-[10px] font-semibold uppercase tracking-label text-cream disabled:opacity-50"
          >
            {busy === 'seat' ? 'Creating…' : 'Create the seat'}
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
            {ringing
              ? 'Calls ring at the desk as well as the phone'
              : 'The seat exists but no calls reach it yet'}
          </span>
          <button
            type="button"
            onClick={() => send('ringing', { ringing: !ringing })}
            disabled={busy !== null}
            className="h-9 rounded-card border border-primary-500/30 px-4 font-heading text-[10px] font-semibold uppercase tracking-label text-gray-600 hover:border-ink hover:text-ink disabled:opacity-50"
          >
            {busy === 'ringing' ? 'Saving…' : ringing ? 'Stop ringing here' : 'Ring here too'}
          </button>
        </div>
      )}

      {error && <p className="text-xs" style={{ color: '#8f2323' }}>{error}</p>}

      <p className="text-xs text-gray-600">
        The seat is an identity for the phone system to route to — it has no email and no phone
        number, so nobody can sign into it. Whoever is at the desk presses &ldquo;Take calls
        here&rdquo; in the bar at the top; closing the tab sends the next call to the phone.
      </p>
    </div>
  );
}
