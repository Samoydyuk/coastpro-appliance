'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Cropping a repair photograph and drawing on it.
 *
 * Two jobs, and the second is the important one. Pointing at the thing the
 * article is about — an arrow at the blower housing, a circle round the crack —
 * is what turns a picture of a dirty machine into evidence. And cropping is how
 * a house number, a document on the counter or somebody's face leaves the frame
 * before it leaves the building.
 *
 * Everything happens here, in the browser: the canvas does the crop, the marks
 * and the downscale, and what goes to the server is a finished JPEG. That is
 * why this needs no image library on the server — and why the result carries no
 * metadata, having been re-encoded from pixels.
 */

export interface EditRecipe {
  crop?: { x: number; y: number; w: number; h: number };
  marks?: Mark[];
}

type Mark =
  | { kind: 'arrow'; x1: number; y1: number; x2: number; y2: number }
  | { kind: 'circle'; x: number; y: number; r: number }
  | { kind: 'label'; x: number; y: number; text: string };

type Tool = 'crop' | 'arrow' | 'circle' | 'label';

/** Everything is stored 0–1 so a recipe survives any later resize. */
const MARK_COLOR = '#e8452c';
const OUTPUT_WIDTH = 1600;

export function PhotoEditor({
  photoId,
  jobId,
  recipe,
  onClose,
}: {
  photoId: string;
  jobId: string;
  recipe: EditRecipe | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [tool, setTool] = useState<Tool>('crop');
  const [crop, setCrop] = useState<EditRecipe['crop']>(recipe?.crop);
  const [marks, setMarks] = useState<Mark[]>(recipe?.marks ?? []);
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [live, setLive] = useState<{ x: number; y: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // The console proxy caches for ten minutes; a stamp keeps the editor honest
  // about what it is editing.
  const source = `/api/admin/marketing/photo/${photoId}?t=${Math.floor(Date.now() / 1000)}`;

  useEffect(() => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      imageRef.current = image;
      setLoaded(true);
    };
    image.onerror = () => setError('The photo would not load.');
    image.src = source;
  }, [source]);

  // Redraw whenever anything changes. The canvas shows the whole frame with the
  // crop as an overlay, rather than an already-cropped picture — you cannot
  // judge a crop you can no longer see outside of.
  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !loaded) return;

    const width = Math.min(image.naturalWidth, 900);
    const scale = width / image.naturalWidth;
    canvas.width = width;
    canvas.height = Math.round(image.naturalHeight * scale);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    if (crop) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const box = {
        x: crop.x * canvas.width,
        y: crop.y * canvas.height,
        w: crop.w * canvas.width,
        h: crop.h * canvas.height,
      };
      ctx.save();
      ctx.beginPath();
      ctx.rect(box.x, box.y, box.w, box.h);
      ctx.clip();
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      ctx.restore();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(box.x, box.y, box.w, box.h);
    }

    drawMarks(ctx, marks, canvas.width, canvas.height);

    // The mark being drawn right now.
    if (drag && live && tool !== 'crop') {
      drawMarks(ctx, [previewMark(tool, drag, live)], canvas.width, canvas.height);
    }
    if (drag && live && tool === 'crop') {
      ctx.strokeStyle = '#fff';
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(
        Math.min(drag.x, live.x) * canvas.width,
        Math.min(drag.y, live.y) * canvas.height,
        Math.abs(live.x - drag.x) * canvas.width,
        Math.abs(live.y - drag.y) * canvas.height
      );
      ctx.setLineDash([]);
    }
  }, [crop, marks, drag, live, tool, loaded]);

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width)),
      y: Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height)),
    };
  };

  const onDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const at = point(event);
    if (tool === 'label') {
      const text = window.prompt('What should it say?')?.trim();
      if (text) setMarks((current) => [...current, { kind: 'label', x: at.x, y: at.y, text }]);
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag(at);
    setLive(at);
  };

  const onMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drag) return;
    setLive(point(event));
  };

  const onUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drag) return;
    const at = point(event);
    const moved = Math.abs(at.x - drag.x) > 0.01 || Math.abs(at.y - drag.y) > 0.01;
    if (moved) {
      if (tool === 'crop') {
        setCrop({
          x: Math.min(drag.x, at.x),
          y: Math.min(drag.y, at.y),
          w: Math.abs(at.x - drag.x),
          h: Math.abs(at.y - drag.y),
        });
      } else {
        setMarks((current) => [...current, previewMark(tool, drag, at)]);
      }
    }
    setDrag(null);
    setLive(null);
  };

  /** Render at full size, crop, draw, downscale, hand over the bytes. */
  const save = async () => {
    const image = imageRef.current;
    if (!image) return;
    setBusy(true);
    setError(null);
    try {
      const sourceBox = crop
        ? {
            x: crop.x * image.naturalWidth,
            y: crop.y * image.naturalHeight,
            w: crop.w * image.naturalWidth,
            h: crop.h * image.naturalHeight,
          }
        : { x: 0, y: 0, w: image.naturalWidth, h: image.naturalHeight };

      const out = document.createElement('canvas');
      const width = Math.min(OUTPUT_WIDTH, Math.round(sourceBox.w));
      out.width = width;
      out.height = Math.round((sourceBox.h / sourceBox.w) * width);
      const ctx = out.getContext('2d');
      if (!ctx) throw new Error('no canvas');
      ctx.drawImage(
        image,
        sourceBox.x, sourceBox.y, sourceBox.w, sourceBox.h,
        0, 0, out.width, out.height
      );

      // Marks are stored against the whole frame; on a cropped export they move
      // with it, and any that fell outside simply land off-canvas.
      const shifted = marks.map((mark) => shiftMark(mark, crop));
      drawMarks(ctx, shifted, out.width, out.height);

      const dataUrl = out.toDataURL('image/jpeg', 0.85);
      const response = await fetch('/api/admin/marketing/photo-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, photoId, recipe: { crop, marks }, image: dataUrl }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? 'Could not save.');
        return;
      }
      router.refresh();
      onClose();
    } catch {
      setError('Could not save.');
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    setBusy(true);
    try {
      await fetch('/api/admin/marketing/photo-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, photoId, reset: true }),
      });
      router.refresh();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const chip = (value: Tool, label: string) => (
    <button
      key={value}
      type="button"
      onClick={() => setTool(value)}
      className={`h-8 rounded-card px-3 font-heading text-[10px] font-semibold uppercase tracking-label ${
        tool === value ? 'bg-ink text-cream' : 'border border-primary-500/30 text-gray-600'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4">
      <div className="max-h-full w-full max-w-3xl overflow-auto rounded-card bg-cream p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {chip('crop', 'Crop')}
          {chip('arrow', 'Arrow')}
          {chip('circle', 'Circle')}
          {chip('label', 'Label')}
          <button
            type="button"
            onClick={() => (marks.length ? setMarks(marks.slice(0, -1)) : setCrop(undefined))}
            className="h-8 rounded-card border border-primary-500/30 px-3 font-heading text-[10px] font-semibold uppercase tracking-label text-gray-600"
          >
            Undo
          </button>
          <span className="ml-auto text-xs text-gray-500">
            {tool === 'crop' ? 'Drag a box to keep' : tool === 'label' ? 'Click to place text' : 'Drag to draw'}
          </span>
        </div>

        {error && <p className="mb-3 text-sm text-red-700">{error}</p>}

        <canvas
          ref={canvasRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          className="w-full cursor-crosshair touch-none rounded-card border border-primary-500/20"
        />

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={busy || !loaded}
            className="h-8 rounded-card bg-ink px-3 font-heading text-[10px] font-semibold uppercase tracking-label text-cream disabled:opacity-40"
          >
            {busy ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-8 rounded-card border border-primary-500/30 px-3 font-heading text-[10px] font-semibold uppercase tracking-label text-gray-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={reset}
            disabled={busy}
            className="ml-auto h-8 rounded-card px-3 font-heading text-[10px] font-semibold uppercase tracking-label text-gray-500 hover:text-ink"
          >
            Back to original
          </button>
        </div>
      </div>
    </div>
  );
}

function previewMark(tool: Tool, from: { x: number; y: number }, to: { x: number; y: number }): Mark {
  if (tool === 'circle') {
    return {
      kind: 'circle',
      x: (from.x + to.x) / 2,
      y: (from.y + to.y) / 2,
      r: Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y)) / 2,
    };
  }
  return { kind: 'arrow', x1: from.x, y1: from.y, x2: to.x, y2: to.y };
}

/** Move a mark from whole-frame coordinates into the cropped frame. */
function shiftMark(mark: Mark, crop: EditRecipe['crop']): Mark {
  if (!crop) return mark;
  const fx = (x: number) => (x - crop.x) / crop.w;
  const fy = (y: number) => (y - crop.y) / crop.h;
  if (mark.kind === 'arrow') {
    return { ...mark, x1: fx(mark.x1), y1: fy(mark.y1), x2: fx(mark.x2), y2: fy(mark.y2) };
  }
  if (mark.kind === 'circle') {
    return { ...mark, x: fx(mark.x), y: fy(mark.y), r: mark.r / Math.max(crop.w, crop.h) };
  }
  return { ...mark, x: fx(mark.x), y: fy(mark.y) };
}

/** One drawing routine, used for the preview and for the exported file, so what
 *  is on screen is what gets saved. */
function drawMarks(ctx: CanvasRenderingContext2D, marks: Mark[], width: number, height: number) {
  const unit = Math.max(width, height);
  ctx.lineWidth = Math.max(2, unit * 0.006);
  ctx.strokeStyle = MARK_COLOR;
  ctx.fillStyle = MARK_COLOR;
  ctx.lineCap = 'round';

  for (const mark of marks) {
    if (mark.kind === 'arrow') {
      const x1 = mark.x1 * width, y1 = mark.y1 * height;
      const x2 = mark.x2 * width, y2 = mark.y2 * height;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const head = unit * 0.03;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - head * Math.cos(angle - Math.PI / 7), y2 - head * Math.sin(angle - Math.PI / 7));
      ctx.lineTo(x2 - head * Math.cos(angle + Math.PI / 7), y2 - head * Math.sin(angle + Math.PI / 7));
      ctx.closePath();
      ctx.fill();
    } else if (mark.kind === 'circle') {
      ctx.beginPath();
      ctx.ellipse(mark.x * width, mark.y * height, mark.r * width, mark.r * height, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      const size = Math.max(14, unit * 0.028);
      ctx.font = `600 ${size}px system-ui, sans-serif`;
      const metrics = ctx.measureText(mark.text);
      const padding = size * 0.35;
      const x = mark.x * width;
      const y = mark.y * height;
      ctx.fillStyle = MARK_COLOR;
      ctx.fillRect(x, y - size, metrics.width + padding * 2, size + padding);
      ctx.fillStyle = '#fff';
      ctx.fillText(mark.text, x + padding, y - padding * 0.4);
      ctx.fillStyle = MARK_COLOR;
    }
  }
}
