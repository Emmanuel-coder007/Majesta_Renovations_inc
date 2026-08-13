'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Expand, Info, X } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useId, useState } from 'react';

import { RevealItem, RevealList } from '@/components/ui/reveal';
import { SectionHeading } from '@/components/ui/section-heading';
import type { Locale } from '@/i18n/routing';
import {
  blurFor,
  site,
  t as pick,
  type ServiceCategory,
} from '@/lib/site';
import { cn } from '@/lib/utils';

const FILTERS = [
  'all',
  'kitchen',
  'bathroom',
  'basement',
  'addition',
  'commercial',
] as const;

type Filter = (typeof FILTERS)[number];

export function Projects({ locale }: { locale: Locale }) {
  const t = useTranslations('projects');
  const common = useTranslations('common');
  const reduce = useReducedMotion();

  const [filter, setFilter] = useState<Filter>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const items = site.gallery.filter(
    (item) => filter === 'all' || item.category === (filter as ServiceCategory),
  );

  const close = useCallback(() => setLightboxIndex(null), []);
  const step = useCallback(
    (delta: number) =>
      setLightboxIndex((current) =>
        current === null
          ? null
          : (current + delta + items.length) % items.length,
      ),
    [items.length],
  );

  // Arrow-key navigation while the lightbox is open. Radix already handles
  // Escape, focus trapping and scroll lock.
  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') step(1);
      if (event.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIndex, step]);

  const active = lightboxIndex === null ? null : items[lightboxIndex];

  return (
    <section
      id="projects"
      aria-labelledby="projects-title"
      className="grain relative scroll-mt-24 bg-ink py-20 lg:py-28"
    >
      <div className="shell">
        <SectionHeading
          id="projects-title"
          eyebrow={t('eyebrow')}
          title={t('title')}
          subtitle={t('subtitle')}
        />

        {/* Standing disclosure: these are illustrations, not project photos. */}
        <p className="mt-6 inline-flex items-center gap-2 border border-accent/30 bg-accent/5 px-3 py-2 text-xs text-accent-300">
          <Info aria-hidden="true" className="size-3.5 shrink-0" />
          {t('placeholderNotice')}
        </p>

        {/* Filters */}
        <div
          role="group"
          aria-label={t('eyebrow')}
          className="mt-10 flex flex-wrap gap-2"
        >
          {FILTERS.map((option) => {
            const isActive = option === filter;
            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setFilter(option);
                  setLightboxIndex(null);
                }}
                aria-pressed={isActive}
                className={cn(
                  'border px-4 py-2 font-sans text-sm font-semibold transition-colors duration-200',
                  isActive
                    ? 'border-accent bg-accent text-white'
                    : 'border-bone/20 text-muted-dark hover:border-bone/50 hover:text-bone',
                )}
              >
                {t(`filters.${option}`)}
              </button>
            );
          })}
        </div>

        {/* Masonry grid */}
        {items.length === 0 ? (
          <p className="mt-12 text-muted-dark">{t('emptyState')}</p>
        ) : (
          <RevealList
            as="div"
            className="mt-10 gap-6 sm:columns-2 lg:columns-3 [&>*]:mb-6"
          >
            {items.map((item, index) => (
              <RevealItem as="div" key={item.id} className="break-inside-avoid">
                <button
                  type="button"
                  onClick={() => setLightboxIndex(index)}
                  aria-label={t('lightbox.openLabel', {
                    title: pick(item.title, locale),
                  })}
                  className="group relative block w-full overflow-hidden border border-bone/10 bg-ink-800 text-left transition-colors duration-300 hover:border-accent/60"
                >
                  <Image
                    src={item.src}
                    alt={pick(item.alt, locale)}
                    width={item.aspect === '3/4' ? 1200 : 1600}
                    height={item.aspect === '3/4' ? 1600 : 1200}
                    loading="lazy"
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
                    placeholder={blurFor(item.src) ? 'blur' : 'empty'}
                    blurDataURL={blurFor(item.src)}
                    className="h-auto w-full transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-90"
                  />
                  <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
                    <span className="font-display text-base font-bold tracking-tight text-bone">
                      {pick(item.title, locale)}
                    </span>
                    <span
                      aria-hidden="true"
                      className="flex size-9 shrink-0 items-center justify-center bg-accent text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    >
                      <Expand className="size-4" />
                    </span>
                  </span>
                </button>
              </RevealItem>
            ))}
          </RevealList>
        )}

        {/* Before / after */}
        <div className="mt-24">
          <SectionHeading
            eyebrow={t('beforeAfter.eyebrow')}
            title={t('beforeAfter.title')}
            subtitle={t('beforeAfter.instruction')}
          />
          <div className="mt-12 grid gap-10 lg:grid-cols-2">
            {site.beforeAfter.map((pair) => (
              <BeforeAfter key={pair.id} pair={pair} locale={locale} />
            ))}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <Dialog.Root
        open={lightboxIndex !== null}
        onOpenChange={(open) => !open && close()}
      >
        <AnimatePresence>
          {active ? (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild forceMount>
                <motion.div
                  className="fixed inset-0 z-[60] bg-ink/95 backdrop-blur-sm"
                  initial={reduce ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reduce ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
              </Dialog.Overlay>

              <Dialog.Content asChild forceMount aria-label={t('lightbox.label')}>
                <motion.div
                  className="fixed inset-0 z-[60] flex flex-col p-4 sm:p-8"
                  initial={reduce ? false : { opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduce ? undefined : { opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <Dialog.Title className="font-display text-base font-bold tracking-tight text-bone">
                      {pick(active.title, locale)}
                    </Dialog.Title>
                    <div className="flex items-center gap-3">
                      <p className="font-sans text-xs tabular-nums text-muted-dark">
                        {t('lightbox.counter', {
                          current: lightboxIndex! + 1,
                          total: items.length,
                        })}
                      </p>
                      <Dialog.Close asChild>
                        <button
                          type="button"
                          aria-label={t('lightbox.close')}
                          className="inline-flex size-11 items-center justify-center border border-bone/20 text-bone transition-colors hover:border-accent hover:text-accent"
                        >
                          <X aria-hidden="true" className="size-5" />
                        </button>
                      </Dialog.Close>
                    </div>
                  </div>

                  <Dialog.Description className="sr-only">
                    {pick(active.alt, locale)}
                  </Dialog.Description>

                  <div className="relative mt-4 flex min-h-0 flex-1 items-center justify-center">
                    <button
                      type="button"
                      onClick={() => step(-1)}
                      aria-label={t('lightbox.previous')}
                      className="absolute left-0 z-10 inline-flex size-12 items-center justify-center bg-ink-800/80 text-bone transition-colors hover:bg-accent hover:text-white"
                    >
                      <ChevronLeft aria-hidden="true" className="size-6" />
                    </button>

                    <Image
                      key={active.id}
                      src={active.src}
                      alt={pick(active.alt, locale)}
                      width={active.aspect === '3/4' ? 1200 : 1600}
                      height={active.aspect === '3/4' ? 1600 : 1200}
                      sizes="(min-width: 640px) 80vw, 100vw"
                      placeholder={blurFor(active.src) ? 'blur' : 'empty'}
                      blurDataURL={blurFor(active.src)}
                      className="max-h-full w-auto max-w-full object-contain"
                    />

                    <button
                      type="button"
                      onClick={() => step(1)}
                      aria-label={t('lightbox.next')}
                      className="absolute right-0 z-10 inline-flex size-12 items-center justify-center bg-ink-800/80 text-bone transition-colors hover:bg-accent hover:text-white"
                    >
                      <ChevronRight aria-hidden="true" className="size-6" />
                    </button>
                  </div>

                  <p className="mt-4 text-center text-xs text-muted-dark">
                    {common('close')} · Esc
                  </p>
                </motion.div>
              </Dialog.Content>
            </Dialog.Portal>
          ) : null}
        </AnimatePresence>
      </Dialog.Root>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Before / after comparison slider                                            */
/* -------------------------------------------------------------------------- */

function BeforeAfter({
  pair,
  locale,
}: {
  pair: (typeof site.beforeAfter)[number];
  locale: Locale;
}) {
  const t = useTranslations('projects.beforeAfter');
  const [value, setValue] = useState(50);
  const inputId = useId();
  const title = pick(pair.title, locale);

  return (
    <figure className="group">
      <div className="relative aspect-4/3 select-none overflow-hidden border border-bone/10 bg-ink-800">
        {/* After sits underneath, full width */}
        <Image
          src={pair.after.src}
          alt={pick(pair.after.alt, locale)}
          fill
          loading="lazy"
          sizes="(min-width: 1024px) 45vw, 92vw"
          placeholder={blurFor(pair.after.src) ? 'blur' : 'empty'}
          blurDataURL={blurFor(pair.after.src)}
          className="object-cover"
        />

        {/* Before is clipped to the slider position */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - value}% 0 0)` }}
        >
          <Image
            src={pair.before.src}
            alt={pick(pair.before.alt, locale)}
            fill
            loading="lazy"
            sizes="(min-width: 1024px) 45vw, 92vw"
            placeholder={blurFor(pair.before.src) ? 'blur' : 'empty'}
            blurDataURL={blurFor(pair.before.src)}
            className="object-cover"
          />
        </div>

        {/* Labels */}
        <span className="pointer-events-none absolute left-4 top-4 bg-ink/85 px-2.5 py-1 font-sans text-xs font-bold uppercase tracking-widest text-bone">
          {t('before')}
        </span>
        <span className="pointer-events-none absolute right-4 top-4 bg-accent px-2.5 py-1 font-sans text-xs font-bold uppercase tracking-widest text-white">
          {t('after')}
        </span>

        {/* Visible handle — follows the input value */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-accent"
          style={{ left: `${value}%` }}
        >
          <span className="absolute left-1/2 top-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-white shadow-lg ring-4 ring-accent/25">
            <ChevronLeft className="size-4" />
            <ChevronRight className="size-4 -ml-1" />
          </span>
        </div>

        {/*
          A real <input type="range"> stretched over the whole figure. This is
          the entire accessibility story for the widget: keyboard arrows, Home /
          End, screen-reader announcements and touch dragging all come from the
          platform rather than from hand-rolled ARIA.
        */}
        <label htmlFor={inputId} className="sr-only">
          {t('sliderLabel', { title })}
        </label>
        <input
          id={inputId}
          type="range"
          min={0}
          max={100}
          step={1}
          value={value}
          onChange={(event) => setValue(Number(event.target.value))}
          aria-valuetext={t('sliderValueText', { value: 100 - value })}
          className="absolute inset-0 z-20 h-full w-full cursor-ew-resize appearance-none bg-transparent opacity-0"
        />
      </div>

      <figcaption className="mt-4 flex items-baseline justify-between gap-4">
        <span className="font-display text-base font-bold tracking-tight text-bone">
          {title}
        </span>
        <span className="font-sans text-xs text-muted-dark">
          {t('instruction')}
        </span>
      </figcaption>
    </figure>
  );
}
