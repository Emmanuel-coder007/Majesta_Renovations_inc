'use client';

import { Toaster as Sonner } from 'sonner';

/**
 * Toast host. Styled to the site palette rather than sonner's defaults so
 * success and error states read against the dark base at AA contrast.
 */
export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      closeButton
      duration={7000}
      toastOptions={{
        classNames: {
          toast:
            'group !rounded-none !border !border-ink-600 !bg-ink-800 !text-bone !font-sans !shadow-2xl',
          title: '!font-display !tracking-tight !text-bone',
          description: '!text-muted-dark',
          actionButton: '!bg-accent !text-white !rounded-none',
          cancelButton: '!bg-ink-600 !text-bone !rounded-none',
          closeButton: '!bg-ink-700 !border-ink-600 !text-bone',
          success: '!border-l-4 !border-l-success',
          error: '!border-l-4 !border-l-danger',
          warning: '!border-l-4 !border-l-accent',
        },
      }}
    />
  );
}
