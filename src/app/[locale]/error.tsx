'use client';

import { RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { site } from '@/lib/site';

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('error');

  useEffect(() => {
    // Swap for a real error reporter (Sentry, etc.) when one is wired up.
    console.error(error);
  }, [error]);

  return (
    <div className="grain flex min-h-[70svh] items-center bg-ink py-32">
      <div className="shell">
        <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.05] text-bone sm:text-5xl">
          {t('title')}
        </h1>
        <p className="mt-5 max-w-xl leading-relaxed text-muted-dark">
          {t('body', { phone: site.phone })}
        </p>
        <Button size="lg" className="mt-10" onClick={reset}>
          <RotateCcw aria-hidden="true" />
          {t('retry')}
        </Button>
      </div>
    </div>
  );
}
