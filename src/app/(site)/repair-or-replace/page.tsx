import { Metadata } from 'next';
import Link from 'next/link';
import { Phone, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui';
import { CTABanner } from '@/components/sections';
import { getServiceBySlug } from '@/data/services';
import { repairEconomics, FIFTY_PERCENT_RULE } from '@/data/repair-economics';
import { siteConfig } from '@/data/site-config';
import { breadcrumbSchema } from '@/lib/schema';

export const metadata: Metadata = {
  title: 'Repair or Replace? | Appliance Advice, Orange County',
  description:
    'When an appliance is worth repairing and when it is not — by machine, by fault and by age. Honest answers from a repair company, including the times we say buy a new one.',
};

/**
 * The page that talks people out of a repair, sometimes.
 *
 * A repair company writing this has an obvious conflict, and the only way it is
 * worth reading is if it says plainly where replacement wins. It does: a
 * magnetron on a countertop microwave, a sealed system on a cheap freestanding
 * refrigerator, a garbage disposal motor. Naming those is what makes the rest
 * of it credible.
 *
 * It is also the top of the funnel. Somebody weighing this up has not decided
 * to call anybody yet, and the competitor pages that answer it answer it with
 * "call us for a free estimate".
 */
export default function RepairOrReplacePage() {
  const schema = [
    breadcrumbSchema([{ name: 'Repair or replace', path: '/repair-or-replace' }]),
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': `${siteConfig.seo.siteUrl}/repair-or-replace#faq`,
      mainEntity: repairEconomics.slice(0, 6).map((entry) => {
        const service = getServiceBySlug(entry.serviceSlug);
        const machine = service?.name.replace(' Repair', '').toLowerCase() ?? entry.serviceSlug;
        return {
          '@type': 'Question',
          name: `Should I repair or replace my ${machine}?`,
          acceptedAnswer: { '@type': 'Answer', text: entry.replaceWhen },
        };
      }),
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
              <span className="text-ink">Repair or replace</span>
            </nav>

            <div className="eyebrow mb-4">Deciding</div>
            <h1 className="headline text-3xl sm:text-4xl md:text-5xl">
              Repair or replace,
              <br />
              <span className="headline-muted">including when we say replace.</span>
            </h1>
            <div className="rule-short my-8" />

            <p className="text-lg md:text-xl text-gray-600 max-w-prose">
              A repair company answering this has an obvious conflict, so here is the version worth
              reading: the machines and the faults where buying a new one is the better spend, said
              plainly, alongside the ones where replacing something with years left in it would be
              a waste.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-cream">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <div className="eyebrow mb-4">01 — The rule everyone brings</div>
            <h2 className="headline text-2xl sm:text-3xl mb-6">Half the price of a new one</h2>
            <p className="text-lg leading-relaxed text-gray-600">{FIFTY_PERCENT_RULE}</p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-cream-light border-t border-primary-500/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <div className="eyebrow mb-4">02 — By machine</div>
            <h2 className="headline text-2xl sm:text-3xl mb-10">Where the line actually sits</h2>

            <div className="space-y-10">
              {repairEconomics.map((entry) => {
                const service = getServiceBySlug(entry.serviceSlug);
                if (!service) return null;
                const machine = service.name.replace(' Repair', '');

                return (
                  <div
                    key={entry.serviceSlug}
                    id={entry.serviceSlug}
                    className="scroll-mt-28 border-b border-primary-500/20 pb-10 last:border-b-0"
                  >
                    <h3 className="headline text-xl mb-4">{machine}</h3>

                    <div className="flex flex-wrap gap-x-10 gap-y-3 mb-5">
                      <div>
                        <div className="font-heading text-[11px] font-semibold uppercase tracking-label text-primary-500 mb-1">
                          Repair
                        </div>
                        <div className="text-gray-600">
                          ${service.priceRange.min}&ndash;{service.priceRange.max}
                        </div>
                      </div>
                      <div>
                        <div className="font-heading text-[11px] font-semibold uppercase tracking-label text-primary-500 mb-1">
                          Replace
                        </div>
                        <div className="text-gray-600">{entry.replacementRange}</div>
                      </div>
                      <div>
                        <div className="font-heading text-[11px] font-semibold uppercase tracking-label text-primary-500 mb-1">
                          Service life
                        </div>
                        <div className="text-gray-600">{entry.lifeYears}</div>
                      </div>
                    </div>

                    <div className="border-l-2 border-primary-500/40 pl-5">
                      <div className="font-heading text-[11px] font-semibold uppercase tracking-label text-ink mb-2">
                        When we would say replace
                      </div>
                      <p className="text-lg leading-relaxed text-gray-600 max-w-prose">
                        {entry.replaceWhen}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-cream border-t border-primary-500/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <div className="eyebrow mb-4">03 — Two things that change the sum</div>
            <h2 className="headline text-2xl mb-8">Brand, and where it is fitted</h2>

            <h3 className="font-heading text-base font-semibold text-ink mb-3">
              Some machines are built to be repaired
            </h3>
            <p className="text-lg leading-relaxed text-gray-600 mb-8">
              Miele designs to a twenty-year service life and Sub-Zero built-ins were made to be
              opened. On those, a repair at fifteen years is often money well spent where the same
              age on a bargain machine would not be. The percentage rule gives the wrong answer on
              both.
            </p>

            <h3 className="font-heading text-base font-semibold text-ink mb-3">
              A built-in is not a like-for-like swap
            </h3>
            <p className="text-lg leading-relaxed text-gray-600 mb-8">
              Replacing a freestanding machine means delivery. Replacing a built-in column, a
              panel-ready dishwasher or an over-range microwave means matching a size, a trim kit or
              a custom panel — and sometimes cabinetry work. That is why an expensive repair on a
              built-in frequently still wins.
            </p>

            <h3 className="font-heading text-base font-semibold text-ink mb-3">
              And the one nobody mentions
            </h3>
            <p className="text-lg leading-relaxed text-gray-600">
              Several manufacturers run long sealed-system warranties — ten years on Samsung and LG
              compressors, through their own networks. If that is your fault, the answer is neither
              repair nor replace: it is call the manufacturer. We say so on the phone rather than
              take the job, because a compressor we fit is a warranty you no longer have.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-cream-light border-t border-primary-500/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <p className="text-lg leading-relaxed text-gray-600 mb-6">
              None of this replaces looking at the machine. What it should do is tell you which
              conversation you are about to have — and if it is one where replacing is obviously
              better, you have saved yourself a call.
            </p>
            <Link
              href="/repair-cost"
              className="inline-flex items-center font-heading text-[11px] font-semibold uppercase tracking-label text-primary-600 hover:text-ink transition-colors"
            >
              What each repair actually costs
              <ArrowRight className="h-3.5 w-3.5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      <CTABanner
        title="Not sure which side of the line you are on?"
        subtitle={`Tell us the machine, its age and what it is doing. We will say honestly. Call ${siteConfig.contact.phone}.`}
      />
    </>
  );
}
