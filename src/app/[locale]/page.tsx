import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

import { About } from '@/components/sections/about';
import { Contact } from '@/components/sections/contact';
import { CtaBand } from '@/components/sections/cta-band';
import { Hero } from '@/components/sections/hero';
import { Process } from '@/components/sections/process';
import { Projects } from '@/components/sections/projects';
import { ServiceAreas } from '@/components/sections/service-areas';
import { Services } from '@/components/sections/services';
import { Testimonials } from '@/components/sections/testimonials';
import { routing, type Locale } from '@/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const l = locale as Locale;

  return (
    <>
      <Hero locale={l} />
      <Services locale={l} />
      <Projects locale={l} />
      <About locale={l} />
      <Process locale={l} />
      <Testimonials locale={l} />
      <ServiceAreas locale={l} />
      <CtaBand locale={l} />
      <Contact locale={l} />
    </>
  );
}
