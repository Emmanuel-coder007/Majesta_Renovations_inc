import { routing } from '@/i18n/routing';

/**
 * Root-level 404.
 *
 * The middleware redirects every human-facing path into a locale, so this only
 * catches requests that bypassed it. It renders its own `<html>` because the
 * root layout deliberately does not — see src/app/layout.tsx.
 *
 * Kept bilingual and dependency-free: this page must render even when the
 * locale could not be resolved at all.
 */
export default function RootNotFound() {
  return (
    <html lang={routing.defaultLocale}>
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0b0b0c',
          color: '#f7f3ec',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
          padding: '2rem',
        }}
      >
        <main>
          <p
            style={{
              color: '#ff6a00',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            404
          </p>
          <h1 style={{ fontSize: '2rem', margin: '1rem 0 0', letterSpacing: '-0.03em' }}>
            Page introuvable · Page not found
          </h1>
          <p style={{ color: '#a7a29a', margin: '1rem 0 2rem' }}>
            Cette page n&apos;existe pas. · That page does not exist.
          </p>
          <a
            href={`/${routing.defaultLocale}`}
            style={{
              display: 'inline-block',
              backgroundColor: '#ff6a00',
              color: '#fff',
              padding: '0.875rem 1.75rem',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Accueil · Home
          </a>
        </main>
      </body>
    </html>
  );
}
