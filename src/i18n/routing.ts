import { defineRouting } from 'next-intl/routing';

/**
 * French is the default locale and is served from `/fr`, not from `/`.
 *
 * This is not a stylistic preference. Majesta operates in Quebec, where the
 * Charter of the French Language governs commercial communication — French must
 * be at least as prominent as any other language. `localePrefix: 'always'` keeps
 * both locales explicit in the URL, which also keeps the hreflang alternates
 * unambiguous for search engines.
 */
export const routing = defineRouting({
  locales: ['fr', 'en'],
  defaultLocale: 'fr',
  localePrefix: 'always',
});

export type Locale = (typeof routing.locales)[number];
