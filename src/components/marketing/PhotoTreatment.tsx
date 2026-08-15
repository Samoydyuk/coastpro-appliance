import type { LayoutName, OverlayCorner, Treatment } from '@/lib/marketing/treatment';
import { tokens } from '@/lib/marketing/treatment-tokens';

/**
 * A repair photograph, dressed as a page of the CoastPro field journal.
 *
 * The words are HTML rather than pixels — they are indexed, read aloud, resized
 * with the column and corrected without regenerating anything. The photograph
 * underneath is never altered by this component; it only decides where the
 * frame sits and what goes over the empty part of it.
 *
 * The restraint is the design. Most pictures get a wordmark and their place in
 * the sequence; one in a series gets the full treatment. A page where every
 * photograph shouts is a page that reads as a template.
 */

interface Props {
  src: string;
  alt: string;
  treatment: Treatment | null;
  /** 16/9 for a hero, 4/3 inline, 1 for a grid tile. */
  aspect?: number;
  priority?: boolean;
  /** The hero already has the article's headline above it (§26). */
  restrained?: boolean;
  className?: string;
}

/** Which corner the words sit in, as positioning classes. */
const CORNER: Record<OverlayCorner, string> = {
  top_left: 'left-0 top-0 items-start text-left',
  top_right: 'right-0 top-0 items-end text-right',
  bottom_left: 'left-0 bottom-0 items-start text-left',
  bottom_right: 'right-0 bottom-0 items-end text-right',
};

/** The gradient that makes words readable without a black box over the picture. */
const SCRIM: Record<OverlayCorner, string> = {
  top_left: 'bg-gradient-to-br from-graphite/70 via-graphite/25 to-transparent',
  top_right: 'bg-gradient-to-bl from-graphite/70 via-graphite/25 to-transparent',
  bottom_left: 'bg-gradient-to-tr from-graphite/70 via-graphite/25 to-transparent',
  bottom_right: 'bg-gradient-to-tl from-graphite/70 via-graphite/25 to-transparent',
};

/**
 * Keep the frame on the subject when the shape of the container is not the
 * shape of the photograph.
 *
 * Centre-cropping is what cuts the error code out of the picture of the error
 * code (§8). The subject's own centre becomes the anchor instead.
 */
function objectPosition(treatment: Treatment | null): string | undefined {
  const subject = treatment?.subject;
  if (!subject) return undefined;
  const cx = Math.min(0.9, Math.max(0.1, subject.x + subject.w / 2));
  const cy = Math.min(0.9, Math.max(0.1, subject.y + subject.h / 2));
  return `${Math.round(cx * 100)}% ${Math.round(cy * 100)}%`;
}

/**
 * Does the subject sit in the corner the words want?
 *
 * If it does, the words move to the opposite corner rather than sitting on top
 * of the one thing the photograph was taken for (§7).
 */
function safeCorner(treatment: Treatment): OverlayCorner {
  const { subject, overlay } = treatment;
  if (!subject) return overlay;

  const margin = tokens.safeArea;
  const left = subject.x - margin;
  const right = subject.x + subject.w + margin;
  const top = subject.y - margin;
  const bottom = subject.y + subject.h + margin;

  const clashes: Record<OverlayCorner, boolean> = {
    top_left: left < 0.45 && top < 0.45,
    top_right: right > 0.55 && top < 0.45,
    bottom_left: left < 0.45 && bottom > 0.55,
    bottom_right: right > 0.55 && bottom > 0.55,
  };
  if (!clashes[overlay]) return overlay;

  const opposite: Record<OverlayCorner, OverlayCorner> = {
    top_left: 'bottom_right',
    top_right: 'bottom_left',
    bottom_left: 'top_right',
    bottom_right: 'top_left',
  };
  const fallbacks: OverlayCorner[] = [opposite[overlay], 'bottom_left', 'top_right', 'top_left'];
  return fallbacks.find((corner) => !clashes[corner]) ?? overlay;
}

export function PhotoTreatment({
  src,
  alt,
  treatment,
  aspect = 4 / 3,
  priority = false,
  restrained = false,
  className = '',
}: Props) {
  const layout: LayoutName = treatment?.layout ?? 'clean';
  const corner = treatment ? safeCorner(treatment) : 'bottom_left';
  // A hero carries the article's own headline above it, so it never repeats it
  // inside the frame — it keeps the wordmark, the sequence and nothing else.
  const effective: LayoutName = restrained && layout === 'field_note' ? 'clean' : layout;

  return (
    <figure
      className={`relative overflow-hidden rounded-card border border-primary-500/20 ${className}`}
      style={{ aspectRatio: String(aspect) }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        className="h-full w-full object-cover"
        style={{ objectPosition: objectPosition(treatment) }}
      />

      {/* The wordmark, quietly, on everything. It is what makes a photograph
          recognisable without a logo across the middle of it (§47). */}
      <span className="absolute right-3 top-3 font-heading text-[9px] font-semibold uppercase tracking-label text-white/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
        CoastPro.us
      </span>

      {treatment?.index && (
        <span className="absolute left-3 top-3 font-heading text-[9px] font-semibold tabular-nums tracking-label text-white/60 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
          {treatment.index}
        </span>
      )}

      {treatment && effective !== 'clean' && (
        <>
          <div className={`pointer-events-none absolute inset-0 ${SCRIM[corner]}`} />

          {/* The thread and the dot: one thin orange line to the thing being
              named, and never more than one per photograph (§11). */}
          {treatment.annotation && (
            <span
              className="pointer-events-none absolute flex items-center gap-2"
              style={{
                left: `${treatment.annotation.x * 100}%`,
                top: `${treatment.annotation.y * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <span
                className="block rounded-full ring-2 ring-white/70"
                style={{
                  width: tokens.line.dot,
                  height: tokens.line.dot,
                  backgroundColor: tokens.color.orange,
                }}
              />
              <span className="whitespace-nowrap font-heading text-[10px] font-semibold uppercase tracking-label text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] sm:text-[11px]">
                {treatment.annotation.text}
              </span>
            </span>
          )}

          <div
            className={`absolute flex max-w-[78%] flex-col gap-1 p-4 sm:p-5 ${CORNER[corner]}`}
          >
            {treatment.label && (
              <span
                className="font-heading text-[9px] font-semibold uppercase tracking-label sm:text-[10px]"
                style={{ color: tokens.color.orange }}
              >
                {treatment.label}
              </span>
            )}

            {treatment.main && (
              <span
                className="font-heading font-extrabold leading-none tracking-tight text-white"
                style={{ fontSize: 'clamp(2.2rem, 9vw, 4rem)' }}
              >
                {treatment.main}
              </span>
            )}

            {treatment.headline && (
              <span className="font-heading text-sm font-bold uppercase leading-tight tracking-label text-white sm:text-base">
                {treatment.headline}
              </span>
            )}

            {treatment.secondary && (
              <span className="text-[12px] leading-snug text-white/80 sm:text-[13px]">
                {treatment.secondary}
              </span>
            )}

            {treatment.footer && (
              <span className="mt-1 flex items-center gap-2 text-[10px] uppercase tracking-label text-white/60 sm:text-[11px]">
                <span
                  className="block h-px w-4"
                  style={{ backgroundColor: tokens.color.orange }}
                />
                {treatment.footer}
              </span>
            )}
          </div>
        </>
      )}
    </figure>
  );
}
