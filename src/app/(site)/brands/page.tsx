import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CTABanner } from '@/components/sections';
import { brands, premiumBrands, mainstreamBrands, type ApplianceBrand } from '@/data/brands';
import { hasErrorCodes } from '@/data/error-codes';
import { services } from '@/data/services';
import { siteConfig } from '@/data/site-config';
import { breadcrumbSchema } from '@/lib/schema';

export const metadata: Metadata = {
  title: 'Appliance Brands We Repair | Orange County',
  description:
    'Sub-Zero, Wolf, Viking, Thermador, Miele, Bosch, Samsung, LG, Whirlpool, GE, Maytag, KitchenAid, Frigidaire, Electrolux and Kenmore repair across Orange County. Call (949) 749-0006.',
};

/** Everything the service pages claim, minus the ones with pages of their own. */
function remainingBrands() {
  const covered = new Set(brands.map((brand) => brand.name));
  const all = new Set<string>();
  for (const service of services) {
    for (const brand of service.brands ?? []) {
      if (!covered.has(brand)) all.add(brand);
    }
  }
  return [...all].sort();
}

function BrandCard({ brand }: { brand: ApplianceBrand }) {
  const codes = hasErrorCodes(brand.slug);

  return (
    <div className="group border-b border-r border-primary-500/20 transition-colors hover:bg-cream-dark/50">
      {/* The whole card is the link, so the padding lives here and not on the
          wrapper. It only shortens when a second link follows it. */}
      <Link href={`/brands/${brand.slug}`} className={`block p-8 ${codes ? 'pb-4' : ''}`}>
        <h3 className="font-heading text-lg font-bold uppercase tracking-label text-ink mb-3">
          {brand.name}
        </h3>
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

      {/* Its own link rather than part of the card: someone standing in front of
          a beeping machine wants the code, not the sales page, and making them
          land on the wrong one first costs them the visit. */}
      {codes && (
        <div className="px-8 pb-8 pt-2">
          <Link
            href={`/error-codes/${brand.slug}`}
            className="inline-flex items-center font-heading text-[11px] font-semibold uppercase tracking-label text-primary-500 hover:text-ink transition-colors"
          >
            {brand.name} error codes
            <ArrowRight className="h-3.5 w-3.5 ml-2" />
          </Link>
        </div>
      )}
    </div>
  );
}

export default function BrandsPage() {
  const remaining = remainingBrands();

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
              {brands.length} brands worth
              <br />
              <span className="headline-muted">a page of their own.</span>
            </h1>
            <div className="rule-short my-8" />
            <p className="text-lg md:text-xl text-gray-600 max-w-prose">
              Every brand fails in its own way, and guessing at it is what makes a repair
              expensive. These are the ones we open often enough to know before arriving — the
              built-in and professional machines along the coast, and the volume brands in most of
              the county&rsquo;s kitchens. Each page says what actually goes wrong on that badge.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-cream">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mb-10">
            <div className="eyebrow mb-4">01 — Built-in &amp; professional</div>
            <h2 className="headline text-2xl sm:text-3xl mb-4">
              Machines built to be serviced
            </h2>
            <p className="text-lg leading-relaxed text-gray-600">
              Built-in refrigeration and professional cooking fail in ways the rest of the market
              does not, and the parts cost what the machines cost. These are the ones we open most
              often along the coast.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 border-t border-l border-primary-500/20">
            {premiumBrands.map((brand) => (
              <BrandCard key={brand.slug} brand={brand} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-cream-light border-t border-primary-500/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mb-10">
            <div className="eyebrow mb-4">02 — The volume brands</div>
            <h2 className="headline text-2xl sm:text-3xl mb-4">
              What most Orange County kitchens actually contain
            </h2>
            <p className="text-lg leading-relaxed text-gray-600">
              Three of these — Samsung, Whirlpool and GE — account for roughly three in five
              branded service calls in this trade. The failures are extremely well mapped as a
              result, the parts are cheap and stocked, and a large share of these repairs finish on
              the first visit rather than in two.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 border-t border-l border-primary-500/20">
            {mainstreamBrands.map((brand) => (
              <BrandCard key={brand.slug} brand={brand} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-cream border-t border-primary-500/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h2 className="headline text-2xl mb-6">And everything else</h2>
            <p className="text-lg leading-relaxed text-gray-600 mb-6">
              The pages above exist because those brands fail distinctively. The rest of what we
              service is no less welcome — these turn up across the county&rsquo;s kitchens and
              garages, and common parts ride on the van.
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {remaining.map((brand) => (
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
