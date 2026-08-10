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
   * 'cover' fills the parent, cropping to fit. 'contain' sits the whole photo
   * inside the parent with espresso around it — what the tall hero panel
   * needs, since filling it would scale a small crop past its own size.
   */
  fit?: 'cover' | 'contain';
}

/**
 * Photo slider for the hero panel. Contained mode is laid out as a plate in a
 * photo essay: eyebrow, the print itself, a rule that doubles as the autoplay
 * timer, the caption, then the frame numbers.
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
    // move themselves.
    if (slides.length < 2 || paused || reducedMotion) return;

    timer.current = setInterval(advance, INTERVAL_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [advance, paused, reducedMotion, slides.length]);

  if (slides.length === 0) return null;

  const active = slides[index];
  const isContained = fit === 'contain';
  const hasCaption = Boolean(active.location || active.caption);

  const frameClass = isContained
    ? 'absolute top-[10%] bottom-[36%] left-[8%] right-[8%] lg:top-[11%] lg:bottom-[36%] lg:left-[22%] lg:right-[8%]'
    : 'absolute inset-0';

  // Everything in the caption column lines up with the print above it.
  const railClass = isContained ? 'absolute inset-x-0 px-[8%] lg:pl-[22%] lg:pr-[8%]' : '';

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
      {/* The print */}
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
            className={isContained ? 'object-contain object-bottom' : 'object-cover'}
            priority={priority && i === 0}
          />
        </div>
      ))}

      {isContained ? (
        <>
          {/* Eyebrow, set to the left edge of the print */}
          <div className={`${railClass} top-[5%]`}>
            <div className="flex items-center gap-3">
              <span className="h-px w-6 bg-cream/40" />
              <span className="font-heading text-[10px] font-semibold uppercase tracking-label text-cream/70">
                Recent Work
              </span>
            </div>
          </div>

          {/* Rule under the print, which also runs the autoplay timer */}
          <div className={`${railClass} top-[64%]`}>
            <div className="relative h-px w-full bg-cream/20 overflow-hidden">
              {slides.length > 1 && !reducedMotion && (
                <span
                  key={index}
                  className="slider-progress absolute inset-y-0 left-0 w-full bg-cream/70"
                  style={{
                    animationDuration: `${INTERVAL_MS}ms`,
                    animationPlayState: paused ? 'paused' : 'running',
                  }}
                />
              )}
            </div>
          </div>

          {hasCaption && (
            <div className={`${railClass} top-[69%]`}>
              {active.location && (
                <div className="flex items-center gap-2 mb-3 text-cream/70">
                  <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  <span className="font-heading text-[10px] font-semibold uppercase tracking-label">
                    {active.location}
                  </span>
                </div>
              )}
              {active.caption && (
                <p className="font-heading text-sm lg:text-base font-bold uppercase tracking-tight text-cream max-w-[24ch] leading-snug">
                  {active.caption}
                </p>
              )}
            </div>
          )}

          {/* Frame numbers, as on a contact sheet */}
          {slides.length > 1 && (
            <div className={`${railClass} bottom-[6%]`}>
              <div className="flex items-center gap-4">
                {slides.map((slide, i) => (
                  <button
                    key={slide.src}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={`Show photo ${i + 1} of ${slides.length}`}
                    aria-current={i === index}
                    className={`font-heading text-[11px] font-bold tracking-label transition-colors ${
                      i === index ? 'text-cream' : 'text-cream/35 hover:text-cream/70'
                    }`}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </button>
                ))}
                <span className="h-px flex-1 bg-cream/20" />
                <span className="font-heading text-[10px] font-semibold uppercase tracking-label text-cream/40">
                  Orange County
                </span>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Cover mode keeps its scrims — the caption sits on the photo */}
          {hasCaption && (
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-ink/85 via-ink/40 to-transparent"
            />
          )}
          {slides.length > 1 && (
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-ink/45 to-transparent"
            />
          )}
          {hasCaption && (
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
                <p className="font-heading text-sm lg:text-base font-bold uppercase tracking-tight text-cream max-w-[24ch] leading-snug">
                  {active.caption}
                </p>
              )}
            </div>
          )}
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
        </>
      )}
    </div>
  );
}
