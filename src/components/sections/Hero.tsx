import Link from 'next/link';
import { Phone, Clock, Award, MapPin } from 'lucide-react';
import { Button } from '@/components/ui';
import { siteConfig } from '@/data/site-config';

const trustBadges = [
  { icon: Clock, text: 'Same-Day Service' },
  { icon: Award, text: '90-Day Warranty' },
  { icon: MapPin, text: 'Local, Orange County' },
];

export function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative container mx-auto px-4 py-20 lg:py-28">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium">Available Now - Same Day Service</span>
          </div>

          {/* Headline */}
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Appliance Repair You Can Count On —{' '}
            <span className="text-accent-300">Across Orange County</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-primary-100 mb-10 max-w-2xl mx-auto">
            Fast, honest repairs for refrigerators, washers, dryers, dishwashers and ovens.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/book-appointment">
              <Button size="lg" className="w-full sm:w-auto bg-accent-500 hover:bg-accent-600 text-white">
                Schedule Service
              </Button>
            </Link>
            <a href={`tel:${siteConfig.contact.phoneClean}`}>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-primary-900"
                leftIcon={<Phone className="h-5 w-5" />}
              >
                {siteConfig.contact.phone}
              </Button>
            </a>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            {trustBadges.map((badge) => (
              <div
                key={badge.text}
                className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3"
              >
                <badge.icon className="h-5 w-5 text-accent-300" />
                <span className="text-sm font-medium">{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto"
          preserveAspectRatio="none"
        >
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}
