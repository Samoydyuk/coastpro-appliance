import { siteConfig } from '@/data/site-config';

/**
 * The structured data the detail pages carry.
 *
 * Two things live here, both of them for one reason: a search engine reading
 * this site can see thirty-odd pages but not how they hang together, and not
 * which of them are offers of a service rather than prose about one.
 *
 * The rule followed throughout: nothing is asserted that is not true elsewhere
 * on the page. No ratings, no review counts, no prices we do not publish. A
 * schema block is a claim made to a machine, and a claim made to a machine is
 * still a claim.
 */

const BASE = siteConfig.seo.siteUrl;

/** Where a page sits, so the trail can be shown in a result rather than a URL. */
export function breadcrumbSchema(trail: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { name: 'Home', path: '/' },
      ...trail,
    ].map((entry, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: entry.name,
      item: `${BASE}${entry.path}`,
    })),
  };
}

/**
 * A repair service, as an offer.
 *
 * `priceRange` rather than a price: the published figures are typical, not a
 * quote, and the site says so in words. Saying otherwise here would be the
 * same overstatement in a place customers cannot see it.
 */
export function serviceSchema(input: {
  name: string;
  description: string;
  path: string;
  priceFrom: number;
  priceTo: number;
  brands?: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${BASE}${input.path}#service`,
    name: input.name,
    description: input.description,
    serviceType: input.name,
    url: `${BASE}${input.path}`,
    provider: { '@id': `${BASE}/#organization` },
    areaServed: {
      '@type': 'County',
      name: 'Orange County',
      containedIn: { '@type': 'State', name: 'California' },
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      priceSpecification: {
        '@type': 'PriceSpecification',
        minPrice: input.priceFrom,
        maxPrice: input.priceTo,
        priceCurrency: 'USD',
      },
      availability: 'https://schema.org/InStock',
    },
    ...(input.brands?.length ? { brand: input.brands.map((name) => ({ '@type': 'Brand', name })) } : {}),
  };
}
