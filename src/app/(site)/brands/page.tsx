import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CTABanner } from '@/components/sections';
import { brands } from '@/data/brands';
import { services } from '@/data/services';
import { siteConfig } from '@/data/site-config';
import { breadcrumbSchema } from '@/lib/schema';

export const metadata: Metadata = {
  title: 'Built-In & Professional Appliance Brands',
  description:
    'Sub-Zero, Wolf, Viking, Thermador, Miele and Bosch repair across Orange County. Built-in refrigeration, professional ranges and premium dishwashers. Call (949) 749-0006.',
};

/** Everything the service pages claim, minus the six with pages of their own. */
function mainstreamBrands() {
  const premium = new Set(brands.map((brand) => brand.name));
  const all = new Set<string>();
  for (const service of services) {
    for (const brand of service.brands ?? []) {
      if (!premium.has(brand)) all.add(brand);
    }
  }
  return [...all].sort();
}

export default function BrandsPage() {
  const mainstream = mainstreamBrands();

  const schema = breadcrumbSchema([{ name: 'Brands', path: '/brands' }]);

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
              <span className="text-ink">Brands</span>
            </nav>

            <div className="eyebrow mb-4">Brands</div>
            <h1 className="headline text-3xl sm:text-4xl md:text-5xl">
              Six brands worth
              <br />
              <span className="headline-muted">a page of their own.</span>
            </h1>
            <div className="rule-short my-8" />
            <p className="text-lg md:text-xl text-gray-600 max-w-prose">
              Built-in refrigeration and professional cooking fail in ways the rest of the market
              does not, and guessing at them is expensive. These are the six we open most often
              along the coast, each with what actually goes wrong on it.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-cream">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 border-t border-l border-primary-500/20">
            {brands.map((brand) => (
              <Link
                key={brand.slug}
                href={`/brands/${brand.slug}`}
                className="group p-8 border-b border-r border-primary-500/20 transition-colors hover:bg-cream-dark/50"
              >
                <h2 className="font-heading text-lg font-bold uppercase tracking-label text-ink mb-3">
                  {brand.name}
                </h2>
                <p className="text-gray-600 leading-relaxed mb-6">{brand.summary}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mb-6">
                  {brand.categories.map((category) => (
                    <span key={category} className="text-sm text-primary-600">
                      {category}
                    </span>
                  ))}
                </div>
                <span className="inline-flex items-center font-heading text-[11px] font-semibold uppercase tracking-label text-primary-600 group-hover:text-ink transition-colors">
                  {brand.name} repair
                  <ArrowRight className="h-3.5 w-3.5 ml-2 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-16 max-w-3xl">
            <h2 className="headline text-2xl mb-6">And everything else</h2>
            <p className="text-lg leading-relaxed text-gray-600 mb-6">
              The six above get their own page because they fail distinctively. The rest of what we
              service is no less welcome — these are the machines in most Orange County kitchens and
              garages, and common parts ride on the van, so a large share of these repairs finish on
              the first visit.
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {mainstream.map((brand) => (
                <span key={brand} className="text-lg text-gray-600">
                  {brand}
                </span>
              ))}
            </div>
            <p className="text-gray-600 leading-relaxed mt-8">
              Not on the list? Still worth a call — this covers what we open most often, not the
              limit of what we work on. What we will not do is take a job we cannot finish: where a
              unit needs a factory-authorised repair to keep its warranty intact, we say so and point
              you at the manufacturer rather than charging you to find that out.
            </p>
            <div className="mt-8">
              <Link
                href="/services"
                className="inline-flex items-center font-heading text-[11px] font-semibold uppercase tracking-label text-primary-600 hover:text-ink transition-colors"
              >
                Browse by appliance instead
                <ArrowRight className="h-3.5 w-3.5 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <CTABanner
        title="Know the brand? Book the visit."
        subtitle={`Same-day appointments across Orange County. Call ${siteConfig.contact.phone}.`}
      />
    </>
  );
}
