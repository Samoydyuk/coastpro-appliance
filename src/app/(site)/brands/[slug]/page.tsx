import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Phone, ArrowRight, Info, MapPin, ListChecks } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { CTABanner, StatsBand } from '@/components/sections';
import { brands, getBrandBySlug } from '@/data/brands';
import { getErrorCodesForBrand } from '@/data/error-codes';
import { appliancesForBrand } from '@/data/brand-appliance';
import { siteConfig } from '@/data/site-config';
import { breadcrumbSchema } from '@/lib/schema';

interface BrandPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return brands.map((brand) => ({ slug: brand.slug }));
}

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const { slug } = await params;
  const brand = getBrandBySlug(slug);

  if (!brand) return { title: 'Brand Not Found' };

  return {
    title: brand.seo.title,
    description: brand.seo.description,
    openGraph: {
      title: brand.seo.title,
      description: brand.seo.description,
    },
  };
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { slug } = await params;
  const brand = getBrandBySlug(slug);

  if (!brand) notFound();

  const codes = getErrorCodesForBrand(brand.slug);
  const machines = appliancesForBrand(brand.slug);
  // Same shelf only. With fifteen brands, "we also specialise in" listing all
  // fourteen others says nothing — a Sub-Zero owner is not choosing between it
  // and a Frigidaire.
  const others = brands.filter((b) => b.slug !== brand.slug && b.tier === brand.tier);

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      '@id': `${siteConfig.seo.siteUrl}/brands/${brand.slug}#service`,
      name: `${brand.name} Appliance Repair`,
      description: brand.seo.description,
      serviceType: `${brand.name} appliance repair`,
      url: `${siteConfig.seo.siteUrl}/brands/${brand.slug}`,
      provider: { '@id': `${siteConfig.seo.siteUrl}/#organization` },
      brand: { '@type': 'Brand', name: brand.name },
      areaServed: {
        '@type': 'AdministrativeArea',
        name: 'Orange County',
        containedInPlace: { '@type': 'State', name: 'California' },
      },
    },
    breadcrumbSchema([
      { name: 'Brands', path: '/brands' },
      { name: brand.name, path: `/brands/${brand.slug}` },
    ]),
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': `${siteConfig.seo.siteUrl}/brands/${brand.slug}#faq`,
      mainEntity: brand.faq.map((item) => ({
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
            <nav className="flex items-center gap-2 text-sm text-primary-500 mb-8">
              <Link href="/" className="hover:text-ink transition-colors">Home</Link>
              <span>/</span>
              <Link href="/brands" className="hover:text-ink transition-colors">Brands</Link>
              <span>/</span>
              <span className="text-ink">{brand.name}</span>
            </nav>

            <div className="eyebrow mb-4">Brand</div>
            <h1 className="headline text-3xl sm:text-4xl md:text-5xl">
              {brand.name} Repair
              <br />
              <span className="headline-muted">in Orange County.</span>
            </h1>
            <div className="rule-short my-8" />

            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-prose">{brand.summary}</p>

            <div className="flex flex-wrap gap-3 mb-8">
              {brand.categories.map((category) => (
                <Badge key={category}>{category}</Badge>
              ))}
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

      <section className="py-20 bg-cream">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <div className="eyebrow mb-4">01 — The brand</div>
            <h2 className="headline text-2xl sm:text-3xl mb-8">
              What working on a {brand.name} is actually like
            </h2>
            <p className="text-lg leading-relaxed text-gray-600 max-w-prose">{brand.positioning}</p>

            {brand.lines.length > 0 && (
              <div className="mt-12">
                <h3 className="font-heading text-[11px] font-semibold uppercase tracking-label text-ink mb-4">
                  Model lines we service
                </h3>
                <div className="flex flex-wrap gap-2">
                  {brand.lines.map((line) => (
                    <Badge key={line}>{line}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-12">
              <div className="eyebrow mb-4">02 — Diagnosis</div>
              <h3 className="headline text-2xl mb-8">
                What we open a {brand.name} for
              </h3>
              <div className="space-y-8">
                {brand.faults.map((fault) => (
                  <div key={fault.symptom} className="border-b border-primary-500/20 pb-8 last:border-b-0">
                    <h4 className="font-heading text-base font-semibold text-ink mb-3">
                      {fault.symptom}
                    </h4>
                    <p className="text-lg leading-relaxed text-gray-600 max-w-prose">{fault.cause}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* The machines under this badge that have a page of their own.
                Placed above the code prompt because it is the more specific
                answer: somebody who knows it is the refrigerator wants the
                refrigerator page, not the whole brand. */}
            {machines.length > 0 && (
              <div className="mt-12">
                <div className="eyebrow mb-4">Straight to the machine</div>
                <h3 className="headline text-xl mb-6">
                  What we open on a {brand.name}, in detail
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 border-t border-l border-primary-500/20">
                  {machines.map((machine) => (
                    <Link
                      key={machine.serviceSlug}
                      href={`/brands/${brand.slug}/${machine.serviceSlug}`}
                      className="group p-5 border-b border-r border-primary-500/20 transition-colors hover:bg-cream-dark/50"
                    >
                      <div className="font-heading text-[11px] font-semibold uppercase tracking-label text-ink mb-2">
                        {machine.name}
                      </div>
                      <p className="text-gray-600 leading-relaxed mb-3">{machine.summary}</p>
                      <span className="inline-flex items-center font-heading text-[11px] font-semibold uppercase tracking-label text-primary-600 group-hover:text-ink transition-colors">
                        Read more
                        <ArrowRight className="h-3.5 w-3.5 ml-2 transition-transform group-hover:translate-x-1" />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Placed here rather than at the foot of the page: someone who has
                just read the fault list has a code in front of them, and this
                is the moment it is worth something. */}
            {codes && (
              <div className="mt-12 border border-primary-500/25 bg-cream-light p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <ListChecks className="h-5 w-5 text-primary-500 shrink-0 mt-1" strokeWidth={1.5} />
                  <div>
                    <h3 className="font-heading text-[11px] font-semibold uppercase tracking-label text-ink mb-3">
                      Is there a code on the display?
                    </h3>
                    <p className="text-lg leading-relaxed text-gray-600 max-w-prose mb-5">
                      We have written out {codes.codes.length} {brand.name} codes — what each one
                      reports, what causes it, and whether it needs anybody. Some of them are not
                      faults at all, and knowing which saves you a call-out.
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
              <div className="eyebrow mb-4">03 — Locally</div>
              <h3 className="headline text-xl mb-4 flex items-center gap-3">
                <MapPin className="h-4 w-4 text-primary-500 shrink-0" strokeWidth={1.5} />
                Where {brand.name} turns up in Orange County
              </h3>
              <p className="text-lg leading-relaxed text-gray-600 max-w-prose">{brand.whereFound}</p>
            </div>

            <div className="mt-12">
              <div className="eyebrow mb-4">04 — Parts</div>
              <h3 className="headline text-xl mb-4">Parts and availability</h3>
              <p className="text-lg leading-relaxed text-gray-600 max-w-prose">{brand.partsNote}</p>
            </div>

            {/* Said in the open, not buried. A shop that quietly takes a warranty
                job the manufacturer would have covered is charging for something
                the customer already owns. */}
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
            <div className="eyebrow mb-4">05 — Questions</div>
            <h2 className="headline text-2xl sm:text-3xl mb-10">
              {brand.name} repair, answered
            </h2>
            <dl className="space-y-8">
              {brand.faq.map((item) => (
                <div key={item.q} className="border-b border-primary-500/20 pb-8 last:border-b-0">
                  <dt className="font-heading text-lg font-semibold text-ink mb-3">{item.q}</dt>
                  <dd className="text-lg leading-relaxed text-gray-600 max-w-prose">{item.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="py-20 bg-cream border-t border-primary-500/20">
        <div className="container mx-auto px-4">
          <div className="eyebrow mb-4">06 — Other brands</div>
          <h2 className="headline text-2xl mb-8">We also specialise in</h2>
          <div className="flex flex-wrap gap-4">
            {others.map((other) => (
              <Link
                key={other.slug}
                href={`/brands/${other.slug}`}
                className="flex items-center gap-2 px-4 py-2 border border-primary-500/25 hover:border-ink hover:bg-cream-dark/50 transition-colors"
              >
                <span className="font-heading text-[11px] font-semibold uppercase tracking-label text-ink">
                  {other.name}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-primary-400" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CTABanner
        title={`Need a ${brand.name} looked at?`}
        subtitle="Same-day appointments across Orange County. You approve the estimate before any work starts."
      />
    </>
  );
}
