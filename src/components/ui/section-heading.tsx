import { Reveal } from '@/components/ui/reveal';
import { cn } from '@/lib/utils';

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  tone = 'dark',
  align = 'left',
  id,
  className,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  tone?: 'dark' | 'light';
  align?: 'left' | 'center';
  id?: string;
  className?: string;
}) {
  const isDark = tone === 'dark';

  return (
    <Reveal
      className={cn(
        'max-w-3xl',
        align === 'center' && 'mx-auto text-center',
        className,
      )}
    >
      <p className={cn('eyebrow', isDark ? 'text-accent' : 'text-accent-700')}>
        <span
          aria-hidden="true"
          className={cn('h-px w-8', isDark ? 'bg-accent' : 'bg-accent-700')}
        />
        {eyebrow}
      </p>
      <h2
        id={id}
        className={cn(
          'mt-5 text-3xl font-extrabold leading-[1.05] sm:text-4xl lg:text-5xl',
          isDark ? 'text-bone' : 'text-ink',
        )}
      >
        {title}
      </h2>
      {subtitle ? (
        <p
          className={cn(
            'mt-5 text-base leading-relaxed sm:text-lg',
            isDark ? 'text-muted-dark' : 'text-muted-light',
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </Reveal>
  );
}
