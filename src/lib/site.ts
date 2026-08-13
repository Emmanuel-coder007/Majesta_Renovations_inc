import rawSiteData from '@content/site-data.json';
import rawBlurMap from '@content/image-blur.json';
import type { Locale } from '@/i18n/routing';

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

/** A string that exists in both locales. */
export type Localized = { en: string; fr: string };
/** A string that may be missing in one locale (real reviews often are). */
export type LocalizedNullable = { en: string | null; fr: string | null };

export type ServiceCategory =
  | 'general'
  | 'kitchen'
  | 'bathroom'
  | 'basement'
  | 'addition'
  | 'commercial';

export type Service = {
  slug: string;
  category: ServiceCategory;
  icon: string;
  image: string;
  name: Localized;
  blurb: Localized;
  alt: Localized;
};

export type ServiceArea = {
  slug: string;
  name: Localized;
  range: Localized;
  boroughs: string[];
};

export type ProcessStep = {
  slug: string;
  icon: string;
  title: Localized;
  body: Localized;
};

export type GalleryItem = {
  id: string;
  category: ServiceCategory;
  src: string;
  aspect: '4/3' | '3/4';
  title: Localized;
  alt: Localized;
};

export type BeforeAfterPair = {
  id: string;
  category: ServiceCategory;
  title: Localized;
  before: { src: string; alt: Localized };
  after: { src: string; alt: Localized };
};

export type Testimonial = {
  id: string;
  __PLACEHOLDER__?: boolean;
  rating: number;
  author: string | null;
  location: string | null;
  date: string | null;
  quote: LocalizedNullable;
};

export type Option = { value: string; label: Localized };

export type SiteData = {
  name: string;
  legalName: string;
  phone: string;
  address: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  license: { type: string; number: string; verified: string };
  rating: { value: number; count: number; source: string };
  responseTime: string;
  services: string[];
  serviceAreas: string[];
  unverified: {
    email: string;
    hours: null | Array<{ days: string[]; opens: string; closes: string }>;
    foundedYear: number | null;
    team: null | Array<{ name: string; role: string }>;
    social: Array<{ platform: string; url: string }>;
  };
  geo: { latitude: number; longitude: number; mapQuery: string };
  serviceCatalog: Service[];
  serviceAreaDetail: ServiceArea[];
  process: ProcessStep[];
  gallery: GalleryItem[];
  beforeAfter: BeforeAfterPair[];
  testimonials: Testimonial[];
  budgetRanges: Option[];
  contactMethods: Option[];
};

export const site = rawSiteData as unknown as SiteData;

/* -------------------------------------------------------------------------- */
/* Locale helpers                                                              */
/* -------------------------------------------------------------------------- */

/** Pick the value for a locale from a `{ en, fr }` pair. */
export function t(value: Localized, locale: Locale): string {
  return value[locale];
}

/**
 * Same, for values that may be missing in one locale. Falls back to the other
 * locale rather than rendering nothing — used for review quotes, which often
 * only exist in the language the customer wrote them in.
 */
export function tFallback(
  value: LocalizedNullable,
  locale: Locale,
): { text: string; isFallback: boolean } | null {
  const preferred = value[locale];
  if (preferred) return { text: preferred, isFallback: false };
  const other = locale === 'fr' ? value.en : value.fr;
  if (other) return { text: other, isFallback: true };
  return null;
}

/* -------------------------------------------------------------------------- */
/* Unverified-data guards                                                      */
/* -------------------------------------------------------------------------- */

/**
 * No email address is published for Majesta. Every consumer checks this rather
 * than rendering a `mailto:` to a made-up address. See content/MISSING.md § 1.
 */
export const TODO_EMAIL = 'TODO_EMAIL';

export function hasRealEmail(): boolean {
  const email = site.unverified.email;
  return Boolean(email) && email !== TODO_EMAIL && email.includes('@');
}

/** Business hours are unknown — see content/MISSING.md § 2. */
export function hasBusinessHours(): boolean {
  return Array.isArray(site.unverified.hours) && site.unverified.hours.length > 0;
}

/** A testimonial with real, attributable text. See content/MISSING.md § 3. */
export function isRealTestimonial(review: Testimonial): boolean {
  return (
    review.__PLACEHOLDER__ !== true &&
    Boolean(review.author) &&
    Boolean(review.quote.fr || review.quote.en)
  );
}

export function hasRealTestimonials(): boolean {
  return site.testimonials.some(isRealTestimonial);
}

/* -------------------------------------------------------------------------- */
/* Formatting                                                                  */
/* -------------------------------------------------------------------------- */

/** `(438) 886-1787` → `+14388861787`, for `tel:` links and JSON-LD. */
export const phoneE164 = `+1${site.phone.replace(/\D/g, '')}`;
export const phoneHref = `tel:${phoneE164}`;

export const addressOneLine = [
  site.address.street,
  site.address.city,
  `${site.address.province} ${site.address.postalCode}`,
].join(', ');

export const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  site.geo.mapQuery,
)}`;

export const mapsEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(
  site.geo.mapQuery,
)}&output=embed`;

export const rbqRegisterUrl =
  'https://www.rbq.gouv.qc.ca/citoyen/trouver-un-professionnel-titulaire-dune-licence/';

/** Canonical origin. Set NEXT_PUBLIC_SITE_URL in production. */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(
    /\/+$/,
    '',
  );
}

/* -------------------------------------------------------------------------- */
/* Images                                                                      */
/* -------------------------------------------------------------------------- */

const blurMap = rawBlurMap as Record<string, string>;

/**
 * LQIP for `next/image placeholder="blur"`. Generated alongside the images by
 * `npm run images`. Returns undefined for anything not in the map so a missing
 * entry degrades to no placeholder rather than throwing.
 */
export function blurFor(src: string): string | undefined {
  return blurMap[src];
}

/* -------------------------------------------------------------------------- */
/* Drift guard                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * `services` is the verified record; `serviceCatalog` is the presentation layer
 * built on top of it. If someone edits one and not the other, the site would
 * quietly start advertising a service list that no longer matches what was
 * verified against the RBQ listing. Fail the build instead.
 *
 * Runs at module load, which happens during `next build`.
 */
function assertServiceCatalogMatchesVerifiedList(): void {
  const verified = site.services;
  const catalog = site.serviceCatalog.map((s) => s.name.en);

  if (verified.length !== catalog.length) {
    throw new Error(
      `site-data.json: services (${verified.length}) and serviceCatalog (${catalog.length}) are different lengths. ` +
        'Both must describe exactly the 13 verified RBQ service categories.',
    );
  }

  const missing = verified.filter((name) => !catalog.includes(name));
  if (missing.length > 0) {
    throw new Error(
      'site-data.json: these verified service names have no matching serviceCatalog entry ' +
        `(name.en must match character for character): ${missing.join(' | ')}`,
    );
  }
}

assertServiceCatalogMatchesVerifiedList();
