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
  /**
   * 'cover' fills the parent, cropping to fit — right for the wide mobile
   * band. 'contain' sits the whole photo inside the parent with a margin of
   * espresso around it, which is what the tall desktop panel needs: filling
   * it would blow a small crop up to twice its size and show a fraction of
   * the scene.
   */
  fit?: 'cover' | 'contain';
}

/**
 * Crossfading photo slider that fills its positioned parent. The parent owns
 * the shape — on the home page that is the clipped diagonal panel on desktop
 * and a plain band on mobile — so this component only handles the images,
 * the caption and the advance behaviour.
 */
export function HeroSlider({ slides, priority = false, fit = 'cover' }: HeroSliderProps) {
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
  const isContained = fit === 'contain';

  // Contained photos are inset to leave the caption its own band underneath.
  const frameClass = isContained
    ? 'absolute top-[6%] bottom-[28%] left-[8%] right-[8%] lg:top-[10%] lg:bottom-[30%] lg:left-[22%] lg:right-[8%]'
    : 'absolute inset-0';

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
          className={`${frameClass} transition-opacity duration-700 ease-out ${
            i === index ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden={i !== index}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            sizes="(min-width: 1024px) 32vw, 100vw"
            className={isContained ? 'object-contain object-center' : 'object-cover'}
            priority={priority && i === 0}
          />
        </div>
      ))}

      {/* Scrim keeps the caption readable over a bright photo */}
      {!isContained && (active.location || active.caption) && (
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-ink/85 via-ink/40 to-transparent"
        />
      )}

      {/* Caption, in the same language as the brand creatives */}
      {(active.location || active.caption) && (
        <div
          className={
            isContained
              ? 'absolute inset-x-0 bottom-[6%] px-[8%] lg:bottom-[10%] lg:pl-[22%] lg:pr-[8%]'
              : 'absolute inset-x-0 bottom-0 p-6 lg:p-8 lg:pl-16'
          }
        >
          {active.location && (
            <div className="flex items-center gap-2 mb-3 text-cream/80">
              <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              <span className="font-heading text-[10px] font-semibold uppercase tracking-label">
                {active.location}
              </span>
            </div>
          )}
          {active.caption && (
            <p className="font-heading text-sm lg:text-base font-bold uppercase tracking-tight text-cream max-w-[22ch] leading-snug">
              {active.caption}
            </p>
          )}
        </div>
      )}

      {/* A bright photo swallows the hairline indicators, so they get their
          own scrim the same way the caption does. */}
      {!isContained && slides.length > 1 && (
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-ink/45 to-transparent"
        />
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
                  i === index ? 'bg-cream' : 'bg-cream/50 group-hover:bg-cream/80'
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
