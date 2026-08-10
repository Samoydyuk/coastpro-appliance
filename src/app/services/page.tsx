import { Metadata } from 'next';
import { ServicesGrid, CTABanner, PageHeader, StatsBand } from '@/components/sections';
import { siteConfig } from '@/data/site-config';

export const metadata: Metadata = {
  title: 'Appliance Repair Services',
  description: `Professional appliance repair services in Orange County. We repair refrigerators, washers, dryers, dishwashers, ovens, microwaves, and more. Same-day service available. Call ${siteConfig.contact.phone}.`,
  openGraph: {
    title: 'Appliance Repair Services | CoastPro Appliance Repair',
    description: 'Complete appliance repair services for all major brands. Same-day service, 90-day warranty.',
  },
};

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Services"
        title="Appliance repair"
        titleMuted="for every room."
        subtitle="Expert repair services for all major household appliances. Same-day appointments available throughout Orange County."
      />

      <StatsBand />

      {/* Services Grid */}
      <ServicesGrid
        showAll={true}
        eyebrow="01 — Catalog"
        title="All services"
        subtitle="Select any service to learn more about common problems and solutions."
      />

      {/* Brands Section */}
      <section className="py-20 bg-cream-light border-t border-primary-500/20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mb-12">
            <div className="eyebrow">02 — Brands</div>
            <h2 className="headline text-2xl sm:text-3xl md:text-4xl mt-4 mb-6">
              Every major
              <br />
              <span className="headline-muted">brand serviced.</span>
            </h2>
            <div className="rule-short" />
          </div>
          <div className="flex flex-wrap gap-x-10 gap-y-5">
            {['Samsung', 'LG', 'Whirlpool', 'GE', 'Frigidaire', 'KitchenAid', 'Maytag', 'Bosch', 'Sub-Zero', 'Viking', 'Wolf', 'Miele'].map((brand) => (
              <span
                key={brand}
                className="font-heading text-sm font-semibold uppercase tracking-label text-primary-500 hover:text-ink transition-colors"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      <CTABanner
        title="Need Appliance Repair?"
        subtitle="Our expert technicians are ready to help. Schedule your appointment today!"
      />
    </>
  );
}
