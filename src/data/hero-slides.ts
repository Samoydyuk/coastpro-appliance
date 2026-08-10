export interface HeroSlide {
  /** Path under /public, e.g. "/images/hero/washer-f22.jpg" */
  src: string;
  /** Describes the photo for screen readers and if the image fails to load. */
  alt: string;
  /** Small uppercase line above the caption, e.g. "Newport Coast, CA". */
  location?: string;
  /** One line on what the job was, as on the brand creatives. */
  caption?: string;
}

export interface SlideCaption {
  alt: string;
  location?: string;
  caption?: string;
}

/**
 * Optional captions for the hero photos, keyed by file name.
 *
 * Photos are picked up automatically from `public/images/hero/` — dropping a
 * file in that folder is enough to put it in the slider. Add an entry here
 * only when you want the location and job line shown over it; without one the
 * photo still runs, captionless, with a generic alt.
 *
 * Slides play in file-name order, so a `01-`, `02-` prefix controls the
 * sequence.
 */
export const slideCaptions: Record<string, SlideCaption> = {
  '01-subzero-coils.jpg': {
    alt: 'Sub-Zero condenser coils packed with dust before cleaning',
    location: 'Irvine, CA',
    caption: 'Sub-Zero ice production restored after coil cleaning',
  },
  '02-washer-door-latch.jpg': {
    alt: 'Front-load washer showing an End cycle after the door latch was replaced',
    location: 'Newport Coast, CA',
    caption: 'F22 error — door latch assembly replaced',
  },
  '03-dryer-lint.jpg': {
    alt: 'Heavy lint buildup inside a dryer before cleaning',
    location: 'Irvine, CA',
    caption: 'Lint buildup cleared during routine dryer service',
  },
};
