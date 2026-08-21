import { Metadata } from 'next';
import Link from 'next/link';
import { Phone, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui';
import { CTABanner, ProcessSteps } from '@/components/sections';
import { services } from '@/data/services';
import { serviceAreas } from '@/data/service-areas';
import { siteConfig } from '@/data/site-config';
import { breadcrumbSchema } from '@/lib/schema';

export const metadata: Metadata = {
  title: 'Same-Day Appliance Repair Orange County | CoastPro',
  description:
    'Same-day appliance repair across Orange County when you book early enough. What same-day actually means, when it is realistic, and what happens when it is not. Call (949) 749-0006.',
};

/**
 * The promise the site makes on every page, with the small print attached.
 *
 * "Same-day service available" runs in the bar above the header everywhere, and
 * until now there was no page behind it — while `same day stove repair oc` was
 * already turning up in Search Console. So this exists for the search, but the
 * reason it is worth writing rather than generating is the second half: every
 * competitor claims same-day and none of them says when it is not possible.
 * Saying so is the only thing that makes the claim worth anything.
 */
export default function SameDayPage() {
  const schema = [
    breadcrumbSchema([{ name: 'Same-day service', path: '/same-day' }]),
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      '@id': `${siteConfig.seo.siteUrl}/same-day#service`,
      name: 'Same-day appliance repair',
      description:
        'Same-day appliance repair across Orange County, subject to the day’s schedule and the part the machine needs.',
      serviceType: 'Same-day appliance repair',
      url: `${siteConfig.seo.siteUrl}/same-day`,
      provider: { '@id': `${siteConfig.seo.siteUrl}/#organization` },
      areaServed: {
        '@type': 'County',
        name: 'Orange County',
        containedIn: { '@type': 'State', name: 'California' },
      },
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
              <span className="text-ink">Same-day service</span>
            </nav>

            <div className="eyebrow mb-4">Same-day</div>
            <h1 className="headline text-3xl sm:text-4xl md:text-5xl">
              Same-day repair,
              <br />
              <span className="headline-muted">and when it honestly is not.</span>
            </h1>
            <div className="rule-short my-8" />

            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-prose">
              Call early enough and there is usually a slot the same day, anywhere in Orange County.
              What follows is what that actually depends on — because every repair company in this
              county advertises same-day and almost none of them says when it will not happen.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <a href={`tel:${siteConfig.contact.phoneClean}`}>
                <Button size="lg" leftIcon={<Phone className="h-4 w-4" />}>
                  {siteConfig.contact.phone}
                </Button>
              </a>
              <Link href="/book-appointment">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-ink text-ink hover:bg-ink hover:text-cream"
                >
                  Book online
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-cream">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <div className="eyebrow mb-4">01 — What decides it</div>
            <h2 className="headline text-2xl sm:text-3xl mb-8">Three things, in this order</h2>

            <div className="space-y-10">
              <div className="border-b border-primary-500/20 pb-10">
                <div className="flex items-start gap-4">
                  <Clock className="h-5 w-5 text-primary-500 shrink-0 mt-1.5" strokeWidth={1.5} />
                  <div>
                    <h3 className="font-heading text-base font-semibold text-ink mb-3">
                      When you call
                    </h3>
                    <p className="text-lg leading-relaxed text-gray-600 max-w-prose">
                      Before noon and a same-day slot is usually available. After about three in the
                      afternoon it becomes next morning more often than not — not because the day is
                      over, but because a diagnosis at five with a part needed is a visit that
                      finishes nothing.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-b border-primary-500/20 pb-10">
                <div className="flex items-start gap-4">
                  <MapPin className="h-5 w-5 text-primary-500 shrink-0 mt-1.5" strokeWidth={1.5} />
                  <div>
                    <h3 className="font-heading text-base font-semibold text-ink mb-3">
                      Where you are, and where the van already is
                    </h3>
                    <p className="text-lg leading-relaxed text-gray-600 max-w-prose">
                      The county is forty minutes end to end in the middle of the day and rather
                      more at four in the afternoon. A call from Irvine at eleven when the morning
                      was booked in Costa Mesa is straightforward; the same call from San Clemente
                      may be first thing tomorrow instead. We say which when you ring rather than
                      after.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-start gap-4">
                  <Clock className="h-5 w-5 text-primary-500 shrink-0 mt-1.5" strokeWidth={1.5} />
                  <div>
                    <h3 className="font-heading text-base font-semibold text-ink mb-3">
                      What the machine turns out to need
                    </h3>
                    <p className="text-lg leading-relaxed text-gray-600 max-w-prose">
                      This is the one nobody advertises. Common parts ride on the van — drain pumps,
                      igniters, thermal fuses, door latches, inlet valves — and those repairs finish
                      on the visit. A control board for a fifteen-year-old wall oven does not, and
                      no amount of arriving quickly changes that. Same-day means same-day
                      diagnosis and, most of the time, same-day repair. It does not mean every part
                      is on the van, and a company telling you otherwise has not seen the inside of
                      your oven yet.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ProcessSteps />

      <section className="py-20 bg-cream border-t border-primary-500/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <div className="eyebrow mb-4">02 — What we come out for</div>
            <h2 className="headline text-2xl sm:text-3xl mb-8">
              Everything on this list, same day where the schedule allows
            </h2>
            <div className="flex flex-wrap gap-3">
              {services.map((service) => (
                <Link
                  key={service.slug}
                  href={`/services/${service.slug}`}
                  className="px-4 py-2 border border-primary-500/25 hover:border-ink hover:bg-cream-dark/50 transition-colors font-heading text-[11px] font-semibold uppercase tracking-label text-ink"
                >
                  {service.name.replace(' Repair', '')}
                </Link>
              ))}
            </div>

            <h3 className="font-heading text-[11px] font-semibold uppercase tracking-label text-ink mt-12 mb-4">
              Across {serviceAreas.length} cities
            </h3>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {serviceAreas.map((area) => (
                <Link
                  key={area.slug}
                  href={`/service-areas/${area.slug}`}
                  className="text-gray-600 hover:text-ink transition-colors"
                >
                  {area.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <CTABanner
        title="Need it looked at today?"
        subtitle={`Ring before noon and there is usually a slot. Call ${siteConfig.contact.phone}.`}
      />
    </>
  );
}
