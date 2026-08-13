'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/* Form field primitives                                                       */
/*                                                                             */
/* Deliberately plain: a real <label for>, a real <input>, and errors wired up  */
/* through aria-describedby / aria-invalid. Screen readers announce the error   */
/* when focus enters the field, which is the whole point.                       */
/* -------------------------------------------------------------------------- */

export function Label({
  className,
  required,
  requiredLabel,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & {
  required?: boolean;
  requiredLabel?: string;
}) {
  return (
    <label
      className={cn(
        'mb-2 block font-sans text-sm font-semibold tracking-wide text-bone',
        className,
      )}
      {...props}
    >
      {children}
      {required ? (
        <span className="ml-1 text-accent" aria-hidden="true">
          *
        </span>
      ) : null}
      {required && requiredLabel ? (
        <span className="sr-only"> ({requiredLabel})</span>
      ) : null}
    </label>
  );
}

const controlBase =
  'w-full rounded-none border bg-ink-800 px-4 font-sans text-bone placeholder:text-ink-400 transition-colors duration-200 focus:outline-none focus-visible:border-accent disabled:opacity-50';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(({ className, invalid, ...props }, ref) => (
  <input
    ref={ref}
    aria-invalid={invalid || undefined}
    className={cn(
      controlBase,
      'h-12',
      invalid ? 'border-danger' : 'border-ink-600 hover:border-ink-500',
      className,
    )}
    {...props}
  />
));
Input.displayName = 'Input';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(({ className, invalid, ...props }, ref) => (
  <textarea
    ref={ref}
    aria-invalid={invalid || undefined}
    className={cn(
      controlBase,
      'min-h-36 resize-y py-3 leading-relaxed',
      invalid ? 'border-danger' : 'border-ink-600 hover:border-ink-500',
      className,
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

/**
 * Native <select> on purpose. A custom listbox would need a pile of ARIA to
 * match what the platform already gives us, and on mobile the native picker is
 * simply better than anything we would build.
 */
export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }
>(({ className, invalid, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        controlBase,
        'h-12 cursor-pointer appearance-none pr-11',
        invalid ? 'border-danger' : 'border-ink-600 hover:border-ink-500',
        className,
      )}
      {...props}
    >
      {children}
    </select>
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-dark"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m5 7.5 5 5 5-5" strokeLinecap="square" />
    </svg>
  </div>
));
Select.displayName = 'Select';

export function FieldError({
  id,
  children,
}: {
  id: string;
  children?: React.ReactNode;
}) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-2 font-sans text-sm text-danger">
      {children}
    </p>
  );
}

export function FieldHint({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p id={id} className={cn('mt-2 font-sans text-xs text-muted-dark', className)}>
      {children}
    </p>
  );
}

export function Field({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn('min-w-0', className)}>{children}</div>;
}
