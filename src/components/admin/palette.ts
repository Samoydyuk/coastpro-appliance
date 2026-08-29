/**
 * Chart colours.
 *
 * The eight categorical slots are a validated set — checked against the cream
 * surface these charts render on for lightness band, chroma, colour-blind
 * separation and normal-vision separation. Four of them land under 3:1 contrast
 * against that surface, which is allowed only because every chart here also
 * carries a direct label or a legend, so colour never carries meaning alone.
 *
 * Channels get a fixed slot rather than a position in the sort order. If a
 * filter removes Meta from the chart, Google Ads must not turn orange.
 */

export const SURFACE = '#fcfcfb';
export const PLANE = '#f2f0eb';
export const INK = '#111111';
export const INK_SECONDARY = '#52514e';
export const INK_MUTED = '#898781';
export const GRIDLINE = '#e1e0d9';
export const BASELINE = '#c3c2b7';

export const SERIES = [
  '#2a78d6', // blue
  '#eb6834', // orange
  '#1baf7a', // aqua
  '#eda100', // yellow
  '#e87ba4', // magenta
  '#008300', // green
  '#4a3aa7', // violet
  '#e34948', // red
] as const;

export const STATUS = {
  good: '#0ca30c',
  warning: '#fab219',
  serious: '#ec835a',
  critical: '#d03b3b',
} as const;

/** One-hue ramp for magnitude — heatmaps and anything continuous. */
export const SEQUENTIAL = [
  '#cde2fb',
  '#b7d3f6',
  '#9ec5f4',
  '#86b6ef',
  '#6da7ec',
  '#5598e7',
  '#3987e5',
  '#2a78d6',
  '#256abf',
  '#1c5cab',
] as const;

const CHANNEL_SLOT: Record<string, number> = {
  google_ads: 0,
  meta_ads: 1,
  google_lsa: 2,
  yelp_ads: 3,
  yelp: 3,
  bing_ads: 4,
  google_organic: 5,
  tiktok_ads: 6,
  nextdoor: 7,
};

/** Everything without a reserved slot shares one recessive grey. */
export const NEUTRAL = '#a9a196';

export function channelColor(channel: string): string {
  const slot = CHANNEL_SLOT[channel];
  return slot === undefined ? NEUTRAL : SERIES[slot]!;
}

/**
 * How the money arrived. Fixed slots for the same reason channels have them:
 * filtering cash out of a view must not repaint Stripe.
 */
const PAYMENT_SLOT: Record<string, number> = {
  STRIPE: 0,
  CASH: 1,
  CHECK: 2,
  BANK_TRANSFER: 3,
  ZELLE: 4,
  VENMO: 5,
};

export function paymentColor(method: string): string {
  const slot = PAYMENT_SLOT[method];
  return slot === undefined ? NEUTRAL : SERIES[slot]!;
}

export function sequentialColor(fraction: number): string {
  if (!Number.isFinite(fraction) || fraction <= 0) return '#f2f0eb';
  const index = Math.min(SEQUENTIAL.length - 1, Math.floor(fraction * SEQUENTIAL.length));
  return SEQUENTIAL[index]!;
}

/** Green for good, red for bad — except where more is worse. */
export function deltaColor(value: number | null, higherIsBetter = true): string {
  if (value === null || value === 0) return INK_MUTED;
  const good = higherIsBetter ? value > 0 : value < 0;
  return good ? '#006300' : STATUS.critical;
}
