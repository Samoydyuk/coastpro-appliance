import { Metadata } from 'next';
import Link from 'next/link';
import { Phone, Shield, CheckCircle } from 'lucide-react';
import { Card, CardContent, Button } from '@/components/ui';
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
      {/* Page Header */}
      <section className="bg-gradient-to-br from-primary-900 to-primary-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
            Book Your Appointment
          </h1>
          <p className="text-xl text-primary-100 max-w-2xl mx-auto">
            Schedule your appliance repair service online or call us for immediate assistance
          </p>
        </div>
      </section>

      {/* Booking Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Booking Widget Area */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-8">
                  <BookingStepForm />

                  {/* Alternative: Contact Form Link */}
                  <div className="mt-8 text-center border-t border-gray-200 pt-6">
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
              <Card className="bg-primary-50 border-primary-200">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
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
                  <h3 className="font-semibold text-lg text-gray-900 mb-4">
                    What to Expect
                  </h3>
                  <ul className="space-y-3">
                    {benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-gray-600 text-sm">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Service Fee Card */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    Service Call Fee
                  </h3>
                  <div className="text-3xl font-bold text-primary-600 mb-2">
                    ${siteConfig.serviceFee.diagnostic}
                  </div>
                  <p className="text-gray-600 text-sm">
                    {siteConfig.serviceFee.note}. Includes full diagnosis and repair quote.
                  </p>
                </CardContent>
              </Card>

              {/* Warranty Card */}
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="h-6 w-6 text-green-600" />
                    <h3 className="font-semibold text-lg text-gray-900">
                      {siteConfig.trustSignals.warrantyDays}-Day Warranty
                    </h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    All repairs backed by our comprehensive parts & labor warranty.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-3xl font-bold text-gray-900 mb-12 text-center">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {[
              { step: '1', title: 'Book Online', desc: 'Select a date and time that works for you' },
              { step: '2', title: 'Confirmation', desc: "We'll confirm your appointment via text/email" },
              { step: '3', title: 'Technician Visit', desc: "We'll call 30 minutes before arrival" },
              { step: '4', title: 'Repair Complete', desc: 'Get your appliance working again!' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
