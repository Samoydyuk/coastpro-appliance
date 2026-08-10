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
  // 'washer-f22.jpg': {
  //   alt: 'Front-load washer after a door latch replacement',
  //   location: 'Newport Coast, CA',
  //   caption: 'F22 error — door latch assembly replaced',
  // },
};
