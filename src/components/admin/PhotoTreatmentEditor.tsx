'use client';

import { useRef, useState } from 'react';
import type { LayoutName, PhotoType, Treatment } from '@/lib/marketing/treatment';
import { tokens } from '@/lib/marketing/treatment-tokens';

/**
 * What the model proposed for one photograph, and the means to disagree with it.
 *
 * The suggestion is the work; this is the twenty seconds of judgement on top of
 * it. Nothing here regenerates the picture — changing a layout or dragging the
 * annotation dot changes where words sit, never a pixel of the photograph.
 */

const LAYOUTS: Array<{ value: LayoutName; label: string }> = [
  { value: 'clean', label: 'Clean' },
  { value: 'field_note', label: 'Field Note' },
  { value: 'detail', label: 'Detail' },
  { value: 'before', label: 'Before' },
  { value: 'after', label: 'After' },
  { value: 'process', label: 'Process' },
];

const TYPES: PhotoType[] = [
  'error_code', 'failed_part', 'diagnostic_area', 'before', 'after',
  'repair_process', 'completed_repair', 'appliance_overview', 'model_serial',
  'damage', 'maintenance', 'other',
];

const CORNERS: Treatment['overlay'][] = ['top_left', 'top_right', 'bottom_left', 'bottom_right'];

interface Props {
  photoId: string;
  src: string;
  treatment: Treatment;
  approved: boolean;
  onChange: (treatment: Treatment) => void;
  onApprovedChange: (approved: boolean) => void;
}

