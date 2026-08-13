import type { Locale } from '@/i18n/routing';
import {
  addressOneLine,
  hasBusinessHours,
  hasRealEmail,
  phoneE164,
  site,
  siteUrl,
  t,
} from './site';

/**
 * `GeneralContractor` JSON-LD.
 *
 * Rule for this file: **only verified fields go in.** Structured data is what
 * search engines and assistants read literally and repeat to people. An invented
 * opening hour or email here does more damage than the same invention in body
 * copy, because it gets surfaced without the surrounding context. Anything in
 * content/MISSING.md is omitted, not guessed.
 */
export function buildOpeningHours() {
  if (!hasBusinessHours()) return undefined;
  return site.unverified.hours!.map((slot) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: slot.days,
    opens: slot.opens,
    closes: slot.closes,
  }));
}

export function generalContractorSchema(locale: Locale) {
  const base = siteUrl();
  const url = `${base}/${locale}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'GeneralContractor',
    '@id': `${base}/#organization`,
    name: site.name,
    legalName: site.legalName,
    url,
    telephone: phoneE164,
    ...(hasRealEmail() ? { email: site.unverified.email } : {}),
    image: `${base}/images/hero-kitchen.webp`,
    logo: `${base}/icons/icon-512.png`,
    priceRange: '$$',
    currenciesAccepted: 'CAD',
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      addressRegion: site.address.province,
      postalCode: site.address.postalCode,
      addressCountry: 'CA',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: site.geo.latitude,
      longitude: site.geo.longitude,
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: site.rating.value,
      reviewCount: site.rating.count,
      bestRating: 5,
      worstRating: 1,
    },
    // The five verified service regions, exactly as recorded.
    areaServed: site.serviceAreas.map((area) => ({
      '@type': 'AdministrativeArea',
      name: area,
    })),
    hasCredential: {
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'license',
      name: `${site.license.type} ${site.license.number}`,
      recognizedBy: {
        '@type': 'GovernmentOrganization',
        name: 'Régie du bâtiment du Québec',
      },
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: locale === 'fr' ? 'Services de rénovation' : 'Renovation services',
      itemListElement: site.serviceCatalog.map((service) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: t(service.name, locale),
          description: t(service.blurb, locale),
        },
      })),
    },
    ...(buildOpeningHours()
      ? { openingHoursSpecification: buildOpeningHours() }
      : {}),
    ...(site.unverified.social.length > 0
      ? { sameAs: site.unverified.social.map((s) => s.url) }
      : {}),
  };
}

export function websiteSchema(locale: Locale) {
  const base = siteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${base}/#website`,
    url: `${base}/${locale}`,
    name: site.name,
    inLanguage: locale === 'fr' ? 'fr-CA' : 'en-CA',
    publisher: { '@id': `${base}/#organization` },
  };
}

export function breadcrumbSchema(locale: Locale, label: string) {
  const base = siteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: label,
        item: `${base}/${locale}`,
      },
    ],
  };
}

/** Convenience: the full graph this site emits, as one array. */
export function siteSchemaGraph(locale: Locale, homeLabel: string) {
  return [
    generalContractorSchema(locale),
    websiteSchema(locale),
    breadcrumbSchema(locale, homeLabel),
  ];
}

/**
 * Serialise for a `<script type="application/ld+json">`. Escaping `<` prevents a
 * `</script>` sequence inside any data field from breaking out of the tag.
 */
export function jsonLdString(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export const ADDRESS_ONE_LINE = addressOneLine;
