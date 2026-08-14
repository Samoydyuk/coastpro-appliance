'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Writing, reading and correcting the drafts for one job.
 *
 * One panel per channel, all of them closed until asked for. Writing produces
 * a draft and stops there; publishing is a separate, deliberate press, offered
 * only for the article, and only the website is a destination. Nothing here
 * posts to anyone else's platform on the owner's behalf.
 */

export interface ContentPiece {
  channel: string;
  status: string;
  slug: string | null;
  title: string | null;
  metaTitle: string | null;
  metaDesc: string | null;
  generatedBody: string | null;
  editedBody: string | null;
  model: string | null;
  flags: Array<{ label: string; excerpt: string }>;
  updatedAt: string | null;
  history: Array<{ id: string; at: string; source: string; model: string | null }>;
}

interface Props {
  jobId: string;
  channels: Array<{ key: string; label: string }>;
  pieces: ContentPiece[];
}

const button =
  'h-8 rounded-card px-3 font-heading text-[10px] font-semibold uppercase tracking-label disabled:opacity-50';

export function MarketingContent({ jobId, channels, pieces }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(pieces[0]?.channel ?? null);
  const [busy, setBusy] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<string | null>(null);

  const skip = async (channel: string) => {
    setBusy(channel);
    try {
      await fetch('/api/admin/marketing/skip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, channel }),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  const publish = async (channel: string, action: 'publish' | 'unpublish') => {
    setBusy(channel);
    setErrors((current) => ({ ...current, [channel]: '' }));
    try {
      const response = await fetch('/api/admin/marketing/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, channel, action }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setErrors((current) => ({ ...current, [channel]: data?.error ?? 'Could not change it.' }));
        return;
      }
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  const byChannel = new Map(pieces.map((piece) => [piece.channel, piece]));

  const write = async (channel: string) => {
    setBusy(channel);
    setErrors((current) => ({ ...current, [channel]: '' }));
    try {
      const response = await fetch('/api/admin/marketing/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, channel }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setErrors((current) => ({ ...current, [channel]: data?.error ?? 'Could not write anything.' }));
        return;
      }
      setOpen(channel);
      router.refresh();
    } catch {
      setErrors((current) => ({ ...current, [channel]: 'Could not reach the server.' }));
    } finally {
      setBusy(null);
    }
  };

  const save = async (channel: string) => {
    setBusy(channel);
    try {
      const response = await fetch('/api/admin/marketing/content', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, channel, body: edits[channel] ?? '' }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setErrors((current) => ({ ...current, [channel]: data?.error ?? 'Could not save.' }));
        return;
      }
      setSaved(channel);
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="divide-y divide-primary-500/15">
      {channels.map((channel) => {
        const piece = byChannel.get(channel.key);
        const text = piece?.editedBody ?? piece?.generatedBody ?? '';
        const isOpen = open === channel.key;
        const working = busy === channel.key;

        return (
          <div key={channel.key} className="py-3 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : channel.key)}
                className="flex items-center gap-3 text-left"
              >
                <span className="text-sm font-medium text-ink">{channel.label}</span>
                <span className="font-heading text-[10px] uppercase tracking-label text-gray-500">
                  {piece ? piece.status : 'nothing written'}
                </span>
                {piece && piece.flags.length > 0 && (
                  <span className="font-heading text-[10px] uppercase tracking-label text-amber-700">
                    {piece.flags.length} to check
                  </span>
                )}
              </button>

              <div className="flex items-center gap-2">
                {!piece && (
                  <button
                    type="button"
                    onClick={() => skip(channel.key)}
                    disabled={working}
                    className={`${button} text-gray-500 hover:text-ink`}
                  >
                    Skip
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => write(channel.key)}
                  disabled={working}
                  className={`${button} ${piece ? 'border border-primary-500/30 text-gray-600 hover:border-ink hover:text-ink' : 'bg-ink text-cream'}`}
                >
                  {working ? 'Writing…' : piece ? 'Write again' : 'Write'}
                </button>
              </div>
            </div>

            {errors[channel.key] && (
              <p className="mt-2 text-xs leading-relaxed text-red-700">{errors[channel.key]}</p>
            )}

            {isOpen && piece && (
              <div className="mt-3 space-y-3">
                {piece.title && (
                  <p className="text-sm font-medium text-ink">{piece.title}</p>
                )}
                {piece.metaDesc && (
                  <p className="text-xs italic text-gray-500">{piece.metaDesc}</p>
                )}

                {piece.flags.length > 0 && (
                  <ul className="rounded-card border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    {piece.flags.map((flag, index) => (
                      <li key={index}>
                        {flag.label}
                        {flag.excerpt && flag.excerpt !== '—' ? `: “${flag.excerpt}”` : ''}
                      </li>
                    ))}
                  </ul>
                )}

                <textarea
                  value={edits[channel.key] ?? text}
                  onChange={(event) =>
                    setEdits((current) => ({ ...current, [channel.key]: event.target.value }))
                  }
                  rows={Math.min(24, Math.max(6, text.split('\n').length + 2))}
                  className="w-full rounded-card border border-primary-500/30 bg-[#fcfcfb] p-3 font-mono text-xs leading-relaxed"
                />

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => save(channel.key)}
                    disabled={working}
                    className={`${button} bg-ink text-cream`}
                  >
                    Save my version
                  </button>
                  {saved === channel.key && (
                    <span className="text-xs text-gray-500">Saved</span>
                  )}

                  {/* Only the article goes anywhere from this screen. A social
                      draft is copied out by hand, because posting to somebody's
                      Instagram for them is a different kind of act. */}
                  {channel.key === 'article' && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          publish(channel.key, piece.status === 'published' ? 'unpublish' : 'publish')
                        }
                        disabled={working}
                        className={`${button} border border-primary-500/30 text-gray-600 hover:border-ink hover:text-ink`}
                      >
                        {piece.status === 'published' ? 'Take it down' : 'Put it on the site'}
                      </button>
                      {piece.status === 'published' && piece.slug && (
                        <a
                          href={`/blog/${piece.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-heading text-[10px] uppercase tracking-label text-primary-600 underline-offset-2 hover:underline"
                        >
                          View it
                        </a>
                      )}
                    </>
                  )}
                  <span className="ml-auto text-[11px] text-gray-500">
                    {piece.model ? `Written by ${piece.model}` : ''}
                    {piece.editedBody ? ' · edited by hand' : ''}
                  </span>
                </div>

                {piece.history.length > 1 && (
                  <details className="text-[11px] text-gray-500">
                    <summary className="cursor-pointer font-heading uppercase tracking-label">
                      {piece.history.length} versions
                    </summary>
                    <ul className="mt-2 space-y-1">
                      {piece.history.map((version) => (
                        <li key={version.id}>
                          {new Date(version.at).toLocaleString()} —{' '}
                          {version.source === 'human' ? 'saved by hand' : version.model || 'model'}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
