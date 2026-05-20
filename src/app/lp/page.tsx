import { Metadata } from 'next';
import Link from 'next/link';
import { Phone, CheckCircle, Clock, Shield, MapPin, Wrench, ArrowRight } from 'lucide-react';
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

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section - Above the fold */}
      <section className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Clock className="h-4 w-4 text-accent-400" />
              <span className="text-sm font-medium">Same-Day Appointments Available</span>
            </div>

            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Expert Appliance Repair
              <br />
              <span className="text-accent-400">in Orange County</span>
            </h1>

            <p className="text-xl md:text-2xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Fast, affordable, and reliable repairs for all major appliances.
              Local Orange County technicians.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <a href={`tel:${siteConfig.contact.phoneClean}`}>
                <Button size="lg" className="w-full sm:w-auto bg-accent-500 hover:bg-accent-600 text-gray-900 font-bold text-lg px-8">
                  <Phone className="h-5 w-5 mr-2" />
                  Call {siteConfig.contact.phone}
                </Button>
              </a>
              <Link href="/book-appointment">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white/10 text-lg px-8">
                  Book Online Now
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {benefits.map((benefit) => (
                <div key={benefit.text} className="flex flex-col items-center gap-2 text-center">
                  <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                    <benefit.icon className="h-5 w-5 text-accent-400" />
                  </div>
                  <span className="text-sm text-primary-100">{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What We Fix */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-3xl font-bold text-center text-gray-900 mb-8">
            We Fix All Major Appliances
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-8">
            {appliances.map((appliance) => (
              <div key={appliance} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                <span className="font-medium text-gray-800">{appliance}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-600">
            Samsung, LG, Whirlpool, GE, Maytag, Bosch, KitchenAid, Frigidaire & more
          </p>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-3xl font-bold text-center text-gray-900 mb-8">
            Why Choose CoastPro?
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-7 w-7 text-primary-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Same-Day Service</h3>
              <p className="text-gray-600 text-sm">Book before noon and get your appliance fixed today. No waiting around for days.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-7 w-7 text-primary-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">90-Day Warranty</h3>
              <p className="text-gray-600 text-sm">Every repair backed by our 90-day warranty. If it breaks again, we fix it free.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wrench className="h-7 w-7 text-primary-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Expert Technicians</h3>
              <p className="text-gray-600 text-sm">Our skilled technicians handle all brands and appliance types with precision.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 bg-primary-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Your Appliance Fixed?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-xl mx-auto">
            ${siteConfig.serviceFee.diagnostic} diagnostic fee — waived with repair!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={`tel:${siteConfig.contact.phoneClean}`}>
              <Button size="lg" className="w-full sm:w-auto bg-accent-500 hover:bg-accent-600 text-gray-900 font-bold text-lg px-8">
                <Phone className="h-5 w-5 mr-2" />
                Call Now: {siteConfig.contact.phone}
              </Button>
            </a>
            <Link href="/book-appointment">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white/10 text-lg px-8">
                Book Online
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
