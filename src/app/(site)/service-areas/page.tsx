import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Phone } from 'lucide-react';
import { Button } from '@/components/ui';
import { CTABanner, PageHeader, StatsBand } from '@/components/sections';
import { serviceAreas } from '@/data/service-areas';
import { siteConfig } from '@/data/site-config';
import { getInitials } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Service Areas in Orange County',
  description: 'Appliance repair across Orange County, CA — Irvine, Newport Beach, Costa Mesa, Huntington Beach, Anaheim and more. Same-day service available.',
  openGraph: {
    title: 'Service Areas | CoastPro Appliance Repair',
    description: 'Professional appliance repair throughout Orange County, CA.',
  },
};

export default function ServiceAreasPage() {
  return (
    <>
      <PageHeader
        eyebrow="Service Areas"
        title="Serving all of"
        titleMuted="Orange County."
        subtitle="Proudly serving Orange County with fast, reliable appliance repair."
      />

      <StatsBand />

      {/* Areas Grid */}
      <section className="py-20 bg-cream">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mb-12">
            <div className="eyebrow">01 — Cities We Serve</div>
            <div className="rule-short my-6" />
            <p className="text-lg text-gray-600">
              Select a city to learn more about our services in your area.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 border-t border-l border-primary-500/20">
            {serviceAreas.map((area) => (
              <Link
                key={area.id}
                href={`/service-areas/${area.slug}`}
                className="group p-8 border-b border-r border-primary-500/20 transition-colors hover:bg-cream-dark/50"
              >
                <div className="flex items-start gap-4">
                  <span className="icon-disc h-12 w-12 shrink-0 font-heading text-xs font-bold tracking-wider transition-colors group-hover:border-ink group-hover:bg-ink group-hover:text-cream">
                    {getInitials(area.name)}
                  </span>
                  <div className="flex-1">
                    <h3 className="font-heading text-sm font-bold uppercase tracking-label text-ink mb-2">
                      {area.name}
                    </h3>
                    <p className="text-xs text-primary-500 mb-3">
                      {area.county}, {area.state}
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                      {area.description.slice(0, 100)}...
                    </p>
                    <span className="inline-flex items-center font-heading text-[11px] font-semibold uppercase tracking-label text-primary-600 group-hover:text-ink transition-colors">
                      View Details
                      <ArrowRight className="h-3.5 w-3.5 ml-2 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Don't See Your City */}
      <section className="py-20 bg-cream-light border-t border-primary-500/20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <div className="eyebrow">02 — Not Listed?</div>
            <h2 className="headline text-2xl sm:text-3xl md:text-4xl mt-4 mb-6">
              Don&apos;t see
              <br />
              <span className="headline-muted">your city?</span>
            </h2>
            <div className="rule-short mb-6" />
            <p className="text-lg text-gray-600 mb-10">
              We serve many more areas throughout Orange County. Give us a call to confirm service
              in your location.
            </p>
            <a href={`tel:${siteConfig.contact.phoneClean}`}>
              <Button size="lg" leftIcon={<Phone className="h-4 w-4" />}>
                Call {siteConfig.contact.phone}
              </Button>
            </a>
          </div>
        </div>
      </section>

      <CTABanner
        title="Need Appliance Repair in Orange County?"
        subtitle="Our technicians are ready to help. Same-day service available!"
      />
    </>
  );
}
