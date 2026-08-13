import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { routing, type Locale } from '@/i18n/routing';
import { site, siteUrl } from './site';

/**
 * Per-locale metadata with full hreflang alternates.
 *
 * `alternates.languages` gets an entry for every locale plus `x-default`.
 * x-default points at French: it is the default locale, and for a Quebec
 * contractor it is the correct landing page for an unmatched language.
 */
export async function buildMetadata(locale: Locale): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'metadata' });
  const base = siteUrl();

  const languages: Record<string, string> = Object.fromEntries(
    routing.locales.map((l) => [l, `${base}/${l}`]),
  );
  languages['x-default'] = `${base}/${routing.defaultLocale}`;

  return {
    metadataBase: new URL(base),
    title: {
      default: t('title'),
      template: t('titleTemplate', { page: '%s' }),
    },
    description: t('description'),
    keywords: t('keywords')
      .split(',')
      .map((k) => k.trim()),
    applicationName: site.name,
    authors: [{ name: site.name }],
    creator: site.name,
    publisher: site.legalName,
    alternates: {
      canonical: `${base}/${locale}`,
      languages,
    },
    openGraph: {
      type: 'website',
      siteName: site.name,
      title: t('title'),
      description: t('description'),
      url: `${base}/${locale}`,
      locale: locale === 'fr' ? 'fr_CA' : 'en_CA',
      alternateLocale: locale === 'fr' ? ['en_CA'] : ['fr_CA'],
      // The image itself is declared by app/[locale]/opengraph-image.tsx, which
      // renders it per-locale with the real site typography.
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    formatDetection: {
      // The phone number is deliberately a real tel: link everywhere it appears;
      // let the browser leave the rest of the copy alone.
      telephone: false,
    },
    icons: {
      icon: '/icon.png',
      apple: '/apple-icon.png',
    },
    manifest: '/manifest.webmanifest',
  };
}
