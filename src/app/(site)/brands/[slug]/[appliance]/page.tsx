import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Phone, ArrowRight, Info, ListChecks } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { CTABanner } from '@/components/sections';
import {
  brandAppliances,
  getBrandAppliance,
  appliancesForBrand,
} from '@/data/brand-appliance';
import { getBrandBySlug } from '@/data/brands';
import { getServiceBySlug } from '@/data/services';
import { hasErrorCodes } from '@/data/error-codes';
import { siteConfig } from '@/data/site-config';
import { breadcrumbSchema } from '@/lib/schema';

interface PageProps {
  params: Promise<{ slug: string; appliance: string }>;
}

export async function generateStaticParams() {
  return brandAppliances.map((entry) => ({
    slug: entry.brandSlug,
    appliance: entry.serviceSlug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, appliance } = await params;
  const entry = getBrandAppliance(slug, appliance);
  if (!entry) return { title: 'Not Found' };

  return {
    title: entry.seo.title,
    description: entry.seo.description,
    openGraph: { title: entry.seo.title, description: entry.seo.description },
  };
}

export default async function BrandAppliancePage({ params }: PageProps) {
  const { slug, appliance } = await params;
  const entry = getBrandAppliance(slug, appliance);
  if (!entry) notFound();

  const brand = getBrandBySlug(entry.brandSlug);
  const service = getServiceBySlug(entry.serviceSlug);
  if (!brand || !service) notFound();

  const siblings = appliancesForBrand(entry.brandSlug).filter(
    (other) => other.serviceSlug !== entry.serviceSlug
  );

  const path = `/brands/${entry.brandSlug}/${entry.serviceSlug}`;

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      '@id': `${siteConfig.seo.siteUrl}${path}#service`,
      name: `${brand.name} ${service.name}`,
      description: entry.seo.description,
      serviceType: `${brand.name} ${service.name}`,
      url: `${siteConfig.seo.siteUrl}${path}`,
      provider: { '@id': `${siteConfig.seo.siteUrl}/#organization` },
      brand: { '@type': 'Brand', name: brand.name },
      areaServed: {
        '@type': 'County',
        name: 'Orange County',
        containedIn: { '@type': 'State', name: 'California' },
      },
    },
    breadcrumbSchema([
      { name: 'Brands', path: '/brands' },
      { name: brand.name, path: `/brands/${brand.slug}` },
      { name: entry.name, path },
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
              <Link href="/brands" className="hover:text-ink transition-colors">Brands</Link>
              <span>/</span>
              <Link href={`/brands/${brand.slug}`} className="hover:text-ink transition-colors">
                {brand.name}
              </Link>
              <span>/</span>
              <span className="text-ink">{entry.name}</span>
            </nav>

            <div className="eyebrow mb-4">{brand.name}</div>
            <h1 className="headline text-3xl sm:text-4xl md:text-5xl">
              {brand.name} {service.name}
              <br />
              <span className="headline-muted">in Orange County.</span>
            </h1>
            <div className="rule-short my-8" />

            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-prose">{entry.summary}</p>

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
            <div className="eyebrow mb-4">01 — The machine</div>
            <h2 className="headline text-2xl sm:text-3xl mb-8">
              What a {brand.name} {service.name.replace(' Repair', '').toLowerCase()} is like to work on
            </h2>
            <p className="text-lg leading-relaxed text-gray-600 max-w-prose">{entry.positioning}</p>

            {entry.lines.length > 0 && (
              <div className="mt-12">
                <h3 className="font-heading text-[11px] font-semibold uppercase tracking-label text-ink mb-4">
                  Model lines we service
                </h3>
                <div className="flex flex-wrap gap-2">
                  {entry.lines.map((line) => (
                    <Badge key={line}>{line}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-12">
              <div className="eyebrow mb-4">02 — Diagnosis</div>
              <h3 className="headline text-2xl mb-8">What we open one for</h3>
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

            {hasErrorCodes(brand.slug) && (
              <div className="mt-12 border border-primary-500/25 bg-cream-light p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <ListChecks className="h-5 w-5 text-primary-500 shrink-0 mt-1" strokeWidth={1.5} />
                  <div>
                    <h3 className="font-heading text-[11px] font-semibold uppercase tracking-label text-ink mb-3">
                      Is there a code on the display?
                    </h3>
                    <p className="text-lg leading-relaxed text-gray-600 max-w-prose mb-5">
                      We have written out what each {brand.name} code reports, what causes it, and
                      whether it needs anybody at all — several of them are not faults.
                    </p>
                    <Link
                      href={`/error-codes/${brand.slug}`}
                      className="inline-flex items-center font-heading text-[11px] font-semibold uppercase tracking-label text-primary-600 hover:text-ink transition-colors"
                    >
                      {brand.name} error codes
                      <ArrowRight className="h-3.5 w-3.5 ml-2" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-12">
              <div className="eyebrow mb-4">03 — Parts</div>
              <h3 className="headline text-xl mb-4">Parts and what they cost</h3>
              <p className="text-lg leading-relaxed text-gray-600 max-w-prose">{entry.partsNote}</p>
              <p className="text-lg leading-relaxed text-gray-600 max-w-prose mt-4">
                Most {service.name.replace(' Repair', '').toLowerCase()} jobs land between{' '}
                <strong className="text-ink">
                  ${service.priceRange.min} and ${service.priceRange.max}
                </strong>
                , parts included, and the ${siteConfig.serviceCall.minimum} minimum service call is
                part of that rather than on top of it.
              </p>
            </div>

            {/* The warranty note lives on the brand page and is not repeated
                here — but a customer who landed straight on this page has not
                seen it, and on the brands with a ten-year sealed-system
                warranty that omission would cost them real money. */}
            <div className="mt-12 border border-primary-500/25 p-6 md:p-8 bg-cream-light">
              <div className="flex items-start gap-4">
                <Info className="h-5 w-5 text-primary-500 shrink-0 mt-1" strokeWidth={1.5} />
                <div>
                  <h3 className="font-heading text-[11px] font-semibold uppercase tracking-label text-ink mb-3">
                    When to call {brand.name} instead of us
                  </h3>
                  <p className="text-lg leading-relaxed text-gray-600 max-w-prose">
                    {brand.authorisedNote}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-cream-light border-t border-primary-500/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <div className="eyebrow mb-4">04 — Questions</div>
            <h2 className="headline text-2xl sm:text-3xl mb-10">Answered</h2>
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

      <section className="py-16 bg-cream border-t border-primary-500/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <div className="eyebrow mb-4">More {brand.name}</div>
            <h2 className="headline text-2xl mb-8">
              {siblings.length ? `Other ${brand.name} machines we open` : `About the brand`}
            </h2>
            <div className="flex flex-wrap gap-4">
              {siblings.map((other) => (
                <Link
                  key={other.serviceSlug}
                  href={`/brands/${other.brandSlug}/${other.serviceSlug}`}
                  className="flex items-center gap-2 px-4 py-2 border border-primary-500/25 hover:border-ink hover:bg-cream-dark/50 transition-colors"
                >
                  <span className="font-heading text-[11px] font-semibold uppercase tracking-label text-ink">
                    {other.name}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-primary-400" />
                </Link>
              ))}
              <Link
                href={`/brands/${brand.slug}`}
                className="flex items-center gap-2 px-4 py-2 border border-primary-500/25 hover:border-ink hover:bg-cream-dark/50 transition-colors"
              >
                <span className="font-heading text-[11px] font-semibold uppercase tracking-label text-ink">
                  All {brand.name}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-primary-400" />
              </Link>
              <Link
                href={`/services/${service.slug}`}
                className="flex items-center gap-2 px-4 py-2 border border-primary-500/25 hover:border-ink hover:bg-cream-dark/50 transition-colors"
              >
                <span className="font-heading text-[11px] font-semibold uppercase tracking-label text-ink">
                  All {service.name.replace(' Repair', '')} brands
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-primary-400" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <CTABanner
        title={`${brand.name} ${service.name.replace(' Repair', '')} giving trouble?`}
        subtitle="Tell us the model number when you book — it decides what comes on the van. Same-day appointments across Orange County."
      />
    </>
  );
}
