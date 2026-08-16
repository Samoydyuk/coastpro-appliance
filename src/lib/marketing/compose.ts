import type { Treatment } from '@/lib/marketing/treatment';
import { tokens, scale } from '@/lib/marketing/treatment-tokens';

/**
 * The same page of the field journal, as a file somebody can post.
 *
 * The web version is HTML over a photograph, which is right for a web page and
 * useless for Instagram. This draws the identical composition onto a canvas at
 * 1080×1350 and hands back a JPEG.
 *
 * "Identical" is doing real work in that sentence: both read the same tokens,
 * so a change to the orange or the type scale moves both, and neither can
 * quietly become its own design.
 */

const WIDTH = 1080;
const HEIGHT = 1350;

/** Crop the photograph to the frame, keeping the subject in view. */
function drawPhoto(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  treatment: Treatment | null
): void {
  const target = WIDTH / HEIGHT;
  const source = image.naturalWidth / image.naturalHeight;

  let sw = image.naturalWidth;
  let sh = image.naturalHeight;
  if (source > target) sw = image.naturalHeight * target;
  else sh = image.naturalWidth / target;

  // Centred on the subject rather than on the picture — the whole reason a
  // photograph of an error code survives being made square.
  const subject = treatment?.subject;
  const cx = subject ? subject.x + subject.w / 2 : 0.5;
  const cy = subject ? subject.y + subject.h / 2 : 0.5;

  const sx = Math.min(Math.max(cx * image.naturalWidth - sw / 2, 0), image.naturalWidth - sw);
  const sy = Math.min(Math.max(cy * image.naturalHeight - sh / 2, 0), image.naturalHeight - sh);

  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, WIDTH, HEIGHT);
}

