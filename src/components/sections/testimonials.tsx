'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pause, Play, Quote } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import { SectionHeading } from '@/components/ui/section-heading';
import { Stars } from '@/components/ui/stars';
import type { Locale } from '@/i18n/routing';
import {
  isRealTestimonial,
  site,
  tFallback,
  type Testimonial,
} from '@/lib/site';
import { cn } from '@/lib/utils';

const AUTOPLAY_MS = 8000;

export function Testimonials({ locale }: { locale: Locale }) {
  const t = useTranslations('testimonials');
  const common = useTranslations('common');
  const reduce = useReducedMotion();

  const reviews = site.testimonials;
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);

  const go = useCallback(
    (next: number) => setIndex((next + reviews.length) % reviews.length),
    [reviews.length],
  );

  // Autoplay never starts when reduced motion is requested, and stops for good
  // as soon as the visitor takes control.
  useEffect(() => {
    if (!playing || reduce || reviews.length < 2) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % reviews.length),
      AUTOPLAY_MS,
    );
    return () => window.clearInterval(id);
  }, [playing, reduce, reviews.length]);

  const nf = new Intl.NumberFormat(locale === 'fr' ? 'fr-CA' : 'en-CA', {
    minimumFractionDigits: 1,
  });

  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-title"
      className="relative scroll-mt-24 bg-bone py-20 lg:py-28"
    >
      <div className="shell">
        <SectionHeading
          id="testimonials-title"
          eyebrow={t('eyebrow')}
          title={t('title')}
          subtitle={t('subtitle')}
          tone="light"
        />

        {/* Verified aggregate — this part is real */}
        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2">
          <Stars
            value={site.rating.value}
            label={common('starRating', { value: nf.format(site.rating.value) })}
            size="lg"
          />
          <p className="font-display text-lg font-bold tracking-tight text-ink">
            {t('aggregate', {
              value: nf.format(site.rating.value),
              count: site.rating.count,
            })}
          </p>
          <p className="font-sans text-xs text-muted-light">
            {t('source', { source: site.rating.source })}
          </p>
        </div>

        <div
          className="relative mt-12"
          role="region"
          aria-roledescription="carousel"
          aria-label={t('carouselLabel')}
        >
          <div className="relative min-h-[19rem] border border-ink/10 bg-white p-8 sm:min-h-[17rem] sm:p-12">
            <Quote
              aria-hidden="true"
              className="absolute right-8 top-8 size-12 text-bone-300"
              strokeWidth={1.25}
            />

            {/* aria-live so the slide change is announced without stealing focus */}
            <div aria-live="polite" aria-atomic="true" className="relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={reviews[index]?.id ?? index}
                  initial={reduce ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -12 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <p className="sr-only">
                    {t('slideLabel', {
                      current: index + 1,
                      total: reviews.length,
                    })}
                  </p>
                  <Slide review={reviews[index]} locale={locale} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setPlaying(false);
                  go(index - 1);
                }}
                aria-label={common('previous')}
                className="inline-flex size-11 items-center justify-center border border-ink/20 text-ink transition-colors hover:border-accent hover:bg-accent hover:text-white"
              >
                <ChevronLeft aria-hidden="true" className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setPlaying(false);
                  go(index + 1);
                }}
                aria-label={common('next')}
                className="inline-flex size-11 items-center justify-center border border-ink/20 text-ink transition-colors hover:border-accent hover:bg-accent hover:text-white"
              >
                <ChevronRight aria-hidden="true" className="size-5" />
              </button>
              {!reduce && reviews.length > 1 ? (
                <button
                  type="button"
                  onClick={() => setPlaying((p) => !p)}
                  aria-label={playing ? t('pause') : t('play')}
                  className="inline-flex size-11 items-center justify-center border border-ink/20 text-ink transition-colors hover:border-accent hover:bg-accent hover:text-white"
                >
                  {playing ? (
                    <Pause aria-hidden="true" className="size-4" />
                  ) : (
                    <Play aria-hidden="true" className="size-4" />
                  )}
                </button>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              {reviews.map((review, i) => (
                <button
                  key={review.id}
                  type="button"
                  onClick={() => {
                    setPlaying(false);
                    go(i);
                  }}
                  aria-label={t('goToSlide', { number: i + 1 })}
                  aria-current={i === index ? 'true' : undefined}
                  className={cn(
                    'h-1.5 transition-all duration-300',
                    i === index ? 'w-8 bg-accent' : 'w-4 bg-ink/20 hover:bg-ink/40',
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Slide({
  review,
  locale,
}: {
  review: Testimonial | undefined;
  locale: Locale;
}) {
  const t = useTranslations('testimonials');
  const common = useTranslations('common');

  if (!review) return null;

  /*
   * The carousel is fully functional; what it has no access to is the review
   * text itself. The 5.0 / 23 aggregate is verified, the individual bodies and
   * reviewer names were not available — so a placeholder slide says exactly
   * that instead of showing an invented quote attributed to a made-up person.
   * See content/MISSING.md § 3.
   */
  if (!isRealTestimonial(review)) {
    return (
      <div className="flex min-h-40 flex-col justify-center">
        <span className="inline-flex w-fit items-center gap-2 border border-accent/40 bg-accent/5 px-2.5 py-1 font-sans text-[0.625rem] font-bold uppercase tracking-[0.18em] text-accent-700">
          {common('todo')}
        </span>
        <p className="mt-5 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {t('placeholder.title')}
        </p>
        <p className="mt-2 text-lg text-muted-light">{t('placeholder.body')}</p>
        <p className="mt-6 max-w-xl border-t border-ink/10 pt-4 font-mono text-xs leading-relaxed text-muted-light">
          {t('placeholder.note')}
        </p>
      </div>
    );
  }

  const quote = tFallback(review.quote, locale);
  const nf = new Intl.NumberFormat(locale === 'fr' ? 'fr-CA' : 'en-CA', {
    minimumFractionDigits: 1,
  });

  return (
    <figure className="flex min-h-40 flex-col justify-center">
      <Stars
        value={review.rating}
        label={common('starRating', { value: nf.format(review.rating) })}
      />
      <blockquote className="mt-5">
        <p
          className="font-display text-xl font-medium leading-snug text-ink sm:text-2xl"
          lang={quote?.isFallback ? (locale === 'fr' ? 'en' : 'fr') : undefined}
        >
          {quote?.text}
        </p>
      </blockquote>
      <figcaption className="mt-6 font-sans text-sm text-muted-light">
        <span className="font-semibold text-ink">{review.author}</span>
        {review.location ? <span> · {review.location}</span> : null}
        {review.date ? (
          <span>
            {' · '}
            <time dateTime={review.date}>
              {new Intl.DateTimeFormat(locale === 'fr' ? 'fr-CA' : 'en-CA', {
                year: 'numeric',
                month: 'long',
                timeZone: 'UTC',
              }).format(new Date(`${review.date}T00:00:00Z`))}
            </time>
          </span>
        ) : null}
      </figcaption>
    </figure>
  );
}
