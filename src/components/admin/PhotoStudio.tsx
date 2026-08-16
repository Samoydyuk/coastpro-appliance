'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Treatment } from '@/lib/marketing/treatment';
import { PhotoTreatment } from '@/components/marketing/PhotoTreatment';
import { tokens } from '@/lib/marketing/treatment-tokens';

/**
 * The photograph at a size you can actually work on.
 *
 * The panel preview is a thumbnail — fine for deciding whether a frame is
 * right, useless for saying "that word should be over there". This is the
 * same composition the article renders, as large as the window allows, with
 * three things you can pick up: the block of type, the label, and the dot.
 *
 * Nothing here touches the photograph. Dragging moves where words sit, which
 * is the only kind of moving this system does.
 */

type Handle = 'text' | 'label' | 'dot';

interface Props {
  src: string;
  treatment: Treatment;
  onChange: (treatment: Treatment) => void;
  /** Handed the final arrangement, so closing is what saves it. */
  onClose: (final?: Treatment) => void;
}

export function PhotoStudio({ src, treatment, onChange, onClose }: Props) {
  // What is on screen right now, for the moment of closing: reading the prop
  // there hands back whatever React rendered last rather than the last thing
  // dragged.
  const latest = useRef(treatment);
  latest.current = treatment;
  const frameRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<Handle | null>(null);
  const [hint, setHint] = useState<string | null>('Drag the words, the label or the dot.');

  /** Where the pointer is, as a fraction of the frame. */
  const positionOf = useCallback((event: { clientX: number; clientY: number }) => {
    const frame = frameRef.current;
    if (!frame) return null;
    const rect = frame.getBoundingClientRect();
    return {
      x: Math.min(0.96, Math.max(0.02, (event.clientX - rect.left) / rect.width)),
      y: Math.min(0.96, Math.max(0.02, (event.clientY - rect.top) / rect.height)),
    };
  }, []);

  const move = useCallback(
    (event: { clientX: number; clientY: number }) => {
      if (!dragging) return;
      const at = positionOf(event);
      if (!at) return;

      if (dragging === 'text') {
        onChange({ ...treatment, textPos: at });
      } else if (dragging === 'dot' && treatment.annotation) {
        onChange({ ...treatment, annotation: { ...treatment.annotation, x: at.x, y: at.y } });
      } else if (dragging === 'label' && treatment.annotation) {
        onChange({
          ...treatment,
          annotation: { ...treatment.annotation, labelX: at.x, labelY: at.y },
        });
      }
    },
    [dragging, onChange, positionOf, treatment]
  );

  // Bound to the window, not the handle: a fast drag leaves the little square
  // behind and the block stops following the pointer, which feels broken.
  useEffect(() => {
    if (!dragging) return;
    const onMove = (event: MouseEvent) => move(event);
    const onUp = () => setDragging(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, move]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose(latest.current);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const textAt = treatment.textPos ?? { x: 0.06, y: 0.06 };
  const dot = treatment.annotation;
  const labelAt = dot ? { x: dot.labelX ?? 0.08, y: dot.labelY ?? Math.max(0.46, dot.y - 0.16) } : null;

  const handle = (which: Handle, at: { x: number; y: number }, label: string) => (
    <span
      role="button"
      tabIndex={0}
      aria-label={label}
      onMouseDown={(event) => {
        event.preventDefault();
        setDragging(which);
        setHint(null);
      }}
      onKeyDown={() => {}}
      className={`absolute z-10 flex -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center rounded-full border-2 border-white/90 shadow active:cursor-grabbing ${
        which === 'dot' ? 'h-5 w-5' : 'h-7 w-7'
      }`}
      style={{
        left: `${at.x * 100}%`,
        top: `${at.y * 100}%`,
        backgroundColor: which === 'dot' ? tokens.color.orange : 'rgba(28,26,24,0.75)',
      }}
    >
      {which !== 'dot' && (
        <span className="font-heading text-[8px] font-bold uppercase text-cream">
          {which === 'text' ? 'T' : 'L'}
        </span>
      )}
    </span>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-graphite/95 p-4 sm:p-6">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="font-heading text-[11px] font-semibold uppercase tracking-label text-cream/80">
          {hint ?? 'Release to drop it where it is.'}
        </div>
        <button
          type="button"
          onClick={() => onClose(latest.current)}
          className="h-8 rounded-card bg-cream px-4 font-heading text-[10px] font-semibold uppercase tracking-label text-ink"
        >
          Save &amp; close
        </button>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center">
        <div
          ref={frameRef}
          className="relative max-h-full"
          style={{ aspectRatio: String(treatment.layout === 'field_note' ? 4 / 5 : 4 / 3), height: '100%' }}
        >
          <PhotoTreatment
            src={src}
            alt=""
            treatment={treatment}
            aspect={treatment.layout === 'field_note' ? 4 / 5 : 4 / 3}
            sizes="90vw"
            unoptimized
            className="h-full w-full"
          />

          {treatment.layout !== 'clean' && handle('text', textAt, 'Move the words')}
          {dot && handle('dot', { x: dot.x, y: dot.y }, 'Move the dot')}
          {dot && labelAt && handle('label', labelAt, 'Move the label')}
        </div>
      </div>

      <p className="mt-3 text-center text-[11px] text-cream/50">
        Moving things here never changes the photograph — only where the words sit. Closing saves.
      </p>
    </div>
  );
}