export function PhotoTreatmentEditor({
  photoId,
  src,
  treatment,
  approved,
  onChange,
  onApprovedChange,
}: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const set = <K extends keyof Treatment>(key: K, value: Treatment[K]) => {
    onChange({ ...treatment, [key]: value });
  };

  /** Drag the dot to what it is pointing at. */
  const moveAnnotation = (event: React.MouseEvent) => {
    const frame = frameRef.current;
    if (!frame || !treatment.annotation) return;
    const rect = frame.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    set('annotation', { ...treatment.annotation, x, y });
  };

  const field = (label: string, value: string | null, key: keyof Treatment) => (
    <label className="block">
      <span className="font-heading text-[9px] font-semibold uppercase tracking-label text-gray-500">
        {label}
      </span>
      <input
        value={value ?? ''}
        onChange={(event) => set(key, (event.target.value || null) as Treatment[typeof key])}
        className="mt-0.5 w-full rounded-card border border-primary-500/20 bg-cream px-2 py-1 text-[12px] text-ink focus:border-ink focus:outline-none"
      />
    </label>
  );

  const low = treatment.confidence < tokens.confidenceFloor;

  /**
   * A different arrangement of the same facts.
   *
   * Never the photograph and never the words — this moves where they sit and
   * how loud they are, which is the whole of what "regenerate design" should
   * mean (§31). Somebody who dislikes a layout presses it instead of arguing
   * with a model.
   */
  const regenerate = () => {
    const order: Treatment['overlay'][] = ['bottom_left', 'bottom_right', 'top_left', 'top_right'];
    const nextCorner = order[(order.indexOf(treatment.overlay) + 1) % order.length];

    // The hierarchy steps down and around: a full note becomes a line, a line
    // becomes a note again if there is something worth shouting.
    const nextLayout: LayoutName =
      treatment.layout === 'field_note'
        ? 'detail'
        : treatment.main
          ? 'field_note'
          : treatment.layout;

    onChange({
      ...treatment,
      overlay: nextCorner,
      layout: nextLayout,
      // Back onto the middle of whatever the picture is of, which is where an
      // annotation belongs before anybody drags it.
      annotation: treatment.annotation && treatment.subject
        ? {
            ...treatment.annotation,
            x: treatment.subject.x + treatment.subject.w / 2,
            y: treatment.subject.y + treatment.subject.h / 2,
          }
        : treatment.annotation,
    });
  };

  return (
    <div className="space-y-3 rounded-card border border-primary-500/20 p-3">
      {/* The picture with the words on it, at the size it will be read. */}
      <div
        ref={frameRef}
        className="relative aspect-[4/3] cursor-crosshair overflow-hidden rounded-card bg-graphite"
        onMouseMove={(event) => dragging && moveAnnotation(event)}
        onMouseUp={() => setDragging(false)}
        onMouseLeave={() => setDragging(false)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="h-full w-full object-cover" />

        {treatment.layout !== 'clean' && (
          <>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-graphite/70 via-graphite/20 to-transparent" />
            <div className="pointer-events-none absolute bottom-0 left-0 max-w-[80%] p-3">
              {treatment.label && (
                <div
                  className="font-heading text-[8px] font-semibold uppercase tracking-label"
                  style={{ color: tokens.color.orange }}
                >
                  {treatment.label}
                </div>
              )}
              {treatment.main && (
                <div className="font-heading text-2xl font-extrabold leading-none text-white">
                  {treatment.main}
                </div>
              )}
              {treatment.headline && (
                <div className="font-heading text-[11px] font-bold uppercase tracking-label text-white">
                  {treatment.headline}
                </div>
              )}
              {treatment.secondary && (
                <div className="text-[10px] text-white/75">{treatment.secondary}</div>
              )}
            </div>
          </>
        )}

        {treatment.annotation && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Move the annotation"
            onMouseDown={() => setDragging(true)}
            onKeyDown={() => {}}
            className="absolute flex cursor-grab items-center gap-1.5 active:cursor-grabbing"
            style={{
              left: `${treatment.annotation.x * 100}%`,
              top: `${treatment.annotation.y * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <span
              className="block h-2.5 w-2.5 rounded-full ring-2 ring-white/80"
              style={{ backgroundColor: tokens.color.orange }}
            />
            <span className="whitespace-nowrap font-heading text-[9px] font-semibold uppercase tracking-label text-white drop-shadow">
              {treatment.annotation.text}
            </span>
          </span>
        )}
      </div>

      {low && (
        <p className="text-[11px] text-gray-500">
          The model was unsure what this shows ({Math.round(treatment.confidence * 100)}%), so it
          proposed no caption. That is usually the right answer.
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="font-heading text-[9px] font-semibold uppercase tracking-label text-gray-500">
            Layout
          </span>
          <select
            value={treatment.layout}
            onChange={(event) => set('layout', event.target.value as LayoutName)}
            className="mt-0.5 w-full rounded-card border border-primary-500/20 bg-cream px-2 py-1 text-[12px] text-ink"
          >
            {LAYOUTS.map((layout) => (
              <option key={layout.value} value={layout.value}>{layout.label}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="font-heading text-[9px] font-semibold uppercase tracking-label text-gray-500">
            What it shows
          </span>
          <select
            value={treatment.photoType}
            onChange={(event) => set('photoType', event.target.value as PhotoType)}
            className="mt-0.5 w-full rounded-card border border-primary-500/20 bg-cream px-2 py-1 text-[12px] text-ink"
          >
            {TYPES.map((type) => (
              <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </label>
      </div>

      {treatment.layout !== 'clean' && (
        <div className="space-y-2">
          {field('Label', treatment.label, 'label')}
          {field('Main', treatment.main, 'main')}
          {field('Headline', treatment.headline, 'headline')}
          {field('Secondary', treatment.secondary, 'secondary')}
          {field('Location line', treatment.footer, 'footer')}

          <label className="block">
            <span className="font-heading text-[9px] font-semibold uppercase tracking-label text-gray-500">
              Annotation — drag the dot on the picture
            </span>
            <input
              value={treatment.annotation?.text ?? ''}
              onChange={(event) =>
                set(
                  'annotation',
                  event.target.value
                    ? {
                        text: event.target.value,
                        x: treatment.annotation?.x ?? 0.5,
                        y: treatment.annotation?.y ?? 0.5,
                      }
                    : null
                )
              }
              placeholder="Empty for none"
              className="mt-0.5 w-full rounded-card border border-primary-500/20 bg-cream px-2 py-1 text-[12px] text-ink focus:border-ink focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="font-heading text-[9px] font-semibold uppercase tracking-label text-gray-500">
              Words sit
            </span>
            <select
              value={treatment.overlay}
              onChange={(event) => set('overlay', event.target.value as Treatment['overlay'])}
              className="mt-0.5 w-full rounded-card border border-primary-500/20 bg-cream px-2 py-1 text-[12px] text-ink"
            >
              {CORNERS.map((corner) => (
                <option key={corner} value={corner}>{corner.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={regenerate}
          className="h-7 rounded-card border border-ink/20 px-2.5 font-heading text-[9px] font-semibold uppercase tracking-label text-ink"
        >
          Regenerate design
        </button>
        <button
          type="button"
          onClick={() => onChange({ ...treatment, layout: 'clean', label: null, main: null, headline: null, secondary: null, annotation: null })}
          className="h-7 rounded-card border border-ink/20 px-2.5 font-heading text-[9px] font-semibold uppercase tracking-label text-gray-500"
        >
          Use original
        </button>
      </div>

      <label className="flex items-center gap-2 text-[12px] text-ink">
        <input
          type="checkbox"
          checked={approved}
          onChange={(event) => onApprovedChange(event.target.checked)}
          className="h-3.5 w-3.5"
        />
        <span>Approved — this is what goes out</span>
      </label>

      <p className="text-[10px] text-gray-400">{photoId.slice(0, 8)} · {treatment.templateVersion}</p>
    </div>
  );
}
