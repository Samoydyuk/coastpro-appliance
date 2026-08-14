import Link from 'next/link';
import { Phone, Clock, Award, MapPin } from 'lucide-react';
import { Button } from '@/components/ui';
import { HeroSlider } from './HeroSlider';
import { siteConfig } from '@/data/site-config';
import { getWorkPhotos } from '@/lib/work-photos';

const trustBadges = [
  { icon: Clock, text: 'Same-Day Service' },
  { icon: Award, text: '90-Day Warranty' },
  { icon: MapPin, text: 'Local, Orange County' },
];

export function Hero() {
  const heroSlides = getWorkPhotos();
  const hasPhotos = heroSlides.length > 0;

  return (
    <section className="relative bg-cream overflow-hidden">
      {/* Espresso field on the right, cut on a diagonal — the signature of the
          brand creatives. Decorative only, hidden below lg. */}
      <div
        aria-hidden={!hasPhotos}
        className="hidden lg:block absolute inset-y-0 right-0 w-[38%] bg-primary-800 diagonal-cut"
      >
        {hasPhotos && <HeroSlider slides={heroSlides} priority layout="plate" />}
      </div>

      <div className="relative container mx-auto px-4 py-20 lg:py-28">
        <div className="max-w-3xl">
          {/* A rule rather than a line of type. The price used to sit here, and
              it is the wrong thing to open with: a number at the top of a page
              reads as the offer, when it is really a footnote to the offer.
              It is said where it belongs — beside the phone number in Why
              CoastPro, where the reasons to call are being read. */}
          <div className="mb-10">
            <div className="rule-short" />
          </div>

          {/* Headline — two-tone, heavy grotesk, tight leading */}
          <h1 className="headline text-[1.5rem] min-[420px]:text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-8">
            Appliance repair
            <br />
            you can count on.
            <br />
            <span className="headline-muted">Across Orange County.</span>
          </h1>

          <div className="rule max-w-md mb-8" />

          <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-prose">
            Fast, honest repairs for refrigerators, washers, dryers, dishwashers and ovens.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 mb-14">
            <Link href="/book-appointment">
              <Button size="lg" className="w-full sm:w-auto">
                Schedule Service
              </Button>
            </Link>
            <a href={`tel:${siteConfig.contact.phoneClean}`}>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto"
                leftIcon={<Phone className="h-4 w-4" />}
              >
                {siteConfig.contact.phone}
              </Button>
            </a>
          </div>

          {/* Trust row — hairline dividers, no boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-primary-500/25">
            {trustBadges.map((badge) => (
              <div
                key={badge.text}
                className="flex items-center gap-3 py-5 sm:px-5 sm:first:pl-0 border-b sm:border-b-0 sm:border-r last:border-r-0 border-primary-500/25"
              >
                <span className="icon-disc h-9 w-9 shrink-0">
                  <badge.icon className="h-4 w-4" strokeWidth={1.5} />
                </span>
                <span className="font-heading text-[11px] font-semibold uppercase tracking-label text-ink">
                  {badge.text}
                </span>
              </div>
            ))}
          </div>

          {/* Below lg the diagonal panel is hidden, so the photos run
              full-bleed under the hero copy instead of disappearing. */}
          {hasPhotos && (
            <div className="lg:hidden relative -mx-4 mt-12 aspect-[2/3] bg-primary-800">
              <HeroSlider slides={heroSlides} layout="plate" />
            </div>
          )}

          {/* Location marker, as on the creatives */}
          <div className="flex items-center gap-2 mt-10 text-primary-600">
            <MapPin className="h-4 w-4" strokeWidth={1.5} />
            <span className="font-heading text-[11px] font-semibold uppercase tracking-label">
              {siteConfig.contact.address.full}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
