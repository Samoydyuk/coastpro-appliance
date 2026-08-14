import { MetadataRoute } from 'next';
import { services } from '@/data/services';
import { serviceAreas } from '@/data/service-areas';
import { siteConfig } from '@/data/site-config';
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
 */
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const currentDate = new Date();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/services`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/faq`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/service-areas`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/gallery`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/book-appointment`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ];

  // Service pages
  const servicePages: MetadataRoute.Sitemap = services.map((service) => ({
    url: `${BASE_URL}/services/${service.slug}`,
    lastModified: currentDate,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  // City/Service Area pages
  const cityPages: MetadataRoute.Sitemap = serviceAreas.map((area) => ({
    url: `${BASE_URL}/service-areas/${area.slug}`,
    lastModified: currentDate,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Published write-ups. Read from the database, and an empty list when there
  // is none to reach — a sitemap short a few pages is a far smaller problem
  // than a sitemap that 500s and takes the whole file out of the index.
  const articles = await readPublishedArticles();
  const articlePages: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${BASE_URL}/blog/${article.slug}`,
    lastModified: article.updatedAt ? new Date(article.updatedAt) : currentDate,
    changeFrequency: 'yearly' as const,
    priority: 0.5,
  }));

  return [...staticPages, ...servicePages, ...cityPages, ...articlePages];
}
