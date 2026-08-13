import { ArrowRight, Phone } from 'lucide-react';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/ui/reveal';
import type { Locale } from '@/i18n/routing';
import { blurFor, phoneHref, site } from '@/lib/site';

const CTA_IMAGE = '/images/cta-band.webp';

export async function CtaBand({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'ctaBand' });

  return (
    <section aria-labelledby="cta-band-title" className="relative isolate overflow-hidden">
      <Image
        src={CTA_IMAGE}
        alt={t('imageAlt')}
        fill
        loading="lazy"
        sizes="100vw"
        placeholder={blurFor(CTA_IMAGE) ? 'blur' : 'empty'}
        blurDataURL={blurFor(CTA_IMAGE)}
        className="-z-20 object-cover"
      />
      {/* The band carries body text over the image, so the overlay is heavy
          enough to hold AA contrast at every viewport. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-ink/85" />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/70 to-ink/40"
      />

      <div className="shell py-20 lg:py-28">
        <Reveal className="max-w-2xl">
          <h2
            id="cta-band-title"
            className="text-3xl font-extrabold leading-[1.05] text-bone sm:text-4xl lg:text-5xl"
          >
            {t('title')}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-bone/75 sm:text-lg">
            {t('body')}
          </p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Button asChild size="lg">
              <a href="#contact">
                {t('cta')}
                <ArrowRight aria-hidden="true" />
              </a>
            </Button>
            <p className="flex items-center gap-2 text-sm text-muted-dark">
              <span>{t('or')}</span>
              <a
                href={phoneHref}
                className="inline-flex items-center gap-2 font-sans text-base font-semibold text-bone hover:text-accent"
              >
                <Phone aria-hidden="true" className="size-4 text-accent" />
                {site.phone}
              </a>
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
