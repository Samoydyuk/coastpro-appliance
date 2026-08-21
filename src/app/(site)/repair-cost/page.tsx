import { Metadata } from 'next';
import Link from 'next/link';
import { Phone, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui';
import { CTABanner, ServiceCallExplained } from '@/components/sections';
import { services, getServiceBySlug } from '@/data/services';
import { repairEconomics } from '@/data/repair-economics';
import { siteConfig } from '@/data/site-config';
import { breadcrumbSchema } from '@/lib/schema';

export const metadata: Metadata = {
  title: 'Appliance Repair Cost in Orange County | CoastPro',
  description:
    'What appliance repair actually costs in Orange County — published ranges for every machine we work on, which faults sit at each end, and how the service call fits in. Call (949) 749-0006.',
};

/**
 * The question asked before any other, answered with the site's own numbers.
 *
 * No figure here is new. The ranges are the ones already printed on the service
 * pages, and what this page adds is the part those pages do not carry: which
 * faults land at the bottom of a range and which land at the top, so somebody
 * with a symptom can place themselves in it before they call.
 *
 * It deliberately does not become nine cost pages. The service pages already
 * own "what goes wrong with this machine"; splitting the money across nine more
 * would have them competing with each other, which is the mistake /brands and
 * /error-codes made with Kenmore.
 */
export default function RepairCostPage() {
  const schema = [
    breadcrumbSchema([{ name: 'Repair cost', path: '/repair-cost' }]),
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': `${siteConfig.seo.siteUrl}/repair-cost#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How much does appliance repair cost in Orange County?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: `Most repairs land between $${siteConfig.serviceCall.minimum} and $450 including parts, depending on the machine and the fault. The $${siteConfig.serviceCall.minimum} minimum service call is part of that figure rather than added to it.`,
          },
        },
        {
          '@type': 'Question',
          name: 'Is the service call charged on top of the repair?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: `No. ${siteConfig.serviceCall.appliedToRepair}.`,
          },
        },
      ],
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
              <span className="text-ink">Repair cost</span>
            </nav>

            <div className="eyebrow mb-4">Cost</div>
            <h1 className="headline text-3xl sm:text-4xl md:text-5xl">
              What it costs,
              <br />
              <span className="headline-muted">and which end you are at.</span>
            </h1>
            <div className="rule-short my-8" />

            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-prose">
              Every range below is the one printed on that machine&rsquo;s own page — nothing here
              is a figure invented for a cost page. What is added is the part those pages do not
              carry: which faults sit at the bottom of a range and which sit at the top, so you can
              place yourself in it before anybody arrives.
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
                  Book a visit
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <ServiceCallExplained />

      <section className="py-20 bg-cream border-t border-primary-500/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <div className="eyebrow mb-4">By machine</div>
            <h2 className="headline text-2xl sm:text-3xl mb-10">
              What each one runs, and what puts it there
            </h2>

            <div className="space-y-12">
              {repairEconomics.map((entry) => {
                const service = getServiceBySlug(entry.serviceSlug);
                if (!service) return null;
                const machine = service.name.replace(' Repair', '');

                return (
                  <div
                    key={entry.serviceSlug}
                    id={entry.serviceSlug}
                    className="scroll-mt-28 border-b border-primary-500/20 pb-12 last:border-b-0"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-4 mb-6">
                      <h3 className="headline text-xl">{machine}</h3>
                      <div className="font-heading text-lg font-bold text-ink">
                        ${service.priceRange.min}&ndash;{service.priceRange.max}
                      </div>
                    </div>

                    <dl className="space-y-5">
                      <div>
                        <dt className="font-heading text-[11px] font-semibold uppercase tracking-label text-primary-500 mb-2">
                          At the bottom of that range
                        </dt>
                        <dd className="text-lg leading-relaxed text-gray-600 max-w-prose">
                          {entry.cheapEnd}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-heading text-[11px] font-semibold uppercase tracking-label text-primary-500 mb-2">
                          At the top of it, or past it
                        </dt>
                        <dd className="text-lg leading-relaxed text-gray-600 max-w-prose">
                          {entry.expensiveEnd}
                        </dd>
                      </div>
                      <div className="flex flex-wrap gap-x-10 gap-y-3 pt-2">
                        <div>
                          <dt className="font-heading text-[11px] font-semibold uppercase tracking-label text-primary-500 mb-1">
                            Typical service life
                          </dt>
                          <dd className="text-gray-600">{entry.lifeYears}</dd>
                        </div>
                        <div>
                          <dt className="font-heading text-[11px] font-semibold uppercase tracking-label text-primary-500 mb-1">
                            Replacing it instead
                          </dt>
                          <dd className="text-gray-600">{entry.replacementRange}</dd>
                        </div>
                      </div>
                    </dl>

                    <div className="mt-5">
                      <Link
                        href={`/services/${service.slug}`}
                        className="inline-flex items-center font-heading text-[11px] font-semibold uppercase tracking-label text-primary-600 hover:text-ink transition-colors"
                      >
                        What goes wrong with a {machine.toLowerCase()}
                        <ArrowRight className="h-3.5 w-3.5 ml-2" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-cream-light border-t border-primary-500/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <div className="eyebrow mb-4">Worth saying</div>
            <h2 className="headline text-2xl mb-6">Where these ranges stop applying</h2>
            <p className="text-lg leading-relaxed text-gray-600 mb-6">
              {siteConfig.pricing.rangeNote}
            </p>
            <p className="text-lg leading-relaxed text-gray-600 mb-6">
              Built-in and professional machines run past the top of these figures and we do not
              pretend otherwise — a sealed-system repair on a Sub-Zero or a control board on a
              professional range is its own conversation, and we have it before any work starts
              rather than after.
            </p>
            <p className="text-lg leading-relaxed text-gray-600">
              And the number that matters more than any of these: whether the machine is worth
              repairing at all.
            </p>
            <div className="mt-8">
              <Link href="/repair-or-replace">
                <Button variant="outline" className="border-ink text-ink hover:bg-ink hover:text-cream">
                  Repair or replace?
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <CTABanner
        title="Want a figure for your machine?"
        subtitle={`Tell us the brand, the model and what it is doing. Call ${siteConfig.contact.phone}.`}
      />
    </>
  );
}
