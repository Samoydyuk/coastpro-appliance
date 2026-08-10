'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { MapPin } from 'lucide-react';
import type { HeroSlide } from '@/data/hero-slides';

const INTERVAL_MS = 6000;

interface HeroSliderProps {
  slides: HeroSlide[];
  /** Marks the copy of the slider that is decorative on this breakpoint. */
  priority?: boolean;
}

/**
 * Crossfading photo slider that fills its positioned parent. The parent owns
 * the shape — on the home page that is the clipped diagonal panel on desktop
 * and a plain band on mobile — so this component only handles the images,
 * the caption and the advance behaviour.
 */
export function HeroSlider({ slides, priority = false }: HeroSliderProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  const advance = useCallback(() => {
    setIndex((current) => (current + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    // A single slide has nowhere to go, and readers who asked for less motion
    // get the first frame and the dots to move themselves.
    if (slides.length < 2 || paused || reducedMotion) return;

    timer.current = setInterval(advance, INTERVAL_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [advance, paused, reducedMotion, slides.length]);

  if (slides.length === 0) return null;

  const active = slides[index];

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Recent CoastPro repairs"
    >
      {slides.map((slide, i) => (
        <div
          key={slide.src}
          className={`absolute inset-0 transition-opacity duration-700 ease-out ${
            i === index ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden={i !== index}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover"
            priority={priority && i === 0}
          />
        </div>
      ))}

      {/* Scrim keeps the caption readable over a bright photo */}
      {(active.location || active.caption) && (
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-ink/85 via-ink/40 to-transparent"
        />
      )}

      {/* Caption, in the same language as the brand creatives */}
      {(active.location || active.caption) && (
        <div className="absolute inset-x-0 bottom-0 p-6 lg:p-8 lg:pl-16">
          {active.location && (
            <div className="flex items-center gap-2 mb-3 text-cream/80">
              <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              <span className="font-heading text-[10px] font-semibold uppercase tracking-label">
                {active.location}
              </span>
            </div>
          )}
          {active.caption && (
            <p className="font-heading text-sm lg:text-base font-bold uppercase tracking-tight text-cream max-w-xs leading-snug">
              {active.caption}
            </p>
          )}
        </div>
      )}

      {/* Progress bars — hairlines rather than dots, to match the page */}
      {slides.length > 1 && (
        <div className="absolute top-6 right-6 lg:top-8 lg:right-8 flex gap-2">
          {slides.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show photo ${i + 1} of ${slides.length}`}
              aria-current={i === index}
              className="group py-2"
            >
              <span
                className={`block h-px w-8 transition-colors ${
                  i === index ? 'bg-cream' : 'bg-cream/35 group-hover:bg-cream/70'
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
