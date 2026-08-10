import { Metadata } from 'next';
import Link from 'next/link';
import { Phone, Shield, Check } from 'lucide-react';
import { Card, CardContent, Button } from '@/components/ui';
import { PageHeader } from '@/components/sections';
import { BookingStepForm } from '@/components/forms';
import { siteConfig } from '@/data/site-config';

export const metadata: Metadata = {
  title: 'Book an Appointment',
  description: `Schedule your appliance repair appointment online. Same-day service available in Orange County. Call ${siteConfig.contact.phone} for immediate assistance.`,
  openGraph: {
    title: 'Book Appointment | CoastPro Appliance Repair',
    description: 'Schedule your appliance repair online. Same-day service available.',
  },
};

const benefits = [
  'Same-day appointments available',
  'Flexible 2-hour windows',
  'Confirmation call 30 min before arrival',
  'Experienced with all major brands',
  'Upfront pricing - no surprises',
  `${siteConfig.trustSignals.warrantyDays}-day warranty on all repairs`,
];

export default function BookAppointmentPage() {
  return (
    <>
      <PageHeader
        eyebrow="Booking"
        title="Book your"
        titleMuted="appointment."
        subtitle="Schedule your appliance repair online, or call us for immediate assistance."
      />

      {/* Booking Section */}
      <section className="py-20 bg-cream">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Booking Widget Area */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-8">
                  <BookingStepForm />

                  {/* Alternative: Contact Form Link */}
                  <div className="mt-8 text-center border-t border-primary-500/20 pt-8">
                    <p className="text-gray-600 mb-4">
                      Prefer to describe your issue in detail?
                    </p>
                    <Link href="/contact">
                      <Button variant="outline">Use Contact Form Instead</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Call Us Card */}
              <Card className="bg-cream-dark">
                <CardContent className="p-6">
                  <h3 className="font-heading text-sm font-bold uppercase tracking-label text-ink mb-3">
                    Prefer to Call?
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Speak directly with our team for immediate assistance
                  </p>
                  <a href={`tel:${siteConfig.contact.phoneClean}`}>
                    <Button className="w-full" leftIcon={<Phone className="h-4 w-4" />}>
                      {siteConfig.contact.phone}
                    </Button>
                  </a>
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    Available {siteConfig.businessHours.weekdays}
                  </p>
                </CardContent>
              </Card>

              {/* Benefits Card */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-heading text-sm font-bold uppercase tracking-label text-ink mb-5">
                    What to Expect
                  </h3>
                  <ul className="space-y-3">
                    {benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start gap-3">
                        <Check className="h-4 w-4 text-primary-500 shrink-0 mt-1" strokeWidth={2} />
                        <span className="text-gray-600 text-sm">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Service Fee Card */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-heading text-sm font-bold uppercase tracking-label text-ink mb-3">
                    Minimum Service Call
                  </h3>
                  <div className="font-heading text-4xl font-extrabold text-ink mb-3">
                    ${siteConfig.serviceCall.minimum}
                  </div>
                  <p className="text-gray-600 text-sm">
                    Covers the visit, a full diagnosis and {siteConfig.serviceCall.includes}. Bigger jobs are quoted for your approval first.
                  </p>
                </CardContent>
              </Card>

              {/* Warranty Card */}
              <Card className="bg-primary-800 border-primary-800">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="h-5 w-5 text-primary-300" strokeWidth={1.5} />
                    <h3 className="font-heading text-sm font-bold uppercase tracking-label text-cream">
                      {siteConfig.trustSignals.warrantyDays}-Day Warranty
                    </h3>
                  </div>
                  <p className="text-primary-200 text-sm">
                    All repairs backed by our comprehensive parts & labor warranty.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-cream-light border-t border-primary-500/20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mb-12">
            <div className="eyebrow">Process</div>
            <h2 className="headline text-2xl sm:text-3xl md:text-4xl mt-4 mb-6">
              How it
              <br />
              <span className="headline-muted">works.</span>
            </h2>
            <div className="rule-short" />
          </div>
          <div className="grid md:grid-cols-4 border-t border-l border-primary-500/20">
            {[
              { step: '1', title: 'Book Online', desc: 'Select a date and time that works for you' },
              { step: '2', title: 'Confirmation', desc: "We'll confirm your appointment via text/email" },
              { step: '3', title: 'Technician Visit', desc: "We'll call 30 minutes before arrival" },
              { step: '4', title: 'Repair Complete', desc: 'Get your appliance working again!' },
            ].map((item) => (
              <div key={item.step} className="p-8 border-b border-r border-primary-500/20">
                <span className="icon-disc h-12 w-12 mb-6 font-heading text-lg font-bold">
                  {item.step}
                </span>
                <h3 className="font-heading text-sm font-bold uppercase tracking-label text-ink mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
