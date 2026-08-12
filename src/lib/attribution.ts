/**
 * Working out where a visit came from.
 *
 * The whole admin panel rests on this file: if a visit is filed under the wrong
 * channel here, every cost-per-lead number downstream is wrong too. The order of
 * checks matters and is deliberate — a click identifier beats a UTM tag, and a
 * UTM tag beats the referrer, because that is the order of how hard each one is
 * to fake or lose.
 */

export const CHANNELS = [
  'google_ads',
  'google_lsa',
  'google_organic',
  'meta_ads',
  'meta_organic',
  'bing_ads',
  'bing_organic',
  'tiktok_ads',
  'yelp_ads',
  'yelp',
  'nextdoor',
  'email',
  'sms',
  'referral',
  'organic_other',
  'paid_other',
  'direct',
  'internal',
] as const;

export type Channel = (typeof CHANNELS)[number];

/** Human labels for the dashboard. */
export const CHANNEL_LABELS: Record<Channel, string> = {
  google_ads: 'Google Ads',
  google_lsa: 'Local Services Ads',
  google_organic: 'Google organic',
  meta_ads: 'Meta Ads',
  meta_organic: 'Facebook / Instagram',
  bing_ads: 'Microsoft Ads',
  bing_organic: 'Bing organic',
  tiktok_ads: 'TikTok Ads',
  yelp_ads: 'Yelp Ads',
  yelp: 'Yelp',
  nextdoor: 'Nextdoor',
  email: 'Email',
  sms: 'SMS',
  referral: 'Referral',
  organic_other: 'Other organic',
  paid_other: 'Other paid',
  direct: 'Direct',
  internal: 'Internal',
};

/** Channels we expect to pay for — the ones that need a cost per lead. */
export const PAID_CHANNELS: Channel[] = [
  'google_ads',
  'google_lsa',
  'meta_ads',
  'bing_ads',
  'tiktok_ads',
  'yelp_ads',
];

export const CLICK_ID_PARAMS = [
  'gclid',
  'gbraid',
  'wbraid',
  'fbclid',
  'msclkid',
  'ttclid',
  'li_fat_id',
] as const;

export type ClickIdParam = (typeof CLICK_ID_PARAMS)[number];

export interface Attribution {
  channel: Channel;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  content: string | null;
  term: string | null;
  clickId: string | null;
  clickIdType: ClickIdParam | null;
  clickIds: Partial<Record<ClickIdParam, string>>;
  referrer: string | null;
  referrerDomain: string | null;
  landingPath: string;
  landingQuery: string | null;
}

function clean(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim().slice(0, 300);
  return trimmed.length ? trimmed : null;
}

