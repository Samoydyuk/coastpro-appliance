import { Metadata } from 'next';
import Link from 'next/link';
import { Phone, Check, Clock, Shield, MapPin, Wrench, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui';
import { siteConfig } from '@/data/site-config';

export const metadata: Metadata = {
  title: 'Appliance Repair in Orange County | Same-Day Service',
  description: 'Need appliance repair in Orange County? CoastPro offers same-day service, 90-day warranty, and expert technicians. Call now or book online!',
  robots: {
    index: false,
    follow: false,
  },
};

const benefits = [
  { icon: Clock, text: 'Same-Day Service Available' },
  { icon: Shield, text: '90-Day Warranty on All Repairs' },
  { icon: MapPin, text: 'Locally Owned in Orange County' },
  { icon: Wrench, text: 'All Major Brands & Appliances' },
];

const appliances = [
  'Refrigerator', 'Washer', 'Dryer', 'Dishwasher',
  'Oven & Range', 'Microwave', 'Ice Maker', 'Garbage Disposal',
];

const reasons = [
  {
    icon: Clock,
    title: 'Same-Day Service',
    text: 'Book before noon and get your appliance fixed today. No waiting around for days.',
  },
  {
    icon: Shield,
    title: '90-Day Warranty',
    text: 'Every repair backed by our 90-day warranty. If it breaks again, we fix it free.',
  },
  {
    icon: Wrench,
    title: 'Expert Technicians',
    text: 'Our skilled technicians handle all brands and appliance types with precision.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero — above the fold */}
      <section className="relative bg-cream overflow-hidden py-16 md:py-24">
        <div
          aria-hidden="true"
          className="hidden lg:block absolute inset-y-0 right-0 w-[34%] bg-primary-800 diagonal-cut"
        />

        <div className="relative container mx-auto px-4">
          <div className="max-w-3xl">
            <div className="wordmark text-sm text-ink">CoastPro</div>
            <div className="eyebrow mt-2">Appliance Repair</div>
            <div className="rule-short mt-6 mb-10" />

            <h1 className="headline text-[1.75rem] sm:text-4xl md:text-5xl lg:text-6xl mb-8">
              Expert appliance repair
              <br />
              <span className="headline-muted">in Orange County.</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-prose">
              Fast, affordable and reliable repairs for all major appliances. Local Orange County
              technicians.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-14">
              <a href={`tel:${siteConfig.contact.phoneClean}`}>
                <Button size="lg" className="w-full sm:w-auto" leftIcon={<Phone className="h-4 w-4" />}>
                  Call {siteConfig.contact.phone}
                </Button>
              </a>
              <Link href="/book-appointment">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Book Online
                </Button>
              </Link>
            </div>

            {/* Benefits row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 border-t border-l border-primary-500/25">
              {benefits.map((benefit) => (
                <div
                  key={benefit.text}
                  className="flex items-center gap-3 p-5 border-b border-r border-primary-500/25"
                >
                  <span className="icon-disc h-9 w-9 shrink-0">
                    <benefit.icon className="h-4 w-4" strokeWidth={1.5} />
                  </span>
                  <span className="font-heading text-[11px] font-semibold uppercase tracking-label text-ink">
                    {benefit.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What we fix */}
      <section className="py-20 bg-cream-light border-t border-primary-500/20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mb-12">
            <div className="eyebrow">What We Fix</div>
            <h2 className="headline text-2xl sm:text-3xl md:text-4xl mt-4 mb-6">
              All major
              <br />
              <span className="headline-muted">appliances.</span>
            </h2>
            <div className="rule-short" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 border-t border-l border-primary-500/20 mb-10">
            {appliances.map((appliance) => (
              <div
                key={appliance}
                className="flex items-center gap-3 p-5 border-b border-r border-primary-500/20"
              >
                <Check className="h-4 w-4 text-primary-500 shrink-0" strokeWidth={2} />
                <span className="font-heading text-[11px] font-semibold uppercase tracking-label text-ink">
                  {appliance}
                </span>
              </div>
            ))}
          </div>

          <p className="text-gray-600">
            Samsung, LG, Whirlpool, GE, Maytag, Bosch, KitchenAid, Frigidaire &amp; more
          </p>
        </div>
      </section>

      {/* Why choose us */}
      <section className="py-20 bg-cream">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mb-12">
            <div className="eyebrow">Why CoastPro</div>
            <h2 className="headline text-2xl sm:text-3xl md:text-4xl mt-4 mb-6">
              Three reasons
              <br />
              <span className="headline-muted">people call us back.</span>
            </h2>
            <div className="rule-short" />
          </div>

          <div className="grid md:grid-cols-3 border-t border-l border-primary-500/20">
            {reasons.map((reason) => (
              <div key={reason.title} className="p-8 border-b border-r border-primary-500/20">
                <span className="icon-disc h-12 w-12 mb-6">
                  <reason.icon className="h-5 w-5" strokeWidth={1.5} />
                </span>
                <h3 className="font-heading text-sm font-bold uppercase tracking-label text-ink mb-3">
                  {reason.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{reason.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-primary-900">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="eyebrow text-primary-300">Ready When You Are</div>
            <h2 className="headline text-2xl sm:text-3xl md:text-4xl text-cream mt-4 mb-6">
              Ready to get your
              <br />
              appliance fixed?
            </h2>
            <div className="mx-auto h-px w-16 bg-cream/30 mb-6" />
            <p className="text-lg text-primary-200 mb-10">
              ${siteConfig.serviceFee.diagnostic} diagnostic fee — waived with repair.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href={`tel:${siteConfig.contact.phoneClean}`}>
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-cream text-ink hover:bg-cream-dark"
                  leftIcon={<Phone className="h-4 w-4" />}
                >
                  Call {siteConfig.contact.phone}
                </Button>
              </a>
              <Link href="/book-appointment">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-cream/60 text-cream hover:bg-cream hover:text-ink"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Book Online
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
