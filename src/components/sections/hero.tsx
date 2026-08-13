'use client';

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';
import { ArrowRight, Clock, Phone, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Stars } from '@/components/ui/stars';
import type { Locale } from '@/i18n/routing';
import { blurFor, phoneHref, site } from '@/lib/site';

const HERO_IMAGE = '/images/hero-kitchen.webp';

export function Hero({ locale }: { locale: Locale }) {
  const t = useTranslations('hero');
  const common = useTranslations('common');
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  // Parallax: the image drifts slower than the page. Disabled outright under
  // prefers-reduced-motion — parallax is one of the worst offenders for people
  // with vestibular disorders.
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '18%']);
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '-12%']);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  const ratingLabel = common('starRating', {
    value: new Intl.NumberFormat(locale === 'fr' ? 'fr-CA' : 'en-CA', {
      minimumFractionDigits: 1,
    }).format(site.rating.value),
  });

  return (
    <section
      id="top"
      ref={ref}
      className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden bg-ink"
    >
      {/* Background */}
      <motion.div
        className="absolute inset-0 -z-20"
        style={reduce ? undefined : { y: imageY }}
      >
        <Image
          src={HERO_IMAGE}
          alt={t('imageAlt')}
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          quality={85}
          placeholder={blurFor(HERO_IMAGE) ? 'blur' : 'empty'}
          blurDataURL={blurFor(HERO_IMAGE)}
          className="scale-110 object-cover"
        />
      </motion.div>

      {/* Gradient overlay — carries the AA contrast for the headline */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/85 to-ink/45"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/90 via-ink/40 to-transparent"
      />

      <motion.div
        className="shell relative pb-12 pt-32 sm:pb-16 lg:pb-20"
        style={reduce ? undefined : { y: contentY, opacity: contentOpacity }}
      >
        <motion.p
          className="eyebrow text-accent"
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <span aria-hidden="true" className="h-px w-8 bg-accent" />
          {t('eyebrow')}
        </motion.p>

        <motion.h1
          className="mt-6 max-w-4xl text-[2.75rem] font-extrabold leading-[0.95] text-bone sm:text-6xl lg:text-7xl xl:text-8xl"
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        >
          {t('titleLine1')}{' '}
          <span className="text-accent">{t('titleAccent')}</span>{' '}
          {t('titleLine2')}
        </motion.h1>

        <motion.p
          className="mt-7 max-w-xl text-base leading-relaxed text-bone/75 sm:text-lg"
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
        >
          {t('subtitle')}
        </motion.p>

        <motion.div
          className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
        >
          <Button asChild size="lg">
            <a href="#contact">
              {t('ctaPrimary')}
              <ArrowRight aria-hidden="true" />
            </a>
          </Button>
          <Button asChild size="lg" variant="outlineDark">
            <a href={phoneHref}>
              <Phone aria-hidden="true" />
              {t('ctaSecondary', { phone: site.phone })}
            </a>
          </Button>
        </motion.div>
      </motion.div>

      {/* Trust strip */}
      <motion.div
        className="relative border-t border-bone/10 bg-ink/70 backdrop-blur-sm"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.36 }}
      >
        <ul className="shell grid grid-cols-1 divide-y divide-bone/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <li className="flex items-center gap-3 py-4 sm:justify-center sm:py-5">
            <Stars value={site.rating.value} label={ratingLabel} size="sm" />
            <span className="font-sans text-sm font-semibold text-bone">
              {t('trust.ratingLabel', {
                value: new Intl.NumberFormat(
                  locale === 'fr' ? 'fr-CA' : 'en-CA',
                  { minimumFractionDigits: 1 },
                ).format(site.rating.value),
                count: site.rating.count,
              })}
            </span>
          </li>
          <li className="flex items-center gap-3 py-4 sm:justify-center sm:py-5">
            <ShieldCheck aria-hidden="true" className="size-4 shrink-0 text-accent" />
            <span className="font-sans text-sm font-semibold text-bone">
              {t('trust.licenceLabel', { number: site.license.number })}
            </span>
          </li>
          <li className="flex items-center gap-3 py-4 sm:justify-center sm:py-5">
            <Clock aria-hidden="true" className="size-4 shrink-0 text-accent" />
            <span className="font-sans text-sm font-semibold text-bone">
              {t('trust.responseLabel', { time: t('trust.responseValue') })}
            </span>
          </li>
        </ul>
      </motion.div>
    </section>
  );
}
