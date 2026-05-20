import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, Phone, CheckCircle, ArrowRight } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { CTABanner, ServicesGrid } from '@/components/sections';
import { serviceAreas, getServiceAreaBySlug, getNeighboringAreas } from '@/data/service-areas';
import { siteConfig } from '@/data/site-config';

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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-900 to-primary-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <nav className="flex items-center gap-2 text-sm text-primary-200 mb-6">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <Link href="/service-areas" className="hover:text-white transition-colors">Service Areas</Link>
              <span>/</span>
              <span className="text-white">{area.name}</span>
            </nav>

            <div className="flex items-center gap-3 mb-4">
              <MapPin className="h-8 w-8 text-accent-300" />
              <h1 className="font-heading text-4xl md:text-5xl font-bold">
                Appliance Repair in {area.name}
              </h1>
            </div>

            <p className="text-xl text-primary-100 mb-8 max-w-2xl">
              Professional appliance repair services for {area.name}, {area.state} residents.
              Same-day service available with our {siteConfig.trustSignals.warrantyDays}-day warranty.
            </p>

            <div className="flex flex-wrap gap-3 mb-8">
              {area.zipCodes.slice(0, 5).map((zip) => (
                <Badge key={zip} className="bg-white/10 text-white">
                  {zip}
                </Badge>
              ))}
              {area.zipCodes.length > 5 && (
                <Badge className="bg-white/10 text-white">
                  +{area.zipCodes.length - 5} more
                </Badge>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/book-appointment">
                <Button size="lg" className="bg-accent-500 hover:bg-accent-600">
                  Schedule Service in {area.name}
                </Button>
              </Link>
              <a href={`tel:${siteConfig.contact.phoneClean}`}>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                  leftIcon={<Phone className="h-5 w-5" />}
                >
                  {siteConfig.contact.phone}
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-heading text-3xl font-bold text-gray-900 mb-6">
              Appliance Repair Services in {area.name}
            </h2>
            <div className="prose prose-lg max-w-none text-gray-600">
              <p>{area.description}</p>
              <p>
                Our experienced technicians are familiar with {area.name} and can quickly reach
                any neighborhood. We understand that a broken appliance can disrupt your daily
                routine, which is why we offer same-day service and flexible appointment times.
              </p>
            </div>

            {/* Why Choose Us */}
            <div className="mt-12">
              <h3 className="font-heading text-2xl font-bold text-gray-900 mb-6">
                Why {area.name} Residents Choose Us
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  `Same-day service throughout ${area.name}`,
                  'Experienced technicians for all major brands',
                  `${siteConfig.trustSignals.warrantyDays}-day warranty on all repairs`,
                  'Upfront, transparent pricing',
                  'All major appliance brands',
                  'Local, family-owned business',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Landmarks */}
            {area.landmarks && area.landmarks.length > 0 && (
              <div className="mt-12">
                <h3 className="font-heading text-xl font-bold text-gray-900 mb-4">
                  Areas We Serve in {area.name}
                </h3>
                <p className="text-gray-600 mb-4">
                  We provide appliance repair near all major {area.name} landmarks and neighborhoods, including:
                </p>
                <div className="flex flex-wrap gap-2">
                  {area.landmarks.map((landmark) => (
                    <Badge key={landmark} variant="info">
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
        title={`Appliance Services in ${area.name}`}
        subtitle="We repair all major household appliances"
      />

      {/* Neighboring Areas */}
      {neighboringAreas.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="font-heading text-2xl font-bold text-gray-900 mb-6 text-center">
              Also Serving Nearby Cities
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              {neighboringAreas.map((neighbor) => (
                <Link
                  key={neighbor.id}
                  href={`/service-areas/${neighbor.slug}`}
                  className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all"
                >
                  <MapPin className="h-4 w-4 text-primary-600" />
                  <span className="font-medium text-gray-700">{neighbor.name}</span>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
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
