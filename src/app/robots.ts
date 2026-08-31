import { MetadataRoute } from 'next';
import { siteConfig } from '@/data/site-config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // `/report/` is a customer's own invoice behind a token in the URL. The
      // page already says noindex, which is the control that matters; this line
      // is for the crawlers that read the file and never fetch the page.
      disallow: ['/api/', '/admin/', '/report/'],
    },
    sitemap: `${siteConfig.seo.siteUrl}/sitemap.xml`,
  };
}
