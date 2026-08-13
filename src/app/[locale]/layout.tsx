import type { Metadata } from 'next';
import { Archivo, Inter } from 'next/font/google';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';

import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { Toaster } from '@/components/ui/toaster';
import { routing, type Locale } from '@/i18n/routing';
import { buildMetadata } from '@/lib/metadata';
import { jsonLdString, siteSchemaGraph } from '@/lib/structured-data';

import '../globals.css';

const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-archivo',
  display: 'swap',
  weight: ['500', '600', '700', '800'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  return buildMetadata(locale);
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Opts this subtree into static rendering.
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'header' });
  const nav = await getTranslations({ locale, namespace: 'nav' });
  const schema = siteSchemaGraph(locale as Locale, nav('contact'));

  return (
    <html
      lang={locale === 'fr' ? 'fr-CA' : 'en-CA'}
      className={`${archivo.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-ink text-bone antialiased">
        <a href="#main" className="sr-focusable z-[100] m-4 bg-accent px-4 py-3 font-semibold text-white">
          {t('skipToContent')}
        </a>

        <NextIntlClientProvider>
          <SiteHeader locale={locale as Locale} />
          <main id="main">{children}</main>
          <SiteFooter locale={locale as Locale} />
          <Toaster />
        </NextIntlClientProvider>

        <script
          type="application/ld+json"
          // Built entirely from verified fields in content/site-data.json.
          dangerouslySetInnerHTML={{ __html: jsonLdString(schema) }}
        />
      </body>
    </html>
  );
}
