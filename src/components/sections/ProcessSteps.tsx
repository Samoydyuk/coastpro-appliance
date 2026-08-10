import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui';
import { siteConfig } from '@/data/site-config';

const steps = [
  {
    n: '01',
    title: 'Book',
    text: 'Call us or book online. Same-day appointments are available when you book before noon.',
  },
  {
    n: '02',
    title: 'Diagnose',
    text: `We confirm the appointment, call ahead before arrival, and diagnose the fault. The $${siteConfig.serviceCall.minimum} minimum service call covers ${siteConfig.serviceCall.includes}.`,
  },
  {
    n: '03',
    title: 'Repair',
    text: `You approve the estimate before any work starts. Every repair carries a ${siteConfig.trustSignals.warrantyDays}-day workmanship warranty.`,
  },
];

/**
 * Numbered three-step strip. Deliberately a different rhythm from the card
 * grids above and below it — large numerals, one connecting rule, no boxes.
 */
export function ProcessSteps() {
  return (
    <section className="py-20 lg:py-24 bg-cream-dark">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-16">
          <div className="max-w-xl">
            <div className="eyebrow">03 — How It Works</div>
            <h2 className="headline text-2xl sm:text-3xl md:text-4xl mt-4">
              Three steps,
              <br />
              <span className="headline-muted">no surprises.</span>
            </h2>
          </div>
          <Link href="/book-appointment" className="shrink-0">
            <Button variant="outline" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Book Now
            </Button>
          </Link>
        </div>

        {/* Single hairline threading the three steps together */}
        <div className="relative">
          <div aria-hidden="true" className="hidden lg:block absolute top-8 inset-x-0 h-px bg-primary-500/30" />

          <div className="grid lg:grid-cols-3 gap-12 lg:gap-10">
            {steps.map((step) => (
              <div key={step.n} className="relative">
                <div className="flex items-center gap-4 mb-6">
                  <span className="font-heading text-5xl font-extrabold text-primary-400 leading-none">
                    {step.n}
                  </span>
                  <span className="hidden lg:block flex-1 h-px bg-cream-dark" />
                </div>
                <h3 className="font-heading text-sm font-bold uppercase tracking-label text-ink mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed max-w-sm">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
