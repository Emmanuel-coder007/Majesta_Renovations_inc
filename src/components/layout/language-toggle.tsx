'use client';

import { useParams } from 'next/navigation';
import { useTransition } from 'react';

import { usePathname, useRouter } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { cn } from '@/lib/utils';

/**
 * FR / EN toggle.
 *
 * Switches locale on the *current* path rather than sending everyone back to
 * the home page. Each option is a real button with `lang` set to its own
 * locale, so a screen reader pronounces "Français" in French even while
 * reading an English page.
 */
export function LanguageToggle({
  locale,
  label,
  className,
  tone = 'dark',
}: {
  locale: Locale;
  label: string;
  className?: string;
  tone?: 'dark' | 'light';
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [isPending, startTransition] = useTransition();

  function switchTo(next: Locale) {
    if (next === locale) return;
    startTransition(() => {
      router.replace(
        // @ts-expect-error -- pathname/params are correlated at runtime; the
        // typed-routes overload cannot express that relationship here.
        { pathname, params },
        { locale: next },
      );
    });
  }

  const isDark = tone === 'dark';

  return (
    <div
      className={cn(
        'inline-flex items-center border',
        isDark ? 'border-bone/20' : 'border-ink/15',
        isPending && 'opacity-60',
        className,
      )}
      role="group"
      aria-label={label}
    >
      {routing.locales.map((option) => {
        const active = option === locale;
        return (
          <button
            key={option}
            type="button"
            lang={option}
            onClick={() => switchTo(option)}
            aria-current={active ? 'true' : undefined}
            disabled={isPending}
            className={cn(
              'px-2.5 py-1.5 font-sans text-xs font-bold uppercase tracking-widest transition-colors duration-200',
              active
                ? 'bg-accent text-white'
                : isDark
                  ? 'text-muted-dark hover:text-bone'
                  : 'text-muted-light hover:text-ink',
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