/** The gradient the words sit on. Never a rectangle (§16). */
function drawScrim(ctx: CanvasRenderingContext2D, corner: Treatment['overlay']): void {
  const fromBottom = corner.startsWith('bottom');
  const gradient = ctx.createLinearGradient(
    0,
    fromBottom ? HEIGHT : 0,
    0,
    fromBottom ? HEIGHT * 0.35 : HEIGHT * 0.65
  );
  gradient.addColorStop(0, tokens.scrim.strong);
  gradient.addColorStop(1, 'rgba(28,26,24,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function heading(weight: number, size: number): string {
  return `${weight} ${size}px "Archivo", "Helvetica Neue", Arial, sans-serif`;
}

/**
 * Draw the whole card and hand back a JPEG.
 *
 * The image must already be loaded and same-origin, or the canvas is tainted
 * and nothing can be exported from it.
 */
export function composeSocialCard(
  image: HTMLImageElement,
  treatment: Treatment | null
): string {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser will not give us a canvas to work on.');

  drawPhoto(ctx, image, treatment);

  const dressed = treatment && treatment.layout !== 'clean';

  if (!dressed || !treatment) {
    // Even a plain photograph is signed, quietly.
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = heading(600, scale(tokens.type.metadata, WIDTH));
    ctx.textAlign = 'right';
    ctx.fillText('COASTPRO.US', WIDTH - tokens.space.edge, tokens.space.edge + 10);
    return canvas.toDataURL('image/jpeg', 0.9);
  }

  if (treatment.layout === 'field_note') {
    drawFieldNote(ctx, treatment);
  } else {
    drawCaption(ctx, treatment);
  }

  return canvas.toDataURL('image/jpeg', 0.9);
}

/**
 * The full note: type at the top over graphite, the photograph below it, and a
 * leader that turns a corner down to the thing being named.
 *
 * Mirrors the FieldNote component fraction for fraction — same block at the
 * top, same elbow, same foot — because the file and the page are the same
 * design and must not become two.
 */
function drawFieldNote(ctx: CanvasRenderingContext2D, treatment: Treatment): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT * 0.62);
  gradient.addColorStop(0, 'rgba(28,26,24,0.97)');
  gradient.addColorStop(0.55, 'rgba(28,26,24,0.72)');
  gradient.addColorStop(1, 'rgba(28,26,24,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const left = WIDTH * 0.06;
  let y = HEIGHT * 0.06 + scale(tokens.type.metadata, WIDTH);

  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = heading(600, scale(tokens.type.metadata, WIDTH));
  ctx.fillText('COASTPRO.US', left, y);

  y += tokens.space.gap;
  ctx.fillStyle = tokens.color.orange;
  ctx.fillRect(left, y, WIDTH * 0.12, tokens.line.hairline);

  if (treatment.label) {
    y += scale(tokens.type.label, WIDTH) * 2.2;
    ctx.fillStyle = tokens.color.orange;
    ctx.font = heading(600, scale(tokens.type.label, WIDTH));
    ctx.fillText(treatment.label.toUpperCase(), left, y);
  }

  if (treatment.main) {
    y += scale(tokens.type.main, WIDTH) * 0.95;
    ctx.fillStyle = tokens.color.white;
    ctx.font = heading(800, scale(tokens.type.main, WIDTH));
    ctx.fillText(treatment.main, left, y);
  }

  if (treatment.headline) {
    y += scale(tokens.type.headline, WIDTH) * 1.05;
    ctx.fillStyle = tokens.color.white;
    ctx.font = heading(800, scale(tokens.type.headline, WIDTH));
    ctx.fillText(treatment.headline.toUpperCase(), left, y);
  }

  // The annotation, its two lines, and the elbow down to the dot.
  if (treatment.annotation) {
    const dotX = treatment.annotation.x * WIDTH;
    const dotY = treatment.annotation.y * HEIGHT;
    const labelY = Math.max(y + scale(tokens.type.annotation, WIDTH) * 2, dotY - HEIGHT * 0.16);

    ctx.fillStyle = tokens.color.white;
    ctx.font = heading(700, scale(tokens.type.annotation, WIDTH));
    ctx.fillText(treatment.annotation.text.toUpperCase(), left * 1.4, labelY);

    if (treatment.secondary) {
      ctx.fillStyle = tokens.color.muted;
      ctx.font = heading(400, scale(tokens.type.secondary, WIDTH));
      ctx.fillText(treatment.secondary, left * 1.4, labelY + scale(tokens.type.secondary, WIDTH) * 1.3);
    }

    const bendX = Math.min(WIDTH * 0.55, Math.max(WIDTH * 0.2, dotX));
    const runY = labelY + scale(tokens.type.secondary, WIDTH) * 2.2;
    ctx.strokeStyle = tokens.color.orange;
    ctx.lineWidth = tokens.line.annotation;
    ctx.beginPath();
    ctx.moveTo(left * 1.4, runY);
    ctx.lineTo(bendX, runY);
    ctx.lineTo(bendX, dotY);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(bendX, dotY, tokens.line.dot * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = tokens.color.orange;
    ctx.fill();
  }

  // The foot.
  const footY = HEIGHT - tokens.space.edge - scale(tokens.type.metadata, WIDTH);
  ctx.fillStyle = tokens.color.orange;
  ctx.fillRect(left, footY, WIDTH - left * 2, tokens.line.hairline);

  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = heading(500, scale(tokens.type.metadata, WIDTH));
  ctx.textAlign = 'left';
  if (treatment.footer) {
    ctx.fillText(treatment.footer, left, footY + scale(tokens.type.metadata, WIDTH) * 1.8);
  }
  if (treatment.index) {
    ctx.textAlign = 'right';
    ctx.fillStyle = tokens.color.orange;
    ctx.fillText(
      treatment.index.split(' / ')[0],
      WIDTH - left,
      footY + scale(tokens.type.metadata, WIDTH) * 1.8
    );
  }
}

/** The quieter layouts: a line in a corner, on a gradient. */
function drawCaption(ctx: CanvasRenderingContext2D, treatment: Treatment): void {
  const corner = treatment.overlay;
  drawScrim(ctx, corner);

  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = heading(600, scale(tokens.type.metadata, WIDTH));
  ctx.textAlign = 'right';
  ctx.fillText('COASTPRO.US', WIDTH - tokens.space.edge, tokens.space.edge + 10);

  if (treatment.annotation) {
    const ax = treatment.annotation.x * WIDTH;
    const ay = treatment.annotation.y * HEIGHT;
    ctx.beginPath();
    ctx.arc(ax, ay, tokens.line.dot, 0, Math.PI * 2);
    ctx.fillStyle = tokens.color.orange;
    ctx.fill();
    ctx.lineWidth = tokens.line.annotation;
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.stroke();

    ctx.textAlign = ax > WIDTH * 0.6 ? 'right' : 'left';
    ctx.fillStyle = tokens.color.white;
    ctx.font = heading(600, scale(tokens.type.secondary, WIDTH));
    const offset = ax > WIDTH * 0.6 ? -tokens.space.gap * 2 : tokens.space.gap * 2;
    ctx.fillText(treatment.annotation.text.toUpperCase(), ax + offset, ay + 8);
  }

  const right = corner.endsWith('right');
  ctx.textAlign = right ? 'right' : 'left';
  const x = right ? WIDTH - tokens.space.edge : tokens.space.edge;

  const lines: Array<{ text: string; size: number; weight: number; color: string }> = [];
  if (treatment.label) {
    lines.push({ text: treatment.label.toUpperCase(), size: tokens.type.label, weight: 600, color: tokens.color.orange });
  }
  if (treatment.headline) {
    lines.push({ text: treatment.headline.toUpperCase(), size: tokens.type.headline, weight: 700, color: tokens.color.white });
  }
  if (treatment.secondary) {
    lines.push({ text: treatment.secondary, size: tokens.type.secondary, weight: 400, color: tokens.color.muted });
  }
  if (treatment.footer) {
    lines.push({ text: treatment.footer, size: tokens.type.metadata, weight: 500, color: tokens.color.muted });
  }

  const blockHeight = lines.reduce((sum, line) => sum + scale(line.size, WIDTH) + tokens.space.gap, 0);
  let y = corner.startsWith('bottom')
    ? HEIGHT - tokens.space.edge - blockHeight + scale(lines[0]?.size ?? 0, WIDTH)
    : tokens.space.edge + scale(tokens.type.label, WIDTH) * 2;

  for (const line of lines) {
    ctx.fillStyle = line.color;
    ctx.font = heading(line.weight, scale(line.size, WIDTH));
    ctx.fillText(line.text, x, y);
    y += scale(line.size, WIDTH) + tokens.space.gap;
  }
}

/** Compose and save, which is all the console needs. */
export async function downloadSocialCard(
  src: string,
  treatment: Treatment | null,
  filename: string
): Promise<void> {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.src = src;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('The photograph would not load.'));
  });

  const dataUrl = composeSocialCard(image, treatment);
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
}
