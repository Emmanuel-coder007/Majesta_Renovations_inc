'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Menu, Phone, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Logo } from '@/components/brand/logo';
import { LanguageToggle } from '@/components/layout/language-toggle';
import { Button } from '@/components/ui/button';
import type { Locale } from '@/i18n/routing';
import { phoneHref, site } from '@/lib/site';
import { cn } from '@/lib/utils';

const NAV_SECTIONS = [
  'services',
  'projects',
  'about',
  'process',
  'testimonials',
  'areas',
  'contact',
] as const;

export function SiteHeader({ locale }: { locale: Locale }) {
  const t = useTranslations('header');
  const nav = useTranslations('nav');
  const common = useTranslations('common');
  const reduce = useReducedMotion();

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Transparent over the hero, solid once the hero is behind us.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300',
        scrolled
          ? 'border-b border-bone/10 bg-ink/90 backdrop-blur-md'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <div className="shell flex h-20 items-center justify-between gap-4 lg:h-[5.5rem]">
        <a
          href="#top"
          aria-label={t('homeLink')}
          className="shrink-0 rounded-xs"
        >
          <Logo />
        </a>

        <nav aria-label={t('primaryNav')} className="hidden xl:block">
          <ul className="flex items-center gap-1">
            {NAV_SECTIONS.map((section) => (
              <li key={section}>
                <a
                  href={`#${section}`}
                  className="block px-3 py-2 font-sans text-sm font-medium text-bone/80 transition-colors duration-200 hover:text-accent"
                >
                  {nav(section)}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageToggle
            locale={locale}
            label={t('languageLabel')}
            className="hidden sm:inline-flex"
          />

          <a
            href={phoneHref}
            className="hidden items-center gap-2 px-3 py-2 font-sans text-sm font-semibold text-bone transition-colors duration-200 hover:text-accent lg:inline-flex"
          >
            <Phone aria-hidden="true" className="size-4 text-accent" />
            <span>{site.phone}</span>
          </a>

          <Button asChild size="sm" className="hidden sm:inline-flex">
            <a href="#contact">{common('freeQuote')}</a>
          </Button>

          {/* Phone-only: a tap target for the number itself, since the full
              number does not fit next to the menu button at 375px. */}
          <a
            href={phoneHref}
            aria-label={common('callUs', { phone: site.phone })}
            className="inline-flex size-11 items-center justify-center bg-accent text-white sm:hidden"
          >
            <Phone aria-hidden="true" className="size-5" />
          </a>

          <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                aria-label={t('openMenu')}
                className="inline-flex size-11 items-center justify-center border border-bone/20 text-bone transition-colors duration-200 hover:border-bone/50 xl:hidden"
              >
                <Menu aria-hidden="true" className="size-5" />
              </button>
            </Dialog.Trigger>

            <AnimatePresence>
              {menuOpen ? (
                <Dialog.Portal forceMount>
                  <Dialog.Overlay asChild forceMount>
                    <motion.div
                      className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm"
                      initial={reduce ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={reduce ? undefined : { opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    />
                  </Dialog.Overlay>

                  <Dialog.Content asChild forceMount>
                    <motion.div
                      className="grain fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-bone/10 bg-ink-900 shadow-2xl"
                      initial={reduce ? false : { x: '100%' }}
                      animate={{ x: 0 }}
                      exit={reduce ? undefined : { x: '100%' }}
                      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <div className="flex h-20 items-center justify-between border-b border-bone/10 px-5">
                        <Dialog.Title className="font-display text-sm font-bold uppercase tracking-[0.2em] text-muted-dark">
                          {t('menuTitle')}
                        </Dialog.Title>
                        <Dialog.Close asChild>
                          <button
                            type="button"
                            aria-label={t('closeMenu')}
                            className="inline-flex size-11 items-center justify-center border border-bone/20 text-bone"
                          >
                            <X aria-hidden="true" className="size-5" />
                          </button>
                        </Dialog.Close>
                      </div>

                      <Dialog.Description className="sr-only">
                        {t('primaryNav')}
                      </Dialog.Description>

                      <nav
                        aria-label={t('primaryNav')}
                        className="flex-1 overflow-y-auto px-5 py-6"
                      >
                        <ul className="flex flex-col">
                          {NAV_SECTIONS.map((section, i) => (
                            <li key={section}>
                              <a
                                href={`#${section}`}
                                onClick={() => setMenuOpen(false)}
                                className="flex items-baseline gap-4 border-b border-bone/10 py-4 font-display text-2xl font-bold tracking-tight text-bone transition-colors duration-200 hover:text-accent"
                              >
                                <span
                                  aria-hidden="true"
                                  className="font-sans text-xs font-semibold text-accent"
                                >
                                  {String(i + 1).padStart(2, '0')}
                                </span>
                                {nav(section)}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </nav>

                      <div className="space-y-4 border-t border-bone/10 px-5 py-6">
                        <LanguageToggle
                          locale={locale}
                          label={t('languageLabel')}
                          className="w-full justify-center sm:hidden"
                        />
                        <Button asChild size="md" className="w-full">
                          <a href="#contact" onClick={() => setMenuOpen(false)}>
                            {common('freeQuote')}
                          </a>
                        </Button>
                        <Button asChild variant="outlineDark" size="md" className="w-full">
                          <a href={phoneHref}>
                            <Phone aria-hidden="true" />
                            {site.phone}
                          </a>
                        </Button>
                      </div>
                    </motion.div>
                  </Dialog.Content>
                </Dialog.Portal>
              ) : null}
            </AnimatePresence>
          </Dialog.Root>
        </div>
      </div>
    </header>
  );
}
