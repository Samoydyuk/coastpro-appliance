'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const SCOPES = [
  { value: 'operations', label: 'Bookings and calendar' },
  { value: 'website', label: 'Website leads' },
  { value: 'marketing', label: 'Marketing' },
] as const;

const field =
  'h-9 rounded-card border border-primary-500/30 bg-[#fcfcfb] px-3 text-sm';

/**
 * Pasting a JobPocket key.
 *
 * Rotation is the operation that has to be quick — the moment a key is replaced
 * in JobPocket the old one is dead, and until the new one is here every request
 * from this console is rejected. That used to mean opening `psql`.
 *
 * The key is checked against JobPocket before it is saved, sealed on the way
 * into the database, and never comes back to this screen.
 */
export function IntegrationKeyEditor() {
  const router = useRouter();
  const [scope, setScope] = useState<string>('operations');
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(null);

    try {
      const response = await fetch('/api/admin/integration-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope, key: key.trim() }),
      });

      const body = (await response.json().catch(() => null)) as
        | { error?: string; masked?: string; label?: string }
        | null;

      if (!response.ok) {
        setError(body?.error ?? 'Could not save that key.');
        return;
      }

      setKey('');
      setSaved(`${body?.label ?? 'Key'} saved — ${body?.masked ?? ''}`);
      router.refresh();
    } catch {
      setError('Could not reach the server.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="font-heading text-[10px] uppercase tracking-label text-gray-500">
            What for
          </span>
          <select
            value={scope}
            onChange={(event) => setScope(event.target.value)}
            className={field}
          >
            {SCOPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-w-[280px] flex-1 flex-col gap-1">
          <span className="font-heading text-[10px] uppercase tracking-label text-gray-500">
            Key
          </span>
          <input
            type="password"
            value={key}
            onChange={(event) => setKey(event.target.value)}
            placeholder="jpk_…"
            autoComplete="off"
            spellCheck={false}
            className={`${field} font-mono`}
          />
        </label>

        <button
          type="submit"
          disabled={busy || key.trim().length === 0}
          className="h-9 rounded-card bg-ink px-4 font-heading text-[10px] font-semibold uppercase tracking-label text-cream disabled:opacity-50"
        >
          {busy ? 'Checking…' : 'Save key'}
        </button>
      </div>

      {error && <p className="text-xs" style={{ color: '#8f2323' }}>{error}</p>}
      {saved && <p className="text-xs" style={{ color: '#006300' }}>{saved}</p>}

      <p className="text-xs text-gray-600">
        JobPocket → Settings → Integrations → the scope you want → Switch on, then copy the key it
        shows once. It is checked here before it is stored, so a mistyped key is refused now rather
        than showing up later as an empty screen.
      </p>
    </form>
  );
}
