import { MetadataRoute } from 'next';
import { services } from '@/data/services';
import { serviceAreas } from '@/data/service-areas';
import { brands } from '@/data/brands';
import { siteConfig } from '@/data/site-config';
import { brandErrorCodes } from '@/data/error-codes';
import { brandAppliances } from '@/data/brand-appliance';
import {
  brandUpdated,
  BRAND_APPLIANCE_UPDATED,
  errorCodesUpdated,
  CITY_CONTENT_UPDATED,
  pageUpdated,
  serviceUpdated,
  updatedAt,
} from '@/data/content-dates';
import { readPublishedArticles } from '@/lib/marketing/published';

const BASE_URL = siteConfig.seo.siteUrl;

/**
 * Built per request, because part of this file now comes from the database.
 *
 * Left static it would be frozen at build time, and a sitemap that is quietly
 * a week behind is worse than one that costs a query: it is the file that
 * tells a crawler what exists, and nothing about it looks broken when it is
 * wrong. The cost is one query per fetch of a file crawlers ask for a handful
 * of times a day.
 *
 * What is *not* per-request is `lastmod` — see `data/content-dates`. Generating
 * it here from the clock made every entry claim a change that had not happened.
 */
export const dynamic = 'force-dynamic';

/** Path (no leading slash), change frequency, priority. */
const STATIC_ROUTES: Array<[string, MetadataRoute.Sitemap[number]['changeFrequency'], number]> = [
  ['', 'weekly', 1],
  ['services', 'weekly', 0.9],
  ['service-areas', 'monthly', 0.8],
  ['brands', 'monthly', 0.8],
  ['same-day', 'monthly', 0.8],
  ['sitemap', 'monthly', 0.3],
  ['error-codes', 'monthly', 0.7],
  ['book-appointment', 'monthly', 0.9],
  ['contact', 'monthly', 0.8],
  ['about', 'monthly', 0.7],
  ['blog', 'weekly', 0.6],
  ['faq', 'monthly', 0.6],
  ['gallery', 'weekly', 0.5],
  ['privacy', 'yearly', 0.2],
  ['terms', 'yearly', 0.2],
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = STATIC_ROUTES.map(
    ([path, changeFrequency, priority]) => ({
      url: path ? `${BASE_URL}/${path}` : BASE_URL,
      lastModified: updatedAt(pageUpdated[path]),
      changeFrequency,
      priority,
    })
  );

  const servicePages: MetadataRoute.Sitemap = services.map((service) => ({
    url: `${BASE_URL}/services/${service.slug}`,
    lastModified: updatedAt(serviceUpdated[service.slug]),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const brandPages: MetadataRoute.Sitemap = brands.map((brand) => ({
    url: `${BASE_URL}/brands/${brand.slug}`,
    lastModified: updatedAt(brandUpdated[brand.slug]),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  // One brand against one machine — the narrowest commercial page on the site
  // and the one that converts hardest, so it ranks with the brand pages rather
  // than below them.
  const brandAppliancePages: MetadataRoute.Sitemap = brandAppliances.map((entry) => ({
    url: `${BASE_URL}/brands/${entry.brandSlug}/${entry.serviceSlug}`,
    lastModified: updatedAt(BRAND_APPLIANCE_UPDATED),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  // Reference rather than sales copy, so a lower priority than the pages that
  // ask for the booking — but a real one. These answer a question nothing else
  // on the site answers, and they are what someone standing in front of a
  // beeping machine is actually searching for.
  const errorCodePages: MetadataRoute.Sitemap = brandErrorCodes.map((entry) => ({
    url: `${BASE_URL}/error-codes/${entry.brandSlug}`,
    lastModified: updatedAt(errorCodesUpdated[entry.brandSlug]),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const cityPages: MetadataRoute.Sitemap = serviceAreas.map((area) => ({
    url: `${BASE_URL}/service-areas/${area.slug}`,
    lastModified: updatedAt(CITY_CONTENT_UPDATED),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Published write-ups. Read from the database, and an empty list when there
  // is none to reach — a sitemap short a few pages is a far smaller problem
  // than a sitemap that 500s and takes the whole file out of the index.
  //
  // These carry a genuine timestamp, so they use it. An article somehow missing
  // both dates still gets listed — being in the sitemap on a stale date beats
  // not being in it at all.
  const articles = await readPublishedArticles();
  const articlePages: MetadataRoute.Sitemap = articles.map((article) => {
    const stamp = article.updatedAt ?? article.publishedAt;
    return {
      url: `${BASE_URL}/blog/${article.slug}`,
      lastModified: stamp ? new Date(stamp) : updatedAt(undefined),
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    };
  });

  return [
    ...staticPages,
    ...servicePages,
    ...brandPages,
    ...brandAppliancePages,
    ...errorCodePages,
    ...cityPages,
    ...articlePages,
  ];
}
