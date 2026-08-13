import { ExternalLink, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

import { Counter } from '@/components/ui/counter';
import { Reveal } from '@/components/ui/reveal';
import { SectionHeading } from '@/components/ui/section-heading';
import type { Locale } from '@/i18n/routing';
import { blurFor, rbqRegisterUrl, site } from '@/lib/site';

const ABOUT_IMAGE = '/images/hero-renovation-in-progress.webp';

export async function About({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'about' });

  const verifiedDate = new Intl.DateTimeFormat(
    locale === 'fr' ? 'fr-CA' : 'en-CA',
    { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' },
  ).format(new Date(`${site.license.verified}T00:00:00Z`));

  /*
   * Only sourced numbers appear here. There is deliberately no "years in
   * business" and no "projects completed" counter — neither figure was
   * verifiable. See content/MISSING.md § 6.
   */
  const stats = [
    {
      key: 'rating',
      value: site.rating.value,
      decimals: 1,
      suffix: '',
      label: t('stats.ratingLabel'),
    },
    {
      key: 'reviews',
      value: site.rating.count,
      decimals: 0,
      suffix: '',
      label: t('stats.reviewsLabel'),
    },
    {
      key: 'services',
      value: site.serviceCatalog.length,
      decimals: 0,
      suffix: '',
      label: t('stats.servicesLabel'),
    },
    {
      key: 'areas',
      value: site.serviceAreaDetail.length,
      decimals: 0,
      suffix: '',
      label: t('stats.areasLabel'),
    },
  ];

  return (
    <section
      id="about"
      aria-labelledby="about-title"
      className="relative scroll-mt-24 bg-bone py-20 lg:py-28"
    >
      <div className="shell">
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Copy */}
          <div>
            <SectionHeading
              id="about-title"
              eyebrow={t('eyebrow')}
              title={t('title')}
              tone="light"
            />

            <Reveal delay={0.05}>
              <p className="mt-8 text-lg font-medium leading-relaxed text-ink">
                {t('lead')}
              </p>
              <p className="mt-5 leading-relaxed text-muted-light">{t('body1')}</p>
              <p className="mt-4 leading-relaxed text-muted-light">{t('body2')}</p>
            </Reveal>

            {/* RBQ licence badge */}
            <Reveal delay={0.1}>
              <div className="mt-10 border-l-4 border-accent bg-white p-6 shadow-[0_12px_40px_-28px_rgb(11_11_12/0.5)]">
                <div className="flex items-start gap-4">
                  <span className="flex size-12 shrink-0 items-center justify-center bg-accent text-white">
                    <ShieldCheck aria-hidden="true" className="size-6" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-muted-light">
                      {t('licenceBadge.label')}
                    </p>
                    <p className="mt-1 font-display text-2xl font-extrabold tracking-tight text-ink">
                      {site.license.number}
                    </p>
                    <p className="mt-1 text-xs text-muted-light">
                      {t('licenceBadge.verified', { date: verifiedDate })}
                    </p>
                    <a
                      href={rbqRegisterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 font-sans text-sm font-semibold text-accent-700 underline underline-offset-4 hover:text-accent"
                    >
                      {t('licenceBadge.verify')}
                      <ExternalLink aria-hidden="true" className="size-3.5" />
                    </a>
                    <p className="mt-3 text-xs leading-relaxed text-muted-light">
                      {t('licenceBadge.note')}
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Image + stats */}
          <Reveal delay={0.08} className="lg:sticky lg:top-28">
            <div className="relative aspect-4/3 overflow-hidden border border-ink/10 bg-bone-200">
              <Image
                src={ABOUT_IMAGE}
                alt={t('imageAlt')}
                fill
                loading="lazy"
                sizes="(min-width: 1024px) 45vw, 92vw"
                placeholder={blurFor(ABOUT_IMAGE) ? 'blur' : 'empty'}
                blurDataURL={blurFor(ABOUT_IMAGE)}
                className="object-cover"
              />
            </div>

            {/* dt precedes dd in the DOM for semantics; `order` flips the
                visual arrangement so the number reads first. */}
            <dl className="mt-px grid grid-cols-2 gap-px bg-ink/10">
              {stats.map((stat) => (
                <div key={stat.key} className="flex flex-col bg-bone p-6">
                  <dt className="order-2 mt-2 font-sans text-xs font-semibold uppercase tracking-[0.14em] text-muted-light">
                    {stat.label}
                  </dt>
                  <dd className="order-1 font-display text-4xl font-extrabold tracking-tight text-ink">
                    <Counter
                      value={stat.value}
                      decimals={stat.decimals}
                      suffix={stat.suffix}
                      locale={locale}
                    />
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
