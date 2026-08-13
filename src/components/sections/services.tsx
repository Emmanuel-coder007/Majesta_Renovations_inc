import { ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

import { Button } from '@/components/ui/button';
import { RevealItem, RevealList } from '@/components/ui/reveal';
import { SectionHeading } from '@/components/ui/section-heading';
import type { Locale } from '@/i18n/routing';
import { getIcon } from '@/lib/icons';
import { blurFor, site, t as pick } from '@/lib/site';

export async function Services({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'services' });

  return (
    <section
      id="services"
      aria-labelledby="services-title"
      className="relative scroll-mt-24 bg-bone py-20 lg:py-28"
    >
      <div className="shell">
        <SectionHeading
          id="services-title"
          eyebrow={t('eyebrow')}
          title={t('title')}
          subtitle={t('subtitle')}
          tone="light"
        />

        <RevealList className="mt-14 grid gap-6 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3">
          {site.serviceCatalog.map((service) => {
            const Icon = getIcon(service.icon);
            return (
              <RevealItem key={service.slug}>
                <article className="group flex h-full flex-col border border-ink/10 bg-white transition-[transform,box-shadow,border-color] duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-1.5 hover:border-ink/25 hover:shadow-[0_18px_50px_-24px_rgb(11_11_12/0.45)]">
                  <div className="relative aspect-4/3 overflow-hidden bg-bone-200">
                    <Image
                      src={service.image}
                      alt={pick(service.alt, locale)}
                      fill
                      loading="lazy"
                      sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
                      placeholder={blurFor(service.image) ? 'blur' : 'empty'}
                      blurDataURL={blurFor(service.image)}
                      className="object-cover transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-105"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute bottom-0 left-0 flex size-12 items-center justify-center bg-accent text-white"
                    >
                      <Icon className="size-5" strokeWidth={1.75} />
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="text-lg font-bold leading-snug text-ink">
                      {pick(service.name, locale)}
                    </h3>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-light">
                      {pick(service.blurb, locale)}
                    </p>
                    <a
                      href="#contact"
                      className="mt-5 inline-flex items-center gap-1.5 self-start font-sans text-sm font-semibold text-ink transition-colors duration-200 hover:text-accent-700"
                    >
                      {t('cardCta')}
                      <ArrowUpRight
                        aria-hidden="true"
                        className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                      <span className="sr-only">
                        {' — '}
                        {pick(service.name, locale)}
                      </span>
                    </a>
                  </div>
                </article>
              </RevealItem>
            );
          })}
        </RevealList>

        <div className="mt-14 flex justify-center">
          <Button asChild size="lg" variant="outlineLight">
            <a href="#contact">{t('cta')}</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
