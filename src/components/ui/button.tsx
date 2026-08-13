import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-[background-color,color,border-color,transform] duration-200 ease-[var(--ease-out-expo)] disabled:pointer-events-none disabled:opacity-50 active:translate-y-px [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-white hover:bg-accent-600',
        onDark:
          'bg-bone text-ink hover:bg-white',
        outlineDark:
          'border border-bone/30 bg-transparent text-bone hover:border-bone/70 hover:bg-bone/5',
        outlineLight:
          'border border-ink/20 bg-transparent text-ink hover:border-ink/50 hover:bg-ink/5',
        ghostDark: 'text-bone hover:bg-bone/10',
        ghostLight: 'text-ink hover:bg-ink/5',
      },
      size: {
        sm: 'h-10 px-4 text-sm [&_svg]:size-4',
        md: 'h-12 px-6 text-[0.9375rem] [&_svg]:size-[1.125rem]',
        lg: 'h-14 px-8 text-base [&_svg]:size-5',
        icon: 'size-11 [&_svg]:size-5',
      },
      radius: {
        sharp: 'rounded-none',
        soft: 'rounded-sm',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      radius: 'sharp',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, radius, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, radius }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };
