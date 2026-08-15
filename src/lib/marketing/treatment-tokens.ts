/**
 * The one set of values every piece of photo treatment is built from.
 *
 * Two things draw a Field Note: the overlay on the page, in HTML and CSS, and
 * the canvas that composes a 4:5 card for social. If either kept its own idea
 * of what the orange is or how big a code should be, the two would drift and
 * nobody would notice until the drift was published. So both read this.
 *
 * The sizes are given for a 1080×1350 render, which is what the specification
 * pins its minimums to, and scaled from there — `scale()` below is the only
 * arithmetic allowed on them.
 */

export const TREATMENT_VERSION = 'coastpro_field_journal_v1';

export const tokens = {
  color: {
    /** Sampled from the wordmark itself, not guessed. */
    orange: '#d67114',
    /** Deep, slightly warm black — the graphite the creatives are built on. */
    graphite: '#1c1a18',
    white: '#ffffff',
    /** Text that is present but not the point. */
    muted: 'rgba(255,255,255,0.72)',
  },

  /**
   * Text never sits on a black rectangle — it sits on a gradient that fades
   * into the photograph, so the photograph stays the picture (§16).
   *
   * The two strengths are for a dark corner and a bright one; which is used is
   * decided at render from the region the text lands in.
   */
  scrim: {
    normal: 'rgba(28,26,24,0.45)',
    strong: 'rgba(28,26,24,0.68)',
  },

  /** Minimums from §20, at 1080×1350. Everything scales from these. */
  type: {
    label: 26,
    metadata: 25,
    secondary: 28,
    annotation: 36,
    headline: 54,
    /** The error code or the number — the one thing read from across a room. */
    main: 120,
  },

  line: {
    hairline: 2,
    rule: 3,
    /** The thread from an annotation dot to its label. */
    annotation: 2,
    dot: 9,
  },

  space: {
    edge: 56,
    gap: 14,
    block: 26,
  },

  radius: 10,

  /**
   * How much of the frame the subject must keep to itself (§7).
   *
   * Overlay and annotation both stay outside this margin around whatever the
   * photograph is actually of.
   */
  safeArea: 0.1,

  /**
   * Below this the model is guessing, and a guess becomes a clean photograph
   * rather than a confident caption (§41).
   */
  confidenceFloor: 0.55,
} as const;

/** A size from the table above, at whatever width the thing is really drawn. */
export function scale(size: number, renderedWidth: number): number {
  return Math.round((size * renderedWidth) / 1080);
}

/**
 * The proportions the same photograph is asked to fill.
 *
 * Cropping is done by moving the frame over the picture rather than cutting the
 * picture, so one file serves all of these and the original is never touched.
 */
export const FORMATS = {
  hero: 16 / 9,
  inline: 4 / 3,
  social: 4 / 5,
  thumbnail: 1,
} as const;

export type FormatName = keyof typeof FORMATS;
