import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Phone } from 'lucide-react';
import { Card, CardContent, Button } from '@/components/ui';
import { CTABanner } from '@/components/sections';
import { serviceAreas } from '@/data/service-areas';
import { siteConfig } from '@/data/site-config';
import { getInitials } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Service Areas in Orange County',
  description: 'CoastPro Appliance Repair serves all of Orange County, CA including Irvine, Newport Beach, Costa Mesa, Huntington Beach, Anaheim, and more. Same-day service available.',
  openGraph: {
    title: 'Service Areas | CoastPro Appliance Repair',
    description: 'Professional appliance repair throughout Orange County, CA.',
  },
};

export default function ServiceAreasPage() {
  return (
    <>
      {/* Page Header */}
      <section className="bg-gradient-to-br from-primary-900 to-primary-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
            Service Areas
          </h1>
          <p className="text-xl text-primary-100 max-w-2xl mx-auto">
            Proudly serving all of Orange County with fast, reliable appliance repair
          </p>
        </div>
      </section>

      {/* Areas Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl font-bold text-gray-900 mb-4">
              Cities We Serve
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Click on any city to learn more about our services in your area
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {serviceAreas.map((area) => (
              <Link key={area.id} href={`/service-areas/${area.slug}`}>
                <Card hover className="h-full cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center shrink-0 group-hover:bg-primary-700 transition-colors">
                        <span className="text-white font-bold text-sm">
                          {getInitials(area.name)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 group-hover:text-primary-600 transition-colors mb-1">
                          {area.name}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">
                          {area.county}, {area.state}
                        </p>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {area.description.slice(0, 100)}...
                        </p>
                        <div className="flex items-center text-primary-600 text-sm font-medium mt-3">
                          <span>View Details</span>
                          <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Don't See Your City */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-heading text-3xl font-bold text-gray-900 mb-4">
            Don&apos;t See Your City?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            We serve many more areas throughout Orange County. Give us a call to confirm service in your location.
          </p>
          <a href={`tel:${siteConfig.contact.phoneClean}`}>
            <Button size="lg" leftIcon={<Phone className="h-5 w-5" />}>
              Call {siteConfig.contact.phone}
            </Button>
          </a>
        </div>
      </section>

      <CTABanner
        title="Need Appliance Repair in Orange County?"
        subtitle="Our technicians are ready to help. Same-day service available!"
      />
    </>
  );
}
