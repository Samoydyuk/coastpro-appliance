import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle, Clock, Shield, ArrowRight, Phone, Wrench } from 'lucide-react';
import { Button, Card, CardContent, Badge } from '@/components/ui';
import { CTABanner } from '@/components/sections';
import { services, getServiceBySlug, getRelatedServices } from '@/data/services';
import { siteConfig } from '@/data/site-config';

interface ServicePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return services.map((service) => ({
    slug: service.slug,
  }));
}

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);

  if (!service) {
    return {
      title: 'Service Not Found',
    };
  }

  return {
    title: service.seo.title,
    description: service.seo.description,
    keywords: service.seo.keywords,
    openGraph: {
      title: service.seo.title,
      description: service.seo.description,
    },
  };
}

export default async function ServicePage({ params }: ServicePageProps) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);

  if (!service) {
    notFound();
  }

  const relatedServices = getRelatedServices(slug);

  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-900 to-primary-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <nav className="flex items-center gap-2 text-sm text-primary-200 mb-6">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <Link href="/services" className="hover:text-white transition-colors">Services</Link>
              <span>/</span>
              <span className="text-white">{service.name}</span>
            </nav>

            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
              {service.name} in Orange County
            </h1>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl">
              {service.shortDescription}
            </p>

            <div className="flex flex-wrap gap-4 mb-8">
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
                <Clock className="h-5 w-5 text-accent-300" />
                <span>{service.estimatedTime}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
                <Shield className="h-5 w-5 text-accent-300" />
                <span>{service.warranty}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
                <Wrench className="h-5 w-5 text-accent-300" />
                <span>${service.priceRange.min} - ${service.priceRange.max}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/book-appointment">
                <Button size="lg" className="bg-accent-500 hover:bg-accent-600">
                  Schedule Service
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

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-12">
              {/* Description */}
              <div>
                <h2 className="font-heading text-2xl font-bold text-gray-900 mb-4">
                  Expert {service.name} Services
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed">
                  {service.fullDescription}
                </p>
              </div>

              {/* Common Problems */}
              <div>
                <h2 className="font-heading text-2xl font-bold text-gray-900 mb-6">
                  Common Problems We Fix
                </h2>
                <div className="space-y-4">
                  {service.commonProblems.map((problem, index) => (
                    <Card key={index}>
                      <CardContent className="p-6">
                        <h3 className="font-semibold text-lg text-gray-900 mb-2">
                          {problem.title}
                        </h3>
                        <p className="text-gray-600 mb-3">{problem.description}</p>
                        <div className="mb-3">
                          <span className="text-sm font-medium text-gray-700">Symptoms:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {problem.symptoms.map((symptom, i) => (
                              <Badge key={i} variant="default" size="sm">
                                {symptom}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-primary-600">
                          <strong>Solution:</strong> {problem.solution}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Brands */}
              <div>
                <h2 className="font-heading text-2xl font-bold text-gray-900 mb-4">
                  Brands We Service
                </h2>
                <div className="flex flex-wrap gap-3">
                  {service.brands.map((brand) => (
                    <Badge key={brand} variant="info" size="md">
                      {brand}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Features Card */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg text-gray-900 mb-4">
                    Why Choose Us
                  </h3>
                  <ul className="space-y-3">
                    {service.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Quick Quote Card */}
              <Card className="bg-primary-50 border-primary-200">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    Service Call Fee
                  </h3>
                  <div className="text-3xl font-bold text-primary-600 mb-2">
                    ${siteConfig.serviceFee.diagnostic}
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    {siteConfig.serviceFee.note}
                  </p>
                  <Link href="/book-appointment">
                    <Button className="w-full">
                      Book Appointment
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Related Services */}
              {relatedServices.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg text-gray-900 mb-4">
                      Related Services
                    </h3>
                    <ul className="space-y-3">
                      {relatedServices.map((related) => (
                        <li key={related.id}>
                          <Link
                            href={`/services/${related.slug}`}
                            className="flex items-center justify-between text-gray-600 hover:text-primary-600 transition-colors"
                          >
                            <span>{related.name}</span>
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>

      <CTABanner
        title={`Ready to Fix Your ${service.name.replace(' Repair', '')}?`}
        subtitle="Our expert technicians are standing by. Same-day service available!"
      />
    </>
  );
}
