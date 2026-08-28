'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Who is going.
 *
 * A checklist rather than a picker, because a visit can genuinely need two
 * people and the app has always allowed it. Clearing everything is a real
 * choice — an unassigned job is the one a dispatcher looks for first, not an
 * error state.
 */
export function AssignForm({
  jobId,
  team,
  current,
}: {
  jobId: string;
  team: { id: string; name: string; isYou: boolean }[];
  current: string[];
}) {
  const router = useRouter();
  const [picked, setPicked] = useState<string[]>(current);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  if (team.length === 0) {
    return (
      <p className="text-sm text-gray-600">
        No team yet. Add somebody in the app and they will appear here as a lane on the calendar.
      </p>
    );
  }

  const toggle = (id: string) =>
    setPicked((was) => (was.includes(id) ? was.filter((x) => x !== id) : [...was, id]));

  const unchanged =
    picked.length === current.length && picked.every((id) => current.includes(id));

  const save = async () => {
    setBusy(true);
    setError(null);
    setDone(null);

    try {
      const response = await fetch(`/api/admin/jobs/${jobId}/assignee`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamMemberIds: picked }),
      });

      const body = (await response.json().catch(() => null)) as
        | { error?: string; newlyAdded?: string[] }
        | null;

      if (!response.ok) {
        setError(body?.error ?? 'Could not change who is going.');
        return;
      }

      setDone(
        body?.newlyAdded?.length
          ? 'Saved. They have been told.'
          : picked.length === 0
            ? 'Taken off everybody.'
            : 'Saved.'
      );
      router.refresh();
    } catch {
      setError('Could not reach the server.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        {team.map((member) => (
          <label key={member.id} className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={picked.includes(member.id)}
              onChange={() => toggle(member.id)}
              className="h-4 w-4 rounded border-primary-500/40"
            />
            {member.name}
            {member.isYou && <span className="text-xs text-gray-500">(you)</span>}
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={save}
        disabled={busy || unchanged}
        className="h-9 w-full rounded-card bg-ink px-4 font-heading text-[10px] font-semibold uppercase tracking-label text-cream disabled:opacity-50"
      >
        {busy ? 'Saving…' : picked.length === 0 ? 'Take it off everybody' : 'Save'}
      </button>

      {error && <p className="text-xs" style={{ color: '#8f2323' }}>{error}</p>}
      {done && <p className="text-xs" style={{ color: '#006300' }}>{done}</p>}
    </div>
  );
}
