import Link from 'next/link';
import { Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui';
import { HeroSlider } from './HeroSlider';
import { siteConfig } from '@/data/site-config';
import { getWorkPhotos } from '@/lib/work-photos';

/**
 * The first screen, sized to be one.
 *
 * The hero it replaces spends about two and a half phone screens before the
 * second section starts: headline, paragraph, two full-width buttons, three
 * rows of trust badges, and then a photograph in 2:3 — which on a 390-pixel
 * phone is 585 pixels tall. Everything that earns the call ends up below the
 * fold, and the photograph is the thing pushing it there.
 *
 * Here the proof is one quiet line under the buttons, the photograph is 4:3,
 * and the whole block fits a phone. Restraint is the point: the page has to
 * feel like a premium service, which means saying less and meaning it, not
 * shouting earlier.
 */
export function HeroCompact() {
  const heroSlides = getWorkPhotos();
  const hasPhotos = heroSlides.length > 0;

  return (
    <section className="relative overflow-hidden bg-cream">
      <div
        aria-hidden={!hasPhotos}
        className="diagonal-cut absolute inset-y-0 right-0 hidden w-[38%] bg-primary-800 lg:block"
      >
        {hasPhotos && <HeroSlider slides={heroSlides} priority layout="plate" />}
      </div>

      <div className="container relative mx-auto px-4 py-12 lg:py-24">
        <div className="max-w-3xl">
          <div className="rule-short mb-7" />

          <h1 className="headline mb-6 text-[1.6rem] min-[420px]:text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
            Appliance repair
            <br />
            you can count on.
            <br />
            <span className="headline-muted">Across Orange County.</span>
          </h1>

          <p className="mb-7 max-w-prose text-[15px] text-gray-600 sm:text-lg">
            Fast, honest repairs for refrigerators, washers, dryers, dishwashers and ovens.
          </p>

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:gap-4">
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

          {/* One line where three boxed badges used to be. It says the same
              things, takes a fifth of the room, and reads as a fact rather than
              as three claims in frames. */}
          <p className="text-[12px] leading-relaxed text-gray-500 sm:text-[13px]">
            Licensed &amp; insured · 90-day warranty on parts and labour · Same-day service
            available
          </p>

          {hasPhotos && (
            <div className="relative -mx-4 mt-10 aspect-[4/3] bg-primary-800 sm:aspect-[16/9] lg:hidden">
              <HeroSlider slides={heroSlides} layout="plate" />
            </div>
          )}

          <div className="mt-8 flex items-center gap-2 text-primary-600">
            <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            <span className="font-heading text-[10px] font-semibold uppercase tracking-label">
              {siteConfig.contact.address.city}, CA
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
