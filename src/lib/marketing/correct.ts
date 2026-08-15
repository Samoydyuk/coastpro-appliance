/**
 * Bringing a phone photograph of somebody's kitchen to the house tone.
 *
 * Nothing here invents, removes or moves anything: it is exposure, white
 * balance and tone, the same handful of moves a photographer would make in
 * Lightroom and nothing a retoucher would. A photograph on this site is
 * evidence of a repair, and evidence that has been improved is not evidence.
 *
 * Runs on an ImageData in the browser — the project has no server-side raster
 * library and does not need one, because the console already edits pictures on
 * a canvas. The original is never the thing being written to.
 */

export interface Correction {
  /** −100…100. Kept near zero: kitchens are usually exposed well enough. */
  exposure: number;
  /** Negative pulls back blown stainless steel and white doors. */
  highlights: number;
  /** Positive opens the inside of a machine without flattening it. */
  shadows: number;
  /** Slightly negative deepens the blacks for the editorial look. */
  blacks: number;
  contrast: number;
  saturation: number;
  /** How hard to pull the cast out of the light. 0–1. */
  whiteBalance: number;
}

/**
 * The house defaults, inside the ranges the specification gives.
 *
 * Conservative on purpose. Every one of these is applied to a photograph
 * nobody will look at twice if it is right, and everybody will notice if it is
 * wrong.
 */
export const HOUSE_CORRECTION: Correction = {
  exposure: 0,
  highlights: -24,
  shadows: 16,
  blacks: -6,
  contrast: 9,
  saturation: -8,
  whiteBalance: 0.75,
};

const clamp = (value: number): number => (value < 0 ? 0 : value > 255 ? 255 : value);

/**
 * What colour the light was.
 *
 * The grey-world assumption: average a picture and, in daylight, the average is
 * grey. A kitchen at night under fluorescent tubes averages yellow-green, and
 * the distance from grey is the cast to remove. Bright pixels are weighted
 * highest because white surfaces — a fridge door, a steel panel — carry the
 * cast most honestly, and a red toolbox in the corner should not tint the room.
 */
function measureCast(data: Uint8ClampedArray): { r: number; g: number; b: number } {
  let rs = 0;
  let gs = 0;
  let bs = 0;
  let weight = 0;

  // Every eighth pixel is plenty for an average and keeps this instant on a
  // twelve-megapixel photograph.
  for (let i = 0; i < data.length; i += 32) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luma = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
    // Mid-to-bright only: shadows are noisy and specular highlights are clipped.
    if (luma < 0.35 || luma > 0.95) continue;
    const w = luma;
    rs += r * w;
    gs += g * w;
    bs += b * w;
    weight += w;
  }

  if (weight === 0) return { r: 1, g: 1, b: 1 };
  const mean = (rs + gs + bs) / (3 * weight);
  return {
    r: mean / (rs / weight),
    g: mean / (gs / weight),
    b: mean / (bs / weight),
  };
}

/** A soft shoulder, so pulling highlights back does not band the sky. */
function rolloff(value: number, amount: number): number {
  if (amount === 0) return value;
  const t = value / 255;
  // Only the top half moves, and it moves less the further from the top it is.
  const weight = t <= 0.5 ? 0 : (t - 0.5) * 2;
  return value + amount * 2.55 * weight * weight;
}

function lift(value: number, amount: number): number {
  if (amount === 0) return value;
  const t = value / 255;
  const weight = t >= 0.5 ? 0 : (0.5 - t) * 2;
  return value + amount * 2.55 * weight * weight;
}

/**
 * Apply a correction in place.
 *
 * In place because a twelve-megapixel copy is forty-eight megabytes and this
 * runs on a technician's laptop.
 */
export function correct(image: ImageData, settings: Correction = HOUSE_CORRECTION): ImageData {
  const data = image.data;

  const cast = measureCast(data);
  const strength = Math.min(1, Math.max(0, settings.whiteBalance));
  // Pulled towards neutral rather than all the way to it: a fully neutralised
  // kitchen looks like a studio, and this is a field journal. The cap stops a
  // photograph that is genuinely warm — a wooden floor, an amber lamp — from
  // being turned blue.
  const wb = {
    r: 1 + (Math.min(1.25, Math.max(0.8, cast.r)) - 1) * strength,
    g: 1 + (Math.min(1.25, Math.max(0.8, cast.g)) - 1) * strength,
    b: 1 + (Math.min(1.25, Math.max(0.8, cast.b)) - 1) * strength,
  };

  const exposure = 1 + settings.exposure / 100;
  const contrast = 1 + settings.contrast / 100;
  const saturation = 1 + settings.saturation / 100;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i] * wb.r * exposure;
    let g = data[i + 1] * wb.g * exposure;
    let b = data[i + 2] * wb.b * exposure;

    r = rolloff(r, settings.highlights);
    g = rolloff(g, settings.highlights);
    b = rolloff(b, settings.highlights);

    r = lift(r, settings.shadows);
    g = lift(g, settings.shadows);
    b = lift(b, settings.shadows);

    // Blacks: the very bottom only, so the picture gains depth without the
    // inside of a machine turning into a silhouette.
    if (settings.blacks !== 0) {
      const floor = settings.blacks * 2.55;
      const weight = (value: number) => Math.max(0, 1 - value / 64);
      r += floor * weight(r);
      g += floor * weight(g);
      b += floor * weight(b);
    }

    r = (r - 128) * contrast + 128;
    g = (g - 128) * contrast + 128;
    b = (b - 128) * contrast + 128;

    // Saturation around the pixel's own luminance, which leaves neutral
    // surfaces neutral — the whole point for stainless steel.
    const luma = r * 0.299 + g * 0.587 + b * 0.114;
    r = luma + (r - luma) * saturation;
    g = luma + (g - luma) * saturation;
    b = luma + (b - luma) * saturation;

    data[i] = clamp(r);
    data[i + 1] = clamp(g);
    data[i + 2] = clamp(b);
  }

  return image;
}

/**
 * The whole job, from a loaded image to JPEG bytes.
 *
 * Longest edge capped: a photograph on a page is never shown at twelve
 * megapixels, and the corrected copy is what the page is served from.
 */
export async function correctToDataUrl(
  source: HTMLImageElement,
  settings: Correction = HOUSE_CORRECTION,
  maxEdge = 2000
): Promise<string> {
  const scale = Math.min(1, maxEdge / Math.max(source.naturalWidth, source.naturalHeight));
  const width = Math.round(source.naturalWidth * scale);
  const height = Math.round(source.naturalHeight * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser will not give us a canvas to work on.');

  ctx.drawImage(source, 0, 0, width, height);
  const image = ctx.getImageData(0, 0, width, height);
  ctx.putImageData(correct(image, settings), 0, 0);

  // 0.86 — inside the specification's band, and high enough that a model plate
  // or a hairline crack survives the encode.
  return canvas.toDataURL('image/jpeg', 0.86);
}
