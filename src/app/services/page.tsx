import { Metadata } from 'next';
import { ServicesGrid, CTABanner } from '@/components/sections';
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
      {/* Page Header */}
      <section className="bg-gradient-to-br from-primary-900 to-primary-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
            Our Appliance Repair Services
          </h1>
          <p className="text-xl text-primary-100 max-w-2xl mx-auto">
            Expert repair services for all major household appliances.
            Same-day appointments available throughout Orange County.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <ServicesGrid
        showAll={true}
        title="All Services"
        subtitle="Click on any service to learn more about common problems and solutions"
      />

      {/* Brands Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl font-bold text-gray-900 mb-4">
              Brands We Service
            </h2>
            <p className="text-xl text-gray-600">
              Experienced with all major appliance brands
            </p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-8 text-gray-400">
            {['Samsung', 'LG', 'Whirlpool', 'GE', 'Frigidaire', 'KitchenAid', 'Maytag', 'Bosch', 'Sub-Zero', 'Viking', 'Wolf', 'Miele'].map((brand) => (
              <span key={brand} className="text-xl font-semibold hover:text-gray-600 transition-colors">
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
