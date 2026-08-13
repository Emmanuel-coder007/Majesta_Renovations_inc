import { ArrowLeft, Phone } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { phoneHref, site } from '@/lib/site';

export default function LocaleNotFound() {
  const t = useTranslations('notFound');

  return (
    <div className="grain flex min-h-[70svh] items-center bg-ink py-32">
      <div className="shell">
        <p className="eyebrow text-accent">
          <span aria-hidden="true" className="h-px w-8 bg-accent" />
          404
        </p>
        <h1 className="mt-6 max-w-2xl text-4xl font-extrabold leading-[1.05] text-bone sm:text-5xl lg:text-6xl">
          {t('title')}
        </h1>
        <p className="mt-5 max-w-xl leading-relaxed text-muted-dark">{t('body')}</p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/">
              <ArrowLeft aria-hidden="true" />
              {t('cta')}
            </Link>
          </Button>
          <Button asChild size="lg" variant="outlineDark">
            <a href={phoneHref}>
              <Phone aria-hidden="true" />
              {site.phone}
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
