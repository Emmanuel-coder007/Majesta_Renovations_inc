import { getTranslations } from 'next-intl/server';

import { RevealItem, RevealList } from '@/components/ui/reveal';
import { SectionHeading } from '@/components/ui/section-heading';
import type { Locale } from '@/i18n/routing';
import { getIcon } from '@/lib/icons';
import { site, t as pick } from '@/lib/site';

export async function Process({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'process' });

  return (
    <section
      id="process"
      aria-labelledby="process-title"
      className="grain relative scroll-mt-24 overflow-hidden bg-ink py-20 lg:py-28"
    >
      {/* Subway-tile texture as a section divider, very low contrast */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[url('/images/texture-subway-tile.webp')] bg-cover bg-center opacity-[0.06]"
      />

      <div className="shell relative">
        <SectionHeading
          id="process-title"
          eyebrow={t('eyebrow')}
          title={t('title')}
          subtitle={t('subtitle')}
        />

        <RevealList
          as="ol"
          className="mt-16 grid gap-px bg-bone/10 md:grid-cols-2 lg:grid-cols-5"
        >
          {site.process.map((stepItem, index) => {
            const Icon = getIcon(stepItem.icon);
            return (
              <RevealItem key={stepItem.slug} className="group relative bg-ink p-7 lg:p-6 xl:p-8">
                <div className="flex items-center justify-between">
                  <span className="font-display text-5xl font-extrabold leading-none tracking-tighter text-ink-600 transition-colors duration-300 group-hover:text-accent">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <Icon
                    aria-hidden="true"
                    className="size-6 text-accent"
                    strokeWidth={1.5}
                  />
                </div>

                <h3 className="mt-8 text-xl font-bold text-bone">
                  <span className="sr-only">
                    {t('stepLabel', { number: index + 1 })}
                    {' — '}
                  </span>
                  {pick(stepItem.title, locale)}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-dark">
                  {pick(stepItem.body, locale)}
                </p>

                {/* Connector rule, desktop only */}
                <span
                  aria-hidden="true"
                  className="absolute right-0 top-12 hidden h-px w-6 bg-accent/40 lg:block"
                />
              </RevealItem>
            );
          })}
        </RevealList>
      </div>
    </section>
  );
}
