'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PhotoEditor, type EditRecipe } from '@/components/admin/PhotoEditor';

/**
 * Choosing which photos go out with a piece, and in what order.
 *
 * Every picture here has already been released twice — once for the job, once
 * for the photo — so this is not a privacy control. It is an editorial one:
 * four shots of the same drain hose is worse than one, and the order is the
 * order they appear on the page.
 */

export interface PhotoChoice {
  id: string;
  caption: string | null;
  selected: boolean;
  sortOrder: number;
  altText: string | null;
  /** What was done to it last time, so an edit can be reopened rather than
   *  started again. */
  editRecipe?: EditRecipe | null;
  editedRev?: string | null;
}

export function MarketingPhotos({ jobId, photos }: { jobId: string; photos: PhotoChoice[] }) {
  const [editing, setEditing] = useState<PhotoChoice | null>(null);
  const router = useRouter();
  const [chosen, setChosen] = useState<string[]>(
    photos
      .filter((photo) => photo.selected)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((photo) => photo.id)
  );
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggle = (id: string) => {
    setSaved(false);
    setChosen((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]
    );
  };

  /** Move a chosen photo to the front — it becomes the one that leads. */
  const makeMain = (id: string) => {
    setSaved(false);
    setChosen((current) => [id, ...current.filter((entry) => entry !== id)]);
  };

  const save = async () => {
    setBusy(true);
    try {
      const response = await fetch('/api/admin/marketing/photos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          selection: photos.map((photo) => ({
            photoId: photo.id,
            selected: chosen.includes(photo.id),
            // The order is the order they were picked in, which is what the
            // numbered badge on each tile is showing.
            sortOrder: chosen.indexOf(photo.id) < 0 ? 0 : chosen.indexOf(photo.id),
            altText: photo.altText,
          })),
        }),
      });
      if (response.ok) {
        setSaved(true);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  const dirty =
    chosen.join(',') !==
    photos
      .filter((photo) => photo.selected)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((photo) => photo.id)
      .join(',');

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {photos.map((photo) => {
          const position = chosen.indexOf(photo.id);
          return (
            <button
              key={photo.id}
              type="button"
              onClick={() => toggle(photo.id)}
              className={`relative overflow-hidden rounded-card border text-left transition-colors ${
                position >= 0 ? 'border-ink' : 'border-primary-500/20 opacity-70 hover:opacity-100'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/admin/marketing/photo/${photo.id}`}
                alt={photo.altText || photo.caption || 'Job photo'}
                className="aspect-square w-full object-cover"
              />
              {position >= 0 && (
                <span className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] font-semibold text-cream">
                  {position + 1}
                </span>
              )}
              {/* Which one leads was decided by the order you happened to tap
                  them in, and nothing said so. The first is the frame that
                  opens the article and stands on the list of repair notes —
                  worth naming, and worth being able to set directly. */}
              {position === 0 && (
                <span className="absolute right-2 top-2 rounded-card bg-ink/90 px-2 py-0.5 font-heading text-[9px] font-semibold uppercase tracking-label text-cream">
                  Main
                </span>
              )}
              {position > 0 && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    event.stopPropagation();
                    makeMain(photo.id);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      event.stopPropagation();
                      makeMain(photo.id);
                    }
                  }}
                  className="absolute right-2 top-2 cursor-pointer rounded-card border border-cream/60 bg-ink/70 px-2 py-0.5 font-heading text-[9px] font-semibold uppercase tracking-label text-cream hover:bg-ink"
                >
                  Make main
                </span>
              )}
              {/* The whole tile is the selection toggle, so anything else on it has to
                  stop the click travelling — same as "Make main" above. */}
              <span
                role="button"
                tabIndex={0}
                onClick={(event) => {
                  event.stopPropagation();
                  setEditing(photo);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    event.stopPropagation();
                    setEditing(photo);
                  }
                }}
                className="absolute bottom-2 left-2 cursor-pointer rounded-card border border-cream/60 bg-ink/70 px-2 py-0.5 font-heading text-[9px] font-semibold uppercase tracking-label text-cream hover:bg-ink"
              >
                {photo.editedRev ? 'Edited' : 'Edit'}
              </span>
              {photo.caption && (
                <span className="block px-2 py-1 text-[11px] leading-snug text-gray-500">
                  {photo.caption}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={busy || !dirty}
          className="h-8 rounded-card bg-ink px-3 font-heading text-[10px] font-semibold uppercase tracking-label text-cream disabled:opacity-40"
        >
          {busy ? 'Saving…' : 'Save selection'}
        </button>
        <span className="text-xs text-gray-500">
          {chosen.length === 0
            ? 'None chosen — the article goes out without pictures.'
            : `${chosen.length} chosen. The first opens the article and shows on the repair-notes list; the rest sit under the text.`}
        </span>
        {saved && !dirty && <span className="ml-auto text-xs text-gray-500">Saved</span>}
      </div>

      {editing && (
        <PhotoEditor
          photoId={editing.id}
          jobId={jobId}
          recipe={editing.editRecipe ?? null}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
