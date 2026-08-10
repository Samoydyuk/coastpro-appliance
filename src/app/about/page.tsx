import { Metadata } from 'next';
import { Check, Award, Users, Clock, Wrench } from 'lucide-react';
import { CTABanner, PageHeader, StatsBand, ProcessSteps } from '@/components/sections';

export const metadata: Metadata = {
  title: 'About Us',
  description: `Learn about CoastPro Appliance Repair - Orange County's trusted appliance repair company committed to quality service and customer satisfaction.`,
  openGraph: {
    title: 'About Us | CoastPro Appliance Repair',
    description: 'Professional appliance repair services in Orange County.',
  },
};

const values = [
  {
    icon: Clock,
    title: 'Prompt Service',
    description: 'We value your time. Same-day service and a 3-hour arrival window mean less waiting.',
  },
  {
    icon: Award,
    title: 'Quality Guaranteed',
    description: 'All repairs backed by our 90-day warranty. If it breaks again, we fix it free.',
  },
  {
    icon: Wrench,
    title: 'Experienced Technicians',
    description: 'Experienced with all major brands. We keep learning to stay current with new appliances.',
  },
  {
    icon: Users,
    title: 'Customer First',
    description: 'Clear communication, upfront pricing, and respect for your home are our standards.',
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About"
        title="Regular care."
        titleMuted="Better performance."
        subtitle="Orange County's trusted appliance repair experts."
        location="Irvine, CA"
      />

      <StatsBand />

      {/* Story Section */}
      <section className="py-20 lg:py-24 bg-cream">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-32">
                <div className="eyebrow">01 — Our Story</div>
                <h2 className="headline text-2xl sm:text-3xl md:text-4xl mt-4 mb-6">
                  One repair
                  <br />
                  <span className="headline-muted">at a time.</span>
                </h2>
                <div className="rule-short" />
              </div>
            </div>
            <div className="lg:col-span-8 space-y-6 text-lg leading-relaxed text-gray-600 max-w-prose">
              <p>
                CoastPro Appliance Repair was founded with a simple mission: to provide Orange County homeowners with honest, reliable, and affordable appliance repair services. What started as a one-man operation has grown into a team of skilled technicians serving all of Orange County.
              </p>
              <p>
                Over the years, we&apos;ve built our reputation one repair at a time. We believe in doing things right the first time, communicating clearly with our customers, and standing behind our work. That&apos;s why we offer a 90-day warranty on all repairs - we&apos;re confident in the quality of our service.
              </p>
              <p>
                Our experienced technicians work on all major appliance brands and handle everything from basic repairs to complex diagnostics. Whether it&apos;s a refrigerator that&apos;s not cooling or a washer that won&apos;t spin, we approach every job with the same care.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-cream-light border-t border-primary-500/20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mb-12">
            <div className="eyebrow">02 — Our Values</div>
            <h2 className="headline text-2xl sm:text-3xl md:text-4xl mt-4 mb-6">
              How we work,
              <br />
              <span className="headline-muted">every job.</span>
            </h2>
            <div className="rule-short" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 border-t border-l border-primary-500/20">
            {values.map((value) => (
              <div key={value.title} className="p-8 border-b border-r border-primary-500/20">
                <span className="icon-disc h-12 w-12 mb-6">
                  <value.icon className="h-5 w-5" strokeWidth={1.5} />
                </span>
                <h3 className="font-heading text-sm font-bold uppercase tracking-label text-ink mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ProcessSteps />

      {/* Why Choose Us */}
      <section className="py-20 lg:py-24 bg-cream">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mb-12">
            <div className="eyebrow">04 — Why Choose Us</div>
            <h2 className="headline text-2xl sm:text-3xl md:text-4xl mt-4 mb-6">
              Eight reasons
              <br />
              <span className="headline-muted">to call us first.</span>
            </h2>
            <div className="rule-short" />
          </div>
          <div className="max-w-5xl">
            <div className="grid md:grid-cols-2 gap-x-12 gap-y-0">
              {[
                'Experienced with all major brands',
                'Same-day service available',
                'Upfront pricing with no hidden fees',
                '90-day warranty on all repairs',
                'Background-checked technicians',
                'Fully stocked service vehicles',
                'Respectful of your home',
                'Locally owned and operated in Orange County',
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 py-3 border-b border-primary-500/20"
                >
                  <Check className="h-4 w-4 text-primary-500 shrink-0 mt-1" strokeWidth={2} />
                  <span className="text-gray-600">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <CTABanner
        title="Ready to Get Your Appliance Fixed?"
        subtitle="Local, honest appliance repair across Orange County."
      />
    </>
  );
}
