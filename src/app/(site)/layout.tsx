import type { Metadata } from 'next';
import Script from 'next/script';
import { Header, Footer } from '@/components/layout';
import { Tracker, PhoneSwap } from '@/components/analytics';
import { siteConfig } from '@/data/site-config';

/** The public site: chrome, tags and structured data. */

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.seo.siteUrl),
  title: {
    default: `${siteConfig.name} | Professional Appliance Repair in Orange County`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    'appliance repair orange county',
    'refrigerator repair',
    'washer repair',
    'dryer repair',
    'dishwasher repair',
    'oven repair',
    'appliance repair near me',
    'same day appliance repair',
    'irvine appliance repair',
    'newport beach appliance repair',
  ],
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  openGraph: {
    type: 'website',
    locale: siteConfig.seo.locale,
    url: siteConfig.seo.siteUrl,
    siteName: siteConfig.name,
    title: `${siteConfig.name} | Orange County's Trusted Appliance Repair`,
    description: siteConfig.description,
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    site: siteConfig.seo.twitterHandle,
    images: ['/images/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: siteConfig.seo.siteUrl,
  },
};

// JSON-LD Schema for Local Business
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HomeAndConstructionBusiness',
  '@id': `${siteConfig.seo.siteUrl}/#organization`,
  name: siteConfig.name,
  description: siteConfig.description,
  url: siteConfig.seo.siteUrl,
  telephone: siteConfig.contact.phone,
  email: siteConfig.contact.email,
  address: {
    '@type': 'PostalAddress',
    streetAddress: siteConfig.contact.address.street,
    addressLocality: siteConfig.contact.address.city,
    addressRegion: siteConfig.contact.address.state,
    postalCode: siteConfig.contact.address.zip,
    addressCountry: 'US',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 33.6846,
    longitude: -117.8265,
  },
  areaServed: {
    '@type': 'County',
    name: 'Orange County',
    containedIn: {
      '@type': 'State',
      name: 'California',
    },
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '09:00',
      closes: '20:00',
    },
  ],
  priceRange: '$$',
  image: `${siteConfig.seo.siteUrl}/images/logo.png`,
  logo: `${siteConfig.seo.siteUrl}/images/logo.png`,
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-W9Q0EMD7Q5"
        strategy="afterInteractive"
      />
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=AW-17933522484"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-W9Q0EMD7Q5');
          gtag('config', 'AW-17933522484');
          gtag('config', 'AW-17933522484/6jxqCNLHq4EcELSsr-dC', {
            'phone_conversion_number': '(949) 749-0006'
          });
        `}
      </Script>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:top-4 focus:left-4 focus:bg-ink focus:text-cream focus:px-5 focus:py-3 focus:font-heading focus:text-xs focus:font-semibold focus:uppercase focus:tracking-label"
      >
        Skip to content
      </a>
      <Header />
      <main id="main-content" className="flex-grow">
        {children}
      </main>
      <Footer />
      <Tracker />
      <PhoneSwap />
    </>
  );
}
