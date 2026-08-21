import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Phone, ArrowRight, MapPin } from 'lucide-react';
import { Button } from '@/components/ui';
import { CTABanner } from '@/components/sections';
import { serviceCities, getServiceCity, servicesForCity } from '@/data/service-city';
import { getServiceAreaBySlug } from '@/data/service-areas';
import { getServiceBySlug } from '@/data/services';
import { cityLocal } from '@/data/city-local';
import { siteConfig } from '@/data/site-config';
import { breadcrumbSchema } from '@/lib/schema';

interface PageProps {
  params: Promise<{ city: string; service: string }>;
}

export async function generateStaticParams() {
  return serviceCities.map((entry) => ({
    city: entry.citySlug,
    service: entry.serviceSlug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city, service } = await params;
  const entry = getServiceCity(city, service);
  if (!entry) return { title: 'Not Found' };

  return {
    title: entry.seo.title,
    description: entry.seo.description,
    openGraph: { title: entry.seo.title, description: entry.seo.description },
  };
}

export default async function ServiceCityPage({ params }: PageProps) {
  const { city, service } = await params;
  const entry = getServiceCity(city, service);
  if (!entry) notFound();

  const area = getServiceAreaBySlug(entry.citySlug);
  const svc = getServiceBySlug(entry.serviceSlug);
  if (!area || !svc) notFound();

  const local = cityLocal[entry.citySlug];
  const siblings = servicesForCity(entry.citySlug).filter(
    (other) => other.serviceSlug !== entry.serviceSlug
  );
  const path = `/service-areas/${entry.citySlug}/${entry.serviceSlug}`;
  const machine = svc.name.replace(' Repair', '');

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      '@id': `${siteConfig.seo.siteUrl}${path}#service`,
      name: `${machine} repair in ${area.name}`,
      description: entry.seo.description,
      serviceType: svc.name,
      url: `${siteConfig.seo.siteUrl}${path}`,
      provider: { '@id': `${siteConfig.seo.siteUrl}/#organization` },
      areaServed: {
        '@type': 'City',
        name: area.name,
        containedIn: { '@type': 'AdministrativeArea', name: 'Orange County, California' },
      },
    },
    breadcrumbSchema([
      { name: 'Service areas', path: '/service-areas' },
      { name: area.name, path: `/service-areas/${area.slug}` },
      { name: machine, path },
    ]),
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': `${siteConfig.seo.siteUrl}${path}#faq`,
      mainEntity: entry.faq.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <section className="bg-cream border-b border-primary-500/20 py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <nav className="flex flex-wrap items-center gap-2 text-sm text-primary-500 mb-8">
              <Link href="/" className="hover:text-ink transition-colors">Home</Link>
              <span>/</span>
              <Link href="/service-areas" className="hover:text-ink transition-colors">
                Service areas
              </Link>
              <span>/</span>
              <Link href={`/service-areas/${area.slug}`} className="hover:text-ink transition-colors">
                {area.name}
              </Link>
              <span>/</span>
              <span className="text-ink">{machine}</span>
            </nav>

            <div className="eyebrow mb-4">{area.name}</div>
            <h1 className="headline text-3xl sm:text-4xl md:text-5xl">
              {machine} repair
              <br />
              <span className="headline-muted">in {area.name}.</span>
            </h1>
            <div className="rule-short my-8" />

            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-prose">{entry.summary}</p>

            {local?.driveTime && (
              <div className="flex items-center gap-2 mb-8 text-primary-600">
                <MapPin className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                <span className="font-heading text-[11px] font-semibold uppercase tracking-label">
                  {local.driveTime}
                </span>
              </div>
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

      <section className="py-20 bg-cream">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <div className="eyebrow mb-4">01 — Locally</div>
            <h2 className="headline text-2xl sm:text-3xl mb-8">
              Why a {machine.toLowerCase()} fails differently in {area.name}
            </h2>
            <p className="text-lg leading-relaxed text-gray-600 max-w-prose">{entry.angle}</p>

            <div className="mt-12">
              <div className="eyebrow mb-4">02 — What we find</div>
              <h3 className="headline text-2xl mb-8">The calls we get here</h3>
              <div className="space-y-8">
                {entry.faults.map((fault) => (
                  <div
                    key={fault.symptom}
                    className="border-b border-primary-500/20 pb-8 last:border-b-0"
                  >
                    <h4 className="font-heading text-base font-semibold text-ink mb-3">
                      {fault.symptom}
                    </h4>
                    <p className="text-lg leading-relaxed text-gray-600 max-w-prose">{fault.cause}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-12">
              <div className="eyebrow mb-4">03 — Cost</div>
              <h3 className="headline text-xl mb-4">What it usually runs</h3>
              <p className="text-lg leading-relaxed text-gray-600 max-w-prose">
                Most {machine.toLowerCase()} jobs land between{' '}
                <strong className="text-ink">
                  ${svc.priceRange.min} and ${svc.priceRange.max}
                </strong>
                , parts included, and the ${siteConfig.serviceCall.minimum} minimum service call is
                part of that rather than on top of it. You see the fault and approve the figure
                before anything is replaced.
              </p>
            </div>

            {/* The general fault list lives on the service page and the housing
                story lives on the city page. Both are one click away rather than
                repeated here — repeating either is how twenty-four of these
                become one page with twenty-four names on it. */}
            <div className="mt-12 flex flex-wrap gap-4">
              <Link
                href={`/services/${svc.slug}`}
                className="flex items-center gap-2 px-4 py-2 border border-primary-500/25 hover:border-ink hover:bg-cream-dark/50 transition-colors"
              >
                <span className="font-heading text-[11px] font-semibold uppercase tracking-label text-ink">
                  Everything that goes wrong with a {machine.toLowerCase()}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-primary-400" />
              </Link>
              <Link
                href={`/service-areas/${area.slug}`}
                className="flex items-center gap-2 px-4 py-2 border border-primary-500/25 hover:border-ink hover:bg-cream-dark/50 transition-colors"
              >
                <span className="font-heading text-[11px] font-semibold uppercase tracking-label text-ink">
                  All repairs in {area.name}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-primary-400" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {entry.faq.length > 0 && (
        <section className="py-20 bg-cream-light border-t border-primary-500/20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl">
              <div className="eyebrow mb-4">04 — Questions</div>
              <h2 className="headline text-2xl sm:text-3xl mb-10">Asked in {area.name}</h2>
              <dl className="space-y-8">
                {entry.faq.map((item) => (
                  <div key={item.q} className="border-b border-primary-500/20 pb-8 last:border-b-0">
                    <dt className="font-heading text-lg font-semibold text-ink mb-3">{item.q}</dt>
                    <dd className="text-lg leading-relaxed text-gray-600 max-w-prose">{item.a}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>
      )}

      {siblings.length > 0 && (
        <section className="py-16 bg-cream border-t border-primary-500/20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl">
              <div className="eyebrow mb-4">More in {area.name}</div>
              <h2 className="headline text-2xl mb-8">Other machines we come out for here</h2>
              <div className="flex flex-wrap gap-4">
                {siblings.map((other) => {
                  const otherSvc = getServiceBySlug(other.serviceSlug);
                  if (!otherSvc) return null;
                  return (
                    <Link
                      key={other.serviceSlug}
                      href={`/service-areas/${other.citySlug}/${other.serviceSlug}`}
                      className="flex items-center gap-2 px-4 py-2 border border-primary-500/25 hover:border-ink hover:bg-cream-dark/50 transition-colors"
                    >
                      <span className="font-heading text-[11px] font-semibold uppercase tracking-label text-ink">
                        {otherSvc.name.replace(' Repair', '')}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-primary-400" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      <CTABanner
        title={`${machine} trouble in ${area.name}?`}
        subtitle={`Same-day appointments where the schedule allows. Call ${siteConfig.contact.phone}.`}
      />
    </>
  );
}
