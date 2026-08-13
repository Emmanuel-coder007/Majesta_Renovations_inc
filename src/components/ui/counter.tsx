'use client';

import {
  animate,
  useInView,
  useReducedMotion,
} from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

/**
 * Count-up statistic.
 *
 * Two things worth noting:
 *  - The final value is rendered on the server and the animation only replaces
 *    it once in view, so the real number is in the HTML for crawlers and for
 *    anyone with JS disabled.
 *  - With reduced motion, it just prints the number.
 */
export function Counter({
  value,
  decimals = 0,
  suffix = '',
  locale,
  className,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  locale: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!inView || reduce || started) return;
    setStarted(true);
    setDisplay(0);
    const controls = animate(0, value, {
      duration: 1.5,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplay(latest),
      onComplete: () => setDisplay(value),
    });
    return () => controls.stop();
  }, [inView, reduce, started, value]);

  const formatted = new Intl.NumberFormat(locale === 'fr' ? 'fr-CA' : 'en-CA', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(display);

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {formatted}
      {suffix}
    </span>
  );
}
