import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { services } from '@/data/services';
import { brands as brandPages } from '@/data/brands';

/**
 * The brands, gathered from the service data rather than typed out again.
 *
 * Two reasons this earns its place on the home page. Practically, "who fixes
 * Sub-Zero near me" is how a good share of this work is actually searched for,
 * and the site said nothing about brands above the service pages. Editorially,
 * it is the one list on the page a visitor scans for their own machine.
 *
 * Built from `services[].brands` so it cannot drift from what the service pages
 * claim — a brand named here and absent there is a promise the site does not
 * keep two clicks later.
 */

/** Slug for a brand that has a page of its own, or undefined. */
const pageFor = new Map(brandPages.map((brand) => [brand.name, brand.slug]));

function collectBrands() {
  const all = new Set<string>();
  for (const service of services) {
    for (const brand of service.brands ?? []) all.add(brand);
  }
  // Every brand with a page belongs in the premium column whether or not a
  // service happens to list it, so the two never disagree about which is which.
  const list = new Set([...all, ...pageFor.keys()]);
  return {
    premium: [...list].filter((b) => pageFor.has(b)).sort(),
    mainstream: [...list].filter((b) => !pageFor.has(b)).sort(),
  };
}

export function BrandsServiced() {
  const { premium: high, mainstream } = collectBrands();

  return (
    <section className="py-20 lg:py-24 bg-cream border-t border-primary-500/20">
      <div className="container mx-auto px-4">
        <div className="max-w-xl mb-14">
          <div className="eyebrow">05 — Brands</div>
          <h2 className="headline text-2xl sm:text-3xl md:text-4xl mt-4">
            The badge on the door
            <br />
            <span className="headline-muted">doesn&apos;t decide the answer.</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          <div>
            <h3 className="font-heading text-[11px] font-semibold uppercase tracking-label text-ink mb-5">
              Everyday brands
            </h3>
            <div className="flex flex-wrap gap-x-6 gap-y-3 mb-6">
              {mainstream.map((brand) => (
                <span key={brand} className="text-lg text-gray-600">
                  {brand}
                </span>
              ))}
            </div>
            <p className="text-gray-600 max-w-prose leading-relaxed">
              These are the machines in most Orange County kitchens and garages, and most of them
              fail in familiar ways: a drain pump that has swallowed something, a door latch that no
              longer reads as closed, an inlet valve narrowed by hard water. Common parts ride on the
              van, so a large share of these repairs finish on the first visit.
            </p>
          </div>

          <div>
            <h3 className="font-heading text-[11px] font-semibold uppercase tracking-label text-ink mb-5">
              Built-in and professional
            </h3>
            <div className="flex flex-wrap gap-x-6 gap-y-3 mb-6">
              {high.map((brand) => (
                <Link
                  key={brand}
                  href={`/brands/${pageFor.get(brand)}`}
                  className="text-lg text-primary-600 hover:text-ink underline underline-offset-4 decoration-primary-500/40 hover:decoration-ink transition-colors"
                >
                  {brand}
                </Link>
              ))}
            </div>
            <p className="text-gray-600 max-w-prose leading-relaxed">
              Built-in refrigeration and professional ranges are common along the coast, and they are
              the units least worth guessing at. A Sub-Zero that has stopped making ice can be a
              condenser packed with dust or a sealed-system fault, and those are not the same repair
              or remotely the same cost. We test before we quote, and you see what we found.
            </p>
          </div>
        </div>

        <p className="mt-14 pt-8 border-t border-primary-500/20 text-gray-600 max-w-3xl leading-relaxed">
          If your brand is not listed, it is still worth a call — the list covers what we open most
          often, not the limit of what we work on. What we will not do is take a job we cannot
          finish: where a unit needs a factory-authorised repair to keep its warranty intact, we say
          so and point you at the manufacturer rather than charging you to find that out.
        </p>

        <div className="mt-8">
          <Link
            href="/brands"
            className="inline-flex items-center font-heading text-[11px] font-semibold uppercase tracking-label text-primary-600 hover:text-ink transition-colors"
          >
            All brands we service
            <ArrowRight className="h-3.5 w-3.5 ml-2" />
          </Link>
        </div>
      </div>
    </section>
  );
}
