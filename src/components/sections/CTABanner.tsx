import Link from 'next/link';
import { Phone, Calendar } from 'lucide-react';
import { Button } from '@/components/ui';
import { siteConfig } from '@/data/site-config';

interface CTABannerProps {
  title?: string;
  subtitle?: string;
  variant?: 'primary' | 'accent';
}

export function CTABanner({
  title = "Ready to Get Your Appliance Fixed?",
  subtitle = "Our expert technicians are standing by. Same-day service available!",
  variant = 'primary'
}: CTABannerProps) {
  const bgClass = variant === 'primary'
    ? 'bg-gradient-to-r from-primary-600 to-primary-800'
    : 'bg-gradient-to-r from-accent-500 to-accent-600';

  return (
    <section className={`${bgClass} text-white py-16`}>
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            {title}
          </h2>
          <p className="text-xl text-white/90 mb-8">
            {subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/book-appointment">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-white text-primary-700 hover:bg-gray-100"
                leftIcon={<Calendar className="h-5 w-5" />}
              >
                Schedule Service
              </Button>
            </Link>
            <a href={`tel:${siteConfig.contact.phoneClean}`}>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-white text-white hover:bg-white/10"
                leftIcon={<Phone className="h-5 w-5" />}
              >
                Call {siteConfig.contact.phone}
              </Button>
            </a>
          </div>
          <p className="mt-6 text-sm text-white/70">
            ${siteConfig.serviceFee.diagnostic} diagnostic fee - {siteConfig.serviceFee.note}
          </p>
        </div>
      </div>
    </section>
  );
}
