import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, Phone, Check, ArrowRight } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { CTABanner, ServicesGrid, StatsBand } from '@/components/sections';
import { serviceAreas, getServiceAreaBySlug, getNeighboringAreas } from '@/data/service-areas';
import { siteConfig } from '@/data/site-config';
import { breadcrumbSchema } from '@/lib/schema';

interface CityPageProps {
  params: Promise<{ city: string }>;
}

export async function generateStaticParams() {
  return serviceAreas.map((area) => ({
    city: area.slug,
  }));
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { city } = await params;
  const area = getServiceAreaBySlug(city);

  if (!area) {
    return {
      title: 'City Not Found',
    };
  }

  return {
    title: area.seo.title,
    description: area.seo.description,
    keywords: area.seo.keywords,
    openGraph: {
      title: area.seo.title,
      description: area.seo.description,
    },
  };
}

export default async function CityPage({ params }: CityPageProps) {
  const { city } = await params;
  const area = getServiceAreaBySlug(city);

  if (!area) {
    notFound();
  }

  const neighboringAreas = getNeighboringAreas(city);

  // JSON-LD for Local Business in this city
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    // The same business as the one in the site layout, not a second branch in
    // each of fifteen towns. Without a matching @id these pages describe
    // fifteen separate companies with one phone number between them, which is
    // exactly the shape a search engine is right to distrust. With it, the
    // page adds the town it serves to the business that already exists.
    '@id': `${siteConfig.seo.siteUrl}/#organization`,
    name: `${siteConfig.name} - ${area.name}`,
    description: area.description,
    url: `${siteConfig.seo.siteUrl}/service-areas/${area.slug}`,
    telephone: siteConfig.contact.phone,
    areaServed: {
      '@type': 'City',
      name: area.name,
      containedIn: {
        '@type': 'County',
        name: area.county,
      },
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: area.coordinates.lat,
      longitude: area.coordinates.lng,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: 'Service Areas', path: '/service-areas' },
              { name: area.name, path: `/service-areas/${area.slug}` },
            ])
          ),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />

      {/* Hero Section */}
      <section className="bg-cream border-b border-primary-500/20 py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <nav className="flex items-center gap-2 text-sm text-primary-500 mb-8">
              <Link href="/" className="hover:text-ink transition-colors">Home</Link>
              <span>/</span>
              <Link href="/service-areas" className="hover:text-ink transition-colors">Service Areas</Link>
              <span>/</span>
              <span className="text-ink">{area.name}</span>
            </nav>

            <div className="flex items-center gap-2 eyebrow mb-4">
              <MapPin className="h-3.5 w-3.5" strokeWidth={2} />
              {area.name}, {area.state}
            </div>
            <h1 className="headline text-3xl sm:text-4xl md:text-5xl">
              Appliance repair
              <br />
              <span className="headline-muted">in {area.name}.</span>
            </h1>
            <div className="rule-short my-8" />

            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-prose">
              Professional appliance repair for {area.name}, {area.state} residents.
              Same-day service available with our {siteConfig.trustSignals.warrantyDays}-day warranty.
            </p>

            <div className="flex flex-wrap gap-3 mb-8">
              {area.zipCodes.slice(0, 5).map((zip) => (
                <Badge key={zip}>
                  {zip}
                </Badge>
              ))}
              {area.zipCodes.length > 5 && (
                <Badge>
                  +{area.zipCodes.length - 5} more
                </Badge>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/book-appointment">
                <Button size="lg">Schedule Service</Button>
              </Link>
              <a href={`tel:${siteConfig.contact.phoneClean}`}>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-ink text-ink hover:bg-ink hover:text-cream"
                  leftIcon={<Phone className="h-4 w-4" />}
                >
                  {siteConfig.contact.phone}
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      <StatsBand />

      {/* About Section */}
      <section className="py-20 bg-cream">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <div className="eyebrow mb-4">01 — Local Service</div>
            <h2 className="headline text-2xl sm:text-3xl mb-8">
              Appliance repair services in {area.name}
            </h2>
            <div className="space-y-5 text-lg leading-relaxed text-gray-600 max-w-prose">
              <p>{area.description}</p>
              <p>
                Our experienced technicians are familiar with {area.name} and can quickly reach
                any neighborhood. We understand that a broken appliance can disrupt your daily
                routine, which is why we offer same-day service and flexible appointment times.
              </p>
            </div>

            {/* Why Choose Us */}
            <div className="mt-12">
              <div className="eyebrow mb-4">02 — Why Us</div>
              <h3 className="headline text-2xl mb-8">
                Why {area.name} residents choose us
              </h3>
              <div className="grid md:grid-cols-2 gap-x-10">
                {[
                  `Same-day service throughout ${area.name}`,
                  'Experienced technicians for all major brands',
                  `${siteConfig.trustSignals.warrantyDays}-day warranty on all repairs`,
                  'Upfront, transparent pricing',
                  'All major appliance brands',
                  'Local, family-owned business',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 py-3 border-b border-primary-500/20">
                    <Check className="h-4 w-4 text-primary-500 shrink-0 mt-1" strokeWidth={2} />
                    <span className="text-gray-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Landmarks */}
            {area.landmarks && area.landmarks.length > 0 && (
              <div className="mt-12">
                <div className="eyebrow mb-4">03 — Neighborhoods</div>
                <h3 className="headline text-xl mb-4">
                  Areas we serve in {area.name}
                </h3>
                <p className="text-gray-600 mb-4">
                  We provide appliance repair near all major {area.name} landmarks and neighborhoods, including:
                </p>
                <div className="flex flex-wrap gap-2">
                  {area.landmarks.map((landmark) => (
                    <Badge key={landmark}>
                      {landmark}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Services */}
      <ServicesGrid
        eyebrow="04 — Services"
        title={`Appliance services in ${area.name}`}
        subtitle="We repair all major household appliances"
      />

      {/* Neighboring Areas */}
      {neighboringAreas.length > 0 && (
        <section className="py-20 bg-cream-light border-t border-primary-500/20">
          <div className="container mx-auto px-4">
            <div className="eyebrow mb-4">05 — Nearby</div>
            <h2 className="headline text-2xl mb-8">Also serving nearby cities</h2>
            <div className="flex flex-wrap gap-4">
              {neighboringAreas.map((neighbor) => (
                <Link
                  key={neighbor.id}
                  href={`/service-areas/${neighbor.slug}`}
                  className="flex items-center gap-2 px-4 py-2 border border-primary-500/25 hover:border-ink hover:bg-cream-dark/50 transition-colors"
                >
                  <MapPin className="h-4 w-4 text-primary-500" strokeWidth={1.5} />
                  <span className="font-heading text-[11px] font-semibold uppercase tracking-label text-ink">{neighbor.name}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-primary-400" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <CTABanner
        title={`Ready for Appliance Repair in ${area.name}?`}
        subtitle="Our local technicians are standing by. Same-day service available!"
      />
    </>
  );
}
