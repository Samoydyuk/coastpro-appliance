import { Metadata } from 'next';
import { CheckCircle, Award, Users, Clock, Wrench } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { CTABanner } from '@/components/sections';

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
    description: 'We value your time. Same-day service and 2-hour appointment windows mean less waiting.',
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
      {/* Page Header */}
      <section className="bg-gradient-to-br from-primary-900 to-primary-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
            About CoastPro Appliance Repair
          </h1>
          <p className="text-xl text-primary-100 max-w-2xl mx-auto">
            Orange County&apos;s trusted appliance repair experts
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-heading text-3xl font-bold text-gray-900 mb-6 text-center">
              Our Story
            </h2>
            <div className="prose prose-lg max-w-none text-gray-600">
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
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-3xl font-bold text-gray-900 mb-12 text-center">
            Our Values
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <Card key={value.title}>
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <value.icon className="h-7 w-7 text-primary-600" />
                  </div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">{value.title}</h3>
                  <p className="text-gray-600 text-sm">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-heading text-3xl font-bold text-gray-900 mb-8 text-center">
              Why Choose Us?
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
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
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-gray-700">{item}</span>
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
