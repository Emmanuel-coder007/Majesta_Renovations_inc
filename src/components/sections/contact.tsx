import { Clock, ExternalLink, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { ContactForm } from '@/components/sections/contact-form';
import { Reveal } from '@/components/ui/reveal';
import { SectionHeading } from '@/components/ui/section-heading';
import type { Locale } from '@/i18n/routing';
import {
  hasBusinessHours,
  hasRealEmail,
  mapsEmbedUrl,
  mapsUrl,
  phoneHref,
  site,
} from '@/lib/site';

/** Amber chip standing in for a value that could not be verified. */
function TodoChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 border border-accent/40 bg-accent/5 px-2 py-0.5 font-sans text-[0.625rem] font-bold uppercase tracking-[0.16em] text-accent">
      {label}
    </span>
  );
}

export async function Contact({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'contact' });
  const common = await getTranslations({ locale, namespace: 'common' });

  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      className="grain relative scroll-mt-24 bg-ink py-20 lg:py-28"
    >
      <div className="shell">
        <SectionHeading
          id="contact-title"
          eyebrow={t('eyebrow')}
          title={t('title')}
          subtitle={t('subtitle')}
        />

        <div className="mt-14 grid gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Form */}
          <Reveal className="lg:col-span-7">
            <ContactForm locale={locale} />
          </Reveal>

          {/* Details */}
          <Reveal delay={0.08} className="lg:col-span-5">
            <div className="border border-bone/10 bg-ink-900 p-6 sm:p-8">
              <h3 className="font-display text-xl font-bold tracking-tight text-bone">
                {t('details.title')}
              </h3>

              <dl className="mt-7 space-y-7">
                {/* Phone */}
                <div className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center border border-accent/30 text-accent">
                    <Phone aria-hidden="true" className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <dt className="font-sans text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-ink-400">
                      {t('details.phoneLabel')}
                    </dt>
                    <dd className="mt-1">
                      <a
                        href={phoneHref}
                        className="font-display text-lg font-bold tracking-tight text-bone hover:text-accent"
                      >
                        {site.phone}
                      </a>
                      <p className="mt-0.5 text-xs text-muted-dark">
                        {t('details.phoneNote')}
                      </p>
                    </dd>
                  </div>
                </div>

                {/* Email — unverified */}
                <div className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center border border-accent/30 text-accent">
                    <Mail aria-hidden="true" className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <dt className="font-sans text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-ink-400">
                      {t('details.emailLabel')}
                    </dt>
                    <dd className="mt-1">
                      {hasRealEmail() ? (
                        <a
                          href={`mailto:${site.unverified.email}`}
                          className="text-sm text-bone hover:text-accent"
                        >
                          {site.unverified.email}
                        </a>
                      ) : (
                        /* No published address — content/MISSING.md § 1. */
                        <>
                          <TodoChip label={common('todo')} />
                          <p className="mt-1.5 text-xs text-muted-dark">
                            {t('details.emailTodo')}
                          </p>
                        </>
                      )}
                    </dd>
                  </div>
                </div>

                {/* Address */}
                <div className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center border border-accent/30 text-accent">
                    <MapPin aria-hidden="true" className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <dt className="font-sans text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-ink-400">
                      {t('details.addressLabel')}
                    </dt>
                    <dd className="mt-1">
                      <address className="not-italic text-sm leading-relaxed text-bone">
                        {site.address.street}
                        <br />
                        {site.address.city}, {site.address.province}{' '}
                        {site.address.postalCode}
                      </address>
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 font-sans text-sm font-semibold text-accent hover:text-accent-300"
                      >
                        {t('details.directions')}
                        <ExternalLink aria-hidden="true" className="size-3.5" />
                      </a>
                    </dd>
                  </div>
                </div>

                {/* Hours — unverified */}
                <div className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center border border-accent/30 text-accent">
                    <Clock aria-hidden="true" className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <dt className="font-sans text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-ink-400">
                      {t('details.hoursLabel')}
                    </dt>
                    <dd className="mt-1">
                      {hasBusinessHours() ? (
                        <ul className="space-y-1 text-sm text-bone">
                          {site.unverified.hours!.map((slot) => (
                            <li key={slot.days.join('-')}>
                              {slot.days.join(', ')}: {slot.opens}–{slot.closes}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        /* Hours unknown — content/MISSING.md § 2. Showing a
                           guessed opening time would send someone to a locked
                           door, so the gap is shown instead. */
                        <>
                          <TodoChip label={common('todo')} />
                          <p className="mt-1.5 text-xs text-muted-dark">
                            {t('details.hoursTodo')}
                          </p>
                        </>
                      )}
                    </dd>
                  </div>
                </div>

                {/* Licence */}
                <div className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center border border-accent/30 text-accent">
                    <ShieldCheck aria-hidden="true" className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <dt className="font-sans text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-ink-400">
                      {t('details.licenceLabel')}
                    </dt>
                    <dd className="mt-1 font-display text-lg font-bold tracking-tight text-bone">
                      {site.license.number}
                    </dd>
                  </div>
                </div>
              </dl>
            </div>

            {/* Map */}
            <div className="mt-6 border border-bone/10 bg-ink-800">
              <iframe
                title={t('details.mapTitle')}
                src={mapsEmbedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="block aspect-4/3 w-full border-0 grayscale-[0.35] contrast-[1.05]"
              />
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 border-t border-bone/10 px-4 py-3 font-sans text-sm text-muted-dark transition-colors hover:text-accent"
              >
                {t('details.mapFallback')}
                <ExternalLink aria-hidden="true" className="size-3.5 shrink-0" />
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