function hostOf(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

/** Match a domain or any of its subdomains. */
function isHost(host: string | null, ...roots: string[]): boolean {
  if (!host) return false;
  return roots.some((root) => host === root || host.endsWith(`.${root}`));
}

const PAID_MEDIUMS = /^(cpc|ppc|paid|paidsearch|paid_search|paid-social|paidsocial|cpm|cpv|display|retargeting|remarketing)$/i;

/**
 * Decide the channel from everything we know about the visit.
 *
 * `utm_source` wins over the referrer even when a click id is present, because
 * the click id only tells us which ad platform stamped the click, and one
 * platform can carry several of our channels — Google Ads and Local Services
 * Ads both arrive with Google identifiers but have completely different
 * economics.
 */
export function resolveChannel(input: {
  source: string | null;
  medium: string | null;
  clickIds: Partial<Record<ClickIdParam, string>>;
  referrerHost: string | null;
  currentHost?: string | null;
  campaign?: string | null;
}): Channel {
  const source = (input.source || '').toLowerCase();
  const medium = (input.medium || '').toLowerCase();
  const host = input.referrerHost;
  const ids = input.clickIds;

  // An explicitly tagged Local Services / Google Guaranteed visit. LSA does not
  // hand out its own click id, so the tag is the only signal — set the final
  // URL in the LSA profile to carry ?utm_source=google&utm_medium=lsa.
  if (medium === 'lsa' || source === 'lsa' || source === 'localservices' || medium === 'local-services') {
    return 'google_lsa';
  }

  if (medium === 'yelp-ads' || (source === 'yelp' && PAID_MEDIUMS.test(medium))) return 'yelp_ads';

  // Click identifiers: the strongest evidence a visit was paid for.
  if (ids.gclid || ids.gbraid || ids.wbraid) return 'google_ads';
  if (ids.msclkid) return 'bing_ads';
  if (ids.ttclid) return 'tiktok_ads';
  if (ids.fbclid) {
    // Meta stamps fbclid on organic post links too, so it only proves the click
    // came through Facebook — the medium decides whether we paid for it.
    if (PAID_MEDIUMS.test(medium) || source === 'facebook_ads' || source === 'meta') return 'meta_ads';
    return medium ? (PAID_MEDIUMS.test(medium) ? 'meta_ads' : 'meta_organic') : 'meta_organic';
  }

  // Tagged, but without a platform identifier.
  if (medium === 'email' || source === 'email' || source === 'resend' || source === 'newsletter') return 'email';
  if (medium === 'sms' || source === 'sms' || source === 'telnyx' || source === 'twilio') return 'sms';

  if (PAID_MEDIUMS.test(medium)) {
    if (source.includes('google')) return 'google_ads';
    if (source.includes('bing') || source.includes('microsoft')) return 'bing_ads';
    if (source.includes('facebook') || source.includes('instagram') || source.includes('meta')) return 'meta_ads';
    if (source.includes('tiktok')) return 'tiktok_ads';
    if (source.includes('yelp')) return 'yelp_ads';
    if (source.includes('nextdoor')) return 'nextdoor';
    return 'paid_other';
  }

  // Untagged: fall back to who sent them.
  if (input.currentHost && isHost(host, input.currentHost)) return 'internal';

  if (isHost(host, 'google.com', 'google.co.uk', 'google.ca', 'googleadservices.com')) {
    return 'google_organic';
  }
  if (isHost(host, 'bing.com', 'msn.com')) return 'bing_organic';
  if (isHost(host, 'facebook.com', 'instagram.com', 'fb.com', 'm.facebook.com', 'l.facebook.com')) {
    return 'meta_organic';
  }
  if (isHost(host, 'yelp.com', 'yelp.to')) return 'yelp';
  if (isHost(host, 'nextdoor.com')) return 'nextdoor';
  if (isHost(host, 'duckduckgo.com', 'search.yahoo.com', 'ecosia.org', 'brave.com', 'yahoo.com')) {
    return 'organic_other';
  }
  if (host) return 'referral';

  if (source) return 'referral';
  return 'direct';
}

/**
 * Read a landing URL and referrer into the shape we store. Everything is
 * length-capped: these strings are attacker-controlled.
 */
export function readAttribution(
  landingUrl: string,
  referrer: string | null,
  currentHost?: string | null
): Attribution {
  let url: URL;
  try {
    url = new URL(landingUrl);
  } catch {
    url = new URL('https://coastpro.us/');
  }
  const q = url.searchParams;

  const clickIds: Partial<Record<ClickIdParam, string>> = {};
  for (const param of CLICK_ID_PARAMS) {
    const value = clean(q.get(param));
    if (value) clickIds[param] = value.slice(0, 200);
  }

  const referrerHost = hostOf(referrer);
  // A referrer from our own site means an internal navigation was mistaken for
  // a landing — treat it as no referrer at all rather than as a "referral".
  const externalReferrer =
    referrerHost && currentHost && isHost(referrerHost, currentHost) ? null : referrer;

  const source = clean(q.get('utm_source'));
  const medium = clean(q.get('utm_medium'));
  const campaign = clean(q.get('utm_campaign')) ?? clean(q.get('campaign'));

  const channel = resolveChannel({
    source,
    medium,
    campaign,
    clickIds,
    referrerHost: hostOf(externalReferrer),
    currentHost,
  });

  // Google Ads' own auto-tagging leaves the source blank; naming it after the
  // resolved channel keeps the "source / medium" column readable.
  const resolvedSource =
    source ??
    (clickIds.gclid || clickIds.gbraid || clickIds.wbraid
      ? 'google'
      : clickIds.msclkid
        ? 'bing'
        : clickIds.fbclid
          ? 'facebook'
          : clickIds.ttclid
            ? 'tiktok'
            : hostOf(externalReferrer));

  const clickIdType = (CLICK_ID_PARAMS.find((p) => clickIds[p]) ?? null) as ClickIdParam | null;

  return {
    channel,
    source: resolvedSource,
    medium: medium ?? (clickIdType ? 'cpc' : externalReferrer ? 'referral' : '(none)'),
    campaign,
    content: clean(q.get('utm_content')) ?? clean(q.get('utm_ad')),
    term: clean(q.get('utm_term')) ?? clean(q.get('keyword')),
    clickId: clickIdType ? clickIds[clickIdType] ?? null : null,
    clickIdType,
    clickIds,
    referrer: externalReferrer ? externalReferrer.slice(0, 500) : null,
    referrerDomain: hostOf(externalReferrer),
    landingPath: url.pathname.slice(0, 300),
    landingQuery: url.search ? url.search.slice(1, 800) : null,
  };
}

export function channelLabel(channel: string | null | undefined): string {
  if (!channel) return 'Unknown';
  return CHANNEL_LABELS[channel as Channel] ?? channel;
}

export function isPaidChannel(channel: string | null | undefined): boolean {
  return PAID_CHANNELS.includes(channel as Channel);
}
