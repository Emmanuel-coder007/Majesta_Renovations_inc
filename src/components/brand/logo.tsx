import { cn } from '@/lib/utils';

/**
 * Original wordmark for Majesta Renovations. No existing brand assets were
 * found for the company — see content/MISSING.md § 4. If real ones turn up,
 * they replace this.
 *
 * The mark is an angular "M" whose centre notch reads as a roofline. Drawn as a
 * path rather than set in a font so it renders identically everywhere,
 * including in the favicon raster produced by scripts/generate-images.mjs.
 */

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
      className={cn('size-9', className)}
    >
      <path
        d="M 18 80 L 18 24 L 50 56 L 82 24 L 82 80"
        fill="none"
        stroke="currentColor"
        strokeWidth="12"
        strokeLinejoin="miter"
      />
      <rect x="18" y="86" width="64" height="6" fill="currentColor" opacity="0.55" />
    </svg>
  );
}

export function Logo({
  className,
  tone = 'dark',
  showWordmark = true,
}: {
  className?: string;
  /** `dark` = placed on the ink surface. `light` = placed on bone. */
  tone?: 'dark' | 'light';
  showWordmark?: boolean;
}) {
  const textColor = tone === 'dark' ? 'text-bone' : 'text-ink';
  const subColor = tone === 'dark' ? 'text-muted-dark' : 'text-muted-light';

  return (
    <span className={cn('inline-flex items-center gap-3', className)}>
      <LogoMark className="size-8 shrink-0 text-accent sm:size-9" />
      {showWordmark ? (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              'font-display text-[0.9375rem] font-extrabold leading-none tracking-[0.14em] sm:text-base',
              textColor,
            )}
          >
            MAJESTA
          </span>
          <span
            className={cn(
              'mt-1 font-sans text-[0.5625rem] font-semibold leading-none tracking-[0.3em] sm:text-[0.625rem]',
              subColor,
            )}
          >
            RENOVATIONS
          </span>
        </span>
      ) : null}
    </span>
  );
}
