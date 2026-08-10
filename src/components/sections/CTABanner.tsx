import Link from 'next/link';
import { Phone, Calendar } from 'lucide-react';
import { Button } from '@/components/ui';
import { siteConfig } from '@/data/site-config';

interface CTABannerProps {
  title?: string;
  subtitle?: string;
  /** Overrides the standard service-call footnote, e.g. on a service that
   *  carries its own minimum order. */
  note?: string;
  variant?: 'primary' | 'accent';
}

export function CTABanner({
  title = "Ready to get your appliance fixed?",
  subtitle = "Our technicians are standing by. Same-day service available.",
  note,
  variant = 'primary'
}: CTABannerProps) {
  const isDark = variant === 'primary';

  return (
    <section className={isDark ? 'bg-primary-900 py-20' : 'bg-cream-dark py-20'}>
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className={isDark ? 'eyebrow text-primary-300' : 'eyebrow'}>CoastPro</div>

          <h2
            className={`headline text-2xl sm:text-3xl md:text-4xl mt-4 mb-6 ${isDark ? 'text-cream' : 'text-ink'}`}
          >
            {title}
          </h2>

          <div className={`mx-auto h-px w-16 mb-6 ${isDark ? 'bg-cream/30' : 'bg-primary-500/40'}`} />

          <p className={`text-lg mb-10 ${isDark ? 'text-primary-200' : 'text-gray-600'}`}>
            {subtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/book-appointment">
              <Button
                size="lg"
                className={
                  isDark
                    ? 'w-full sm:w-auto bg-cream text-ink hover:bg-cream-dark'
                    : 'w-full sm:w-auto'
                }
                leftIcon={<Calendar className="h-4 w-4" />}
              >
                Schedule Service
              </Button>
            </Link>
            <a href={`tel:${siteConfig.contact.phoneClean}`}>
              <Button
                size="lg"
                variant="outline"
                className={
                  isDark
                    ? 'w-full sm:w-auto border-cream/60 text-cream hover:bg-cream hover:text-ink'
                    : 'w-full sm:w-auto'
                }
                leftIcon={<Phone className="h-4 w-4" />}
              >
                {siteConfig.contact.phone}
              </Button>
            </a>
          </div>

          <p className={`mt-8 text-sm ${isDark ? 'text-primary-300' : 'text-gray-600'}`}>
            {note ?? `$${siteConfig.serviceCall.minimum} minimum service call — ${siteConfig.serviceCall.note.toLowerCase()}`}
          </p>
        </div>
      </div>
    </section>
  );
}
