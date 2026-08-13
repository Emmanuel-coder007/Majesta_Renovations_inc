import { ArrowUp, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Logo } from '@/components/brand/logo';
import type { Locale } from '@/i18n/routing';
import {
  addressOneLine,
  hasRealEmail,
  mapsUrl,
  phoneHref,
  site,
  t as pick,
} from '@/lib/site';

const NAV_SECTIONS = [
  'services',
  'projects',
  'about',
  'process',
  'testimonials',
  'areas',
  'contact',
] as const;

export async function SiteFooter({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'footer' });
  const nav = await getTranslations({ locale, namespace: 'nav' });
  const contact = await getTranslations({ locale, namespace: 'contact' });

  const year = new Date().getFullYear();

  return (
    <footer className="grain border-t border-bone/10 bg-ink-900">
      <div className="shell py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Brand + licence */}
          <div className="lg:col-span-4">
            <Logo />
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-muted-dark">
              {t('tagline')}
            </p>

            <div className="mt-8 inline-flex items-start gap-3 border border-accent/30 bg-accent/5 px-4 py-3">
              <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-accent" />
              <div>
                <p className="font-display text-sm font-bold tracking-tight text-bone">
                  {t('licenceLine', { number: site.license.number })}
                </p>
                <p className="mt-0.5 text-xs text-muted-dark">
                  {t('legalName', { name: site.legalName })}
                </p>
              </div>
            </div>
          </div>

          {/* Navigate */}
          <nav className="lg:col-span-2" aria-label={t('navTitle')}>
            <h2 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-bone">
              {t('navTitle')}
            </h2>
            <ul className="mt-5 space-y-3">
              {NAV_SECTIONS.map((section) => (
                <li key={section}>
                  <a
                    href={`#${section}`}
                    className="text-sm text-muted-dark transition-colors duration-200 hover:text-accent"
                  >
                    {nav(section)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Services */}
          <div className="lg:col-span-3">
            <h2 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-bone">
              {t('servicesTitle')}
            </h2>
            <ul className="mt-5 space-y-3">
              {site.serviceCatalog.map((service) => (
                <li key={service.slug}>
                  <a
                    href="#services"
                    className="text-sm text-muted-dark transition-colors duration-200 hover:text-accent"
                  >
                    {pick(service.name, locale)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact + areas */}
          <div className="lg:col-span-3">
            <h2 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-bone">
              {t('contactTitle')}
            </h2>
            <ul className="mt-5 space-y-4">
              <li>
                <a
                  href={phoneHref}
                  className="inline-flex items-start gap-3 text-sm text-muted-dark transition-colors duration-200 hover:text-accent"
                >
                  <Phone aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent" />
                  <span>{site.phone}</span>
                </a>
              </li>
              <li>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-start gap-3 text-sm text-muted-dark transition-colors duration-200 hover:text-accent"
                >
                  <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent" />
                  <span>{addressOneLine}</span>
                </a>
              </li>
              {hasRealEmail() ? (
                <li>
                  <a
                    href={`mailto:${site.unverified.email}`}
                    className="text-sm text-muted-dark transition-colors duration-200 hover:text-accent"
                  >
                    {site.unverified.email}
                  </a>
                </li>
              ) : (
                /* No email address is published — see content/MISSING.md § 1.
                   A visible TODO beats a fabricated mailto:. */
                <li className="inline-flex items-center gap-2 text-sm text-muted-dark">
                  <span className="border border-accent/40 px-1.5 py-0.5 font-sans text-[0.625rem] font-bold uppercase tracking-widest text-accent">
                    {contact('details.emailLabel')} · TODO
                  </span>
                </li>
              )}
            </ul>

            <h2 className="mt-9 font-display text-xs font-bold uppercase tracking-[0.2em] text-bone">
              {t('areasTitle')}
            </h2>
            <ul className="mt-5 space-y-2">
              {site.serviceAreaDetail.map((area) => (
                <li key={area.slug} className="text-sm text-muted-dark">
                  {pick(area.name, locale)}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-6 border-t border-bone/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs text-muted-dark">
              {t('rights', { year, name: site.legalName })}
            </p>
            {/* Removed once real photography replaces the generated set. */}
            <p className="text-xs text-ink-400">{t('placeholderNotice')}</p>
          </div>

          <a
            href="#top"
            className="inline-flex items-center gap-2 self-start border border-bone/20 px-4 py-2 font-sans text-xs font-semibold uppercase tracking-widest text-bone transition-colors duration-200 hover:border-accent hover:text-accent sm:self-auto"
          >
            {t('backToTop')}
            <ArrowUp aria-hidden="true" className="size-3.5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
