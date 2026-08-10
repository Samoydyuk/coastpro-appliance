import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Check, Clock, Shield, ArrowRight, Phone, Wrench, Info } from 'lucide-react';
import { Button, Card, CardContent, Badge } from '@/components/ui';
import { CTABanner, StatsBand } from '@/components/sections';
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

  // Section numbering shifts when a service carries a pricing table.
  const sections = [
    'Overview',
    ...(service.pricing ? ['Pricing'] : []),
    'Diagnosis',
    ...(service.brands.length > 0 ? ['Brands'] : []),
  ];
  const step = (label: string) =>
    `${String(sections.indexOf(label) + 1).padStart(2, '0')} — ${label}`;

  return (
    <>
      {/* Hero Section */}
      <section className="bg-cream border-b border-primary-500/20 py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <nav className="flex items-center gap-2 text-sm text-primary-500 mb-8">
              <Link href="/" className="hover:text-ink transition-colors">Home</Link>
              <span>/</span>
              <Link href="/services" className="hover:text-ink transition-colors">Services</Link>
              <span>/</span>
              <span className="text-ink">{service.name}</span>
            </nav>

            <div className="eyebrow mb-4">Service</div>
            <h1 className="headline text-3xl sm:text-4xl md:text-5xl">
              {service.name}
              <br />
              <span className="headline-muted">in Orange County.</span>
            </h1>
            <div className="rule-short my-8" />
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-prose">
              {service.shortDescription}
            </p>

            <div className="flex flex-wrap gap-4 mb-8">
              <div className="flex items-center gap-2 border border-primary-500/30 px-4 py-2">
                <Clock className="h-4 w-4 text-primary-500" strokeWidth={1.5} />
                <span>{service.estimatedTime}</span>
              </div>
              <div className="flex items-center gap-2 border border-primary-500/30 px-4 py-2">
                <Shield className="h-4 w-4 text-primary-500" strokeWidth={1.5} />
                <span>{service.warranty}</span>
              </div>
              <div className="flex items-center gap-2 border border-primary-500/30 px-4 py-2">
                <Wrench className="h-4 w-4 text-primary-500" strokeWidth={1.5} />
                <span>
                  {service.pricing
                    ? `$${service.pricing.minimum} minimum`
                    : `$${service.priceRange.min} - $${service.priceRange.max}+`}
                </span>
              </div>
            </div>

            {!service.pricing && (
              <p className="text-sm text-gray-500 mb-8 max-w-prose">
                {siteConfig.pricing.rangeNote}
              </p>
            )}

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

      {/* Main Content */}
      <section className="py-20 bg-cream">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-12">
              {/* Description */}
              <div>
                <div className="eyebrow mb-4">{step('Overview')}</div>
                <h2 className="headline text-2xl mb-6">
                  Expert {service.name.toLowerCase()} services
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed">
                  {service.fullDescription}
                </p>
              </div>

              {/* Pricing — only for services billed by measure */}
              {service.pricing && (
                <div>
                  <div className="eyebrow mb-4">{step('Pricing')}</div>
                  <h2 className="headline text-2xl mb-6">What it costs</h2>

                  <div className="border-t border-primary-500/20">
                    {service.pricing.lines.map((line) => (
                      <div
                        key={line.label}
                        className="flex items-baseline justify-between gap-6 py-5 border-b border-primary-500/20"
                      >
                        <span className="font-heading text-sm font-bold uppercase tracking-label text-ink">
                          {line.label}
                        </span>
                        <span className="font-heading text-2xl font-extrabold text-ink leading-none">
                          {line.value}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-baseline justify-between gap-6 py-5 border-b border-primary-500/20 bg-cream-dark/50 px-4 -mx-4">
                      <span className="font-heading text-sm font-bold uppercase tracking-label text-ink">
                        Minimum order
                      </span>
                      <span className="font-heading text-2xl font-extrabold text-ink leading-none">
                        ${service.pricing.minimum}
                      </span>
                    </div>
                  </div>

                  <ul className="mt-8 space-y-4">
                    {service.pricing.notes.map((note) => (
                      <li key={note} className="flex gap-3 text-gray-600 leading-relaxed">
                        <Info className="h-4 w-4 text-primary-500 shrink-0 mt-1" strokeWidth={1.5} />
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Common Problems */}
              <div>
                <div className="eyebrow mb-4">{step('Diagnosis')}</div>
                <h2 className="headline text-2xl mb-6">Common problems we fix</h2>
                <div className="space-y-4">
                  {service.commonProblems.map((problem, index) => (
                    <Card key={index}>
                      <CardContent className="p-6">
                        <h3 className="font-heading text-sm font-bold uppercase tracking-label text-ink mb-3">
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
              {service.brands.length > 0 && (
              <div>
                <div className="eyebrow mb-4">{step('Brands')}</div>
                <h2 className="headline text-2xl mb-6">Brands we service</h2>
                <div className="flex flex-wrap gap-3">
                  {service.brands.map((brand) => (
                    <Badge key={brand} size="md">
                      {brand}
                    </Badge>
                  ))}
                </div>
              </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Features Card */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-heading text-sm font-bold uppercase tracking-label text-ink mb-5">
                    Why Choose Us
                  </h3>
                  <ul className="space-y-3">
                    {service.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="h-4 w-4 text-primary-500 shrink-0 mt-1" strokeWidth={2} />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Quick Quote Card */}
              <Card className="bg-cream-dark">
                <CardContent className="p-6">
                  <h3 className="font-heading text-sm font-bold uppercase tracking-label text-ink mb-3">
                    {service.pricing ? 'Minimum Order' : 'Minimum Service Call'}
                  </h3>
                  <div className="font-heading text-4xl font-extrabold text-ink mb-3">
                    ${service.pricing ? service.pricing.minimum : siteConfig.serviceCall.minimum}
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    {service.pricing
                      ? `${service.pricing.lines[0].value} for the first 3 feet, then ${service.pricing.lines[1].value} per foot.`
                      : `Covers the visit, a full diagnosis and ${siteConfig.serviceCall.includes}.`}
                  </p>
                  {!service.pricing && (
                    <p className="text-gray-500 text-sm mb-4">
                      Most {service.name.replace(' Repair', '').toLowerCase()} jobs land between $
                      {service.priceRange.min} and ${service.priceRange.max}, parts included.
                    </p>
                  )}
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
                    <h3 className="font-heading text-sm font-bold uppercase tracking-label text-ink mb-5">
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
        title={
          service.name.endsWith(' Repair')
            ? `Ready to fix your ${service.name.replace(' Repair', '').toLowerCase()}?`
            : `Ready to book ${service.name.toLowerCase()}?`
        }
        subtitle="Our technicians are standing by. Same-day service available."
        note={
          service.pricing
            ? `$${service.pricing.minimum} minimum order — ${service.pricing.lines[0].value} for the first 3 feet, then ${service.pricing.lines[1].value} per foot`
            : undefined
        }
      />
    </>
  );
}
