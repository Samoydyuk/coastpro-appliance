import { Metadata } from 'next';
import { CheckCircle, Award, Users, Clock, Wrench } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { CTABanner } from '@/components/sections';
import { siteConfig } from '@/data/site-config';

export const metadata: Metadata = {
  title: 'About Us',
  description: `Learn about CoastPro Appliance Repair - Orange County's trusted appliance repair company committed to quality service and customer satisfaction.`,
  openGraph: {
    title: 'About Us | CoastPro Appliance Repair',
    description: 'Professional appliance repair services in Orange County.',
  },
};

const stats = [
  { value: siteConfig.trustSignals.repairsCompleted, label: 'Repairs Completed' },
  { value: siteConfig.trustSignals.satisfactionRate, label: 'Satisfaction Rate' },
  { value: '24/7', label: 'Emergency Service' },
];

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
    title: 'Expert Technicians',
    description: 'Factory-trained and certified on all major brands. Continuous education keeps us current.',
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

      {/* Stats */}
      <section className="py-12 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl font-bold text-primary-600 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
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
                Today, we&apos;re proud to be one of the most trusted appliance repair companies in Orange County. Our team of factory-trained technicians can handle everything from basic repairs to complex diagnostics on all major appliance brands. Whether it&apos;s a refrigerator that&apos;s not cooling or a washer that won&apos;t spin, we&apos;ve seen it all and fixed it all.
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
                'Factory-trained on all major brands',
                'Same-day service available',
                'Upfront pricing with no hidden fees',
                '90-day warranty on all repairs',
                'Background-checked technicians',
                'Fully stocked service vehicles',
                'Respectful of your home',
                'Trusted by Orange County homeowners',
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

      {/* Certifications */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-heading text-3xl font-bold text-gray-900 mb-4">
            Factory Trained & Certified
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Our technicians are factory-trained and certified to work on all major appliance brands
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8">
            <div className="flex items-center gap-2">
              <Award className="h-8 w-8 text-primary-600" />
              <span className="font-semibold text-gray-700">Certified</span>
            </div>
            <div className="flex items-center gap-2">
              <Wrench className="h-8 w-8 text-primary-600" />
              <span className="font-semibold text-gray-700">Factory Trained</span>
            </div>
          </div>
        </div>
      </section>

      <CTABanner
        title="Ready to Experience the Difference?"
        subtitle="Join thousands of satisfied customers who trust CoastPro Appliance Repair"
      />
    </>
  );
}
