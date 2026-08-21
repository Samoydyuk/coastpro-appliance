import { Metadata } from 'next';
import Link from 'next/link';
import { services } from '@/data/services';
import { serviceAreas } from '@/data/service-areas';
import { brands, premiumBrands, mainstreamBrands } from '@/data/brands';
import { brandErrorCodes } from '@/data/error-codes';
import { brandAppliances, appliancesForBrand } from '@/data/brand-appliance';
import { siteConfig } from '@/data/site-config';
import { breadcrumbSchema } from '@/lib/schema';

export const metadata: Metadata = {
  title: 'Everything on This Site | CoastPro',
  description:
    'Every page on coastpro.us in one list — services, brands, the machines under each brand, error codes and the Orange County cities we cover.',
};

/**
 * The whole site on one page.
 *
 * There is an XML sitemap already, and this is not a substitute for it. It does
 * a different job: XML tells a crawler what exists, and this gives every one of
 * those addresses a second internal link on a page one click from the footer.
 * Pages sitting in "discovered — currently not indexed" are pages Google knows
 * about and has not thought worth fetching, and depth of internal linking is
 * one of the few levers that moves that.
 *
 * It is also genuinely useful to a person who wants to know whether we cover
 * their machine without working through a menu, which is the only reason it is
 * worth building rather than hiding.
 *
 * Everything is derived. A page added to any data file appears here without
 * anybody remembering to come back — a hand-maintained list of links is a list
 * that goes stale the first busy week.
 */

const linkClass =
  'text-gray-600 hover:text-ink transition-colors underline decoration-primary-500/30 underline-offset-2';

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-heading text-[11px] font-semibold uppercase tracking-label text-ink mb-4">
        {title}
      </h2>
      <ul className="space-y-2">{children}</ul>
    </div>
  );
}

export default function SiteMapPage() {
  const schema = breadcrumbSchema([{ name: 'Everything on this site', path: '/sitemap' }]);

  const withCodes = brandErrorCodes.map((entry) => entry.brandSlug);

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
              <span className="text-ink">Everything on this site</span>
            </nav>

            <div className="eyebrow mb-4">Index</div>
            <h1 className="headline text-3xl sm:text-4xl md:text-5xl">
              Everything on this site,
              <br />
              <span className="headline-muted">on one page.</span>
            </h1>
            <div className="rule-short my-8" />
            <p className="text-lg md:text-xl text-gray-600 max-w-prose">
              Every service, every brand, the machines we open under each of them, the error codes
              we have written out, and the {serviceAreas.length} Orange County cities we cover.
              Faster than a menu if you already know what you are looking for.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-cream">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-3">
            <Column title={`Services (${services.length})`}>
              {services.map((service) => (
                <li key={service.slug}>
                  <Link href={`/services/${service.slug}`} className={linkClass}>
                    {service.name}
                  </Link>
                </li>
              ))}
              <li className="pt-2">
                <Link href="/services" className={linkClass}>
                  All services
                </Link>
              </li>
            </Column>

            <Column title={`Service areas (${serviceAreas.length})`}>
              {serviceAreas.map((area) => (
                <li key={area.slug}>
                  <Link href={`/service-areas/${area.slug}`} className={linkClass}>
                    {area.name}
                  </Link>
                </li>
              ))}
              <li className="pt-2">
                <Link href="/service-areas" className={linkClass}>
                  All service areas
                </Link>
              </li>
            </Column>

            <Column title="The rest">
              <li><Link href="/" className={linkClass}>Home</Link></li>
              <li><Link href="/book-appointment" className={linkClass}>Book an appointment</Link></li>
              <li><Link href="/same-day" className={linkClass}>Same-day service</Link></li>
              <li><Link href="/error-codes" className={linkClass}>Error codes explained</Link></li>
              <li><Link href="/brands" className={linkClass}>Brands we repair</Link></li>
              <li><Link href="/blog" className={linkClass}>Repair notes</Link></li>
              <li><Link href="/gallery" className={linkClass}>Gallery</Link></li>
              <li><Link href="/faq" className={linkClass}>FAQ</Link></li>
              <li><Link href="/about" className={linkClass}>About</Link></li>
              <li><Link href="/contact" className={linkClass}>Contact</Link></li>
            </Column>
          </div>
        </div>
      </section>

      <section className="py-20 bg-cream-light border-t border-primary-500/20">
        <div className="container mx-auto px-4">
          <div className="eyebrow mb-4">Brands</div>
          <h2 className="headline text-2xl sm:text-3xl mb-10">
            {brands.length} brands, and the machines we open under each
          </h2>

          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
            {[...premiumBrands, ...mainstreamBrands].map((brand) => {
              const machines = appliancesForBrand(brand.slug);
              return (
                <div key={brand.slug}>
                  <h3 className="font-heading text-[11px] font-semibold uppercase tracking-label text-ink mb-3">
                    <Link href={`/brands/${brand.slug}`} className="hover:text-primary-600">
                      {brand.name}
                    </Link>
                  </h3>
                  <ul className="space-y-2">
                    {machines.map((machine) => (
                      <li key={machine.serviceSlug}>
                        <Link
                          href={`/brands/${brand.slug}/${machine.serviceSlug}`}
                          className={linkClass}
                        >
                          {machine.name}
                        </Link>
                      </li>
                    ))}
                    {withCodes.includes(brand.slug) && (
                      <li>
                        <Link href={`/error-codes/${brand.slug}`} className={linkClass}>
                          Error codes
                        </Link>
                      </li>
                    )}
                    {!machines.length && !withCodes.includes(brand.slug) && (
                      <li className="text-gray-500 text-sm">Brand page only</li>
                    )}
                  </ul>
                </div>
              );
            })}
          </div>

          <p className="mt-12 text-sm text-gray-500">
            {brandAppliances.length} brand-and-machine pages · {brandErrorCodes.length} error code
            pages · machine-specific pages exist where that maker actually builds the machine.
          </p>
        </div>
      </section>
    </>
  );
}
