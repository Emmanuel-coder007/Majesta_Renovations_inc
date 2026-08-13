import type { ReactNode } from 'react';

/**
 * Every real page lives under `app/[locale]`, and that layout owns `<html>` and
 * `<body>` because the `lang` attribute depends on the locale. This root layout
 * therefore just passes children through — it exists only because Next requires
 * a root layout to be present.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
