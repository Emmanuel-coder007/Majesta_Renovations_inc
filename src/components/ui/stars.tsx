import { Star } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Star rating. The visual stars are `aria-hidden`; the accessible name comes
 * from the `label` prop, already localised and formatted by the caller — so a
 * screen reader hears "5 out of 5 stars", not "star star star star star".
 */
export function Stars({
  value,
  label,
  className,
  size = 'md',
}: {
  value: number;
  label: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizes = { sm: 'size-3.5', md: 'size-4', lg: 'size-5' } as const;
  const rounded = Math.round(value);

  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} role="img" aria-label={label}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          aria-hidden="true"
          className={cn(
            sizes[size],
            i < rounded ? 'fill-accent text-accent' : 'fill-none text-ink-500',
          )}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}
