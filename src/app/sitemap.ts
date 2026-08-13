import type { MetadataRoute } from 'next';

import { routing } from '@/i18n/routing';
import { siteUrl } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();

  // Every locale entry lists all locales as alternates, which is what tells
  // search engines these are translations of one page rather than duplicates.
  const languages = Object.fromEntries(
    routing.locales.map((locale) => [locale, `${base}/${locale}`]),
  );

  return routing.locales.map((locale) => ({
    url: `${base}/${locale}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: locale === routing.defaultLocale ? 1 : 0.9,
    alternates: { languages },
  }));
}
