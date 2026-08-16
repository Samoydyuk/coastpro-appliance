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

  const corner = treatment?.overlay ?? 'bottom_left';
  const dressed = treatment && treatment.layout !== 'clean';
  if (dressed) drawScrim(ctx, corner);

  // The wordmark, always, small, top right — what makes the picture
  // recognisable without a logo across the middle of it.
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = heading(600, scale(tokens.type.metadata, WIDTH));
  ctx.textAlign = 'right';
  ctx.fillText('COASTPRO.US', WIDTH - tokens.space.edge, tokens.space.edge + 10);

  if (treatment?.index) {
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText(treatment.index, tokens.space.edge, tokens.space.edge + 10);
  }

  if (!dressed || !treatment) {
    return canvas.toDataURL('image/jpeg', 0.9);
  }

  // The annotation: a dot on the thing, and its name beside it.
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

  // The block of words, in the corner the layout chose.
  const right = corner.endsWith('right');
  const bottom = corner.startsWith('bottom');
  ctx.textAlign = right ? 'right' : 'left';
  const x = right ? WIDTH - tokens.space.edge : tokens.space.edge;

  const lines: Array<{ text: string; size: number; weight: number; color: string; gap: number }> = [];
  if (treatment.label) {
    lines.push({
      text: treatment.label.toUpperCase(),
      size: tokens.type.label,
      weight: 600,
      color: tokens.color.orange,
      gap: tokens.space.gap,
    });
  }
  if (treatment.main) {
    lines.push({
      text: treatment.main,
      size: tokens.type.main,
      weight: 800,
      color: tokens.color.white,
      gap: tokens.space.gap,
    });
  }
  if (treatment.headline) {
    lines.push({
      text: treatment.headline.toUpperCase(),
      size: tokens.type.headline,
      weight: 700,
      color: tokens.color.white,
      gap: tokens.space.gap,
    });
  }
  if (treatment.secondary) {
    lines.push({
      text: treatment.secondary,
      size: tokens.type.secondary,
      weight: 400,
      color: tokens.color.muted,
      gap: tokens.space.gap,
    });
  }
  if (treatment.footer) {
    lines.push({
      text: treatment.footer,
      size: tokens.type.metadata,
      weight: 500,
      color: tokens.color.muted,
      gap: tokens.space.block,
    });
  }

  const blockHeight = lines.reduce((sum, line) => sum + scale(line.size, WIDTH) + line.gap, 0);
  let y = bottom ? HEIGHT - tokens.space.edge - blockHeight + scale(lines[0]?.size ?? 0, WIDTH) : tokens.space.edge + scale(tokens.type.label, WIDTH) * 2;

  for (const line of lines) {
    ctx.fillStyle = line.color;
    ctx.font = heading(line.weight, scale(line.size, WIDTH));
    ctx.fillText(line.text, x, y);
    y += scale(line.size, WIDTH) + line.gap;
  }

  return canvas.toDataURL('image/jpeg', 0.9);
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
