import { ImageResponse } from 'next/og';

import { routing } from '@/i18n/routing';
import { site } from '@/lib/site';

/**
 * Per-locale Open Graph card, rendered by Satori rather than shipped as a
 * static file — so the text is real text in the right language, and updating
 * the phone number or licence in site-data.json updates the share card too.
 *
 * No custom webfont is loaded on purpose: next/og bundles a default, and adding
 * a Google Fonts fetch here would make the build depend on a network call for
 * something purely decorative.
 */

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = `${site.name} — ${site.license.type} ${site.license.number}`;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const COPY = {
  fr: {
    tagline: 'Rénovation résidentielle et commerciale à Montréal',
    licence: 'Licence RBQ',
    reviews: 'avis',
    response: 'Réponse en 1 à 2 heures',
  },
  en: {
    tagline: 'Residential and commercial renovation in Montreal',
    licence: 'RBQ licence',
    reviews: 'reviews',
    response: 'Response in 1–2 hours',
  },
} as const;

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const copy = COPY[locale === 'en' ? 'en' : 'fr'];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#0b0b0c',
          padding: '72px 80px',
          color: '#f7f3ec',
        }}
      >
        {/* Accent rule */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: 10,
            backgroundColor: '#ff6a00',
            display: 'flex',
          }}
        />

        {/* Mark + wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <svg width="72" height="72" viewBox="0 0 100 100">
            <path
              d="M 18 80 L 18 24 L 50 56 L 82 24 L 82 80"
              fill="none"
              stroke="#ff6a00"
              strokeWidth="12"
              strokeLinejoin="miter"
            />
            <rect x="18" y="86" width="64" height="6" fill="#ff6a00" opacity="0.55" />
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: 6 }}>
              MAJESTA
            </div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 600,
                letterSpacing: 10,
                color: '#a7a29a',
                marginTop: 6,
              }}
            >
              RENOVATIONS
            </div>
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 900 }}>
          <div
            style={{
              fontSize: 62,
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: -1.5,
            }}
          >
            {copy.tagline}
          </div>
          <div
            style={{
              fontSize: 27,
              color: '#a7a29a',
              marginTop: 22,
              display: 'flex',
            }}
          >
            {copy.response}
          </div>
        </div>

        {/* Facts strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 40,
            borderTop: '1px solid #2a2a30',
            paddingTop: 30,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Drawn as SVG rather than the ★ glyph — Satori has no local
                coverage for it and would fetch a dynamic font over the
                network at build time, which fails in offline environments. */}
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: 5 }, (_, i) => (
                <svg key={i} width="28" height="28" viewBox="0 0 24 24">
                  <path
                    d="M12 2 L14.9 8.6 L22 9.3 L16.7 14 L18.2 21 L12 17.3 L5.8 21 L7.3 14 L2 9.3 L9.1 8.6 Z"
                    fill="#ff6a00"
                  />
                </svg>
              ))}
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, display: 'flex' }}>
              {locale === 'en' ? '5.0' : '5,0'} · {site.rating.count}{' '}
              {copy.reviews}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              fontSize: 24,
              color: '#a7a29a',
            }}
          >
            {copy.licence} {site.license.number}
          </div>

          <div
            style={{
              display: 'flex',
              marginLeft: 'auto',
              fontSize: 30,
              fontWeight: 700,
              color: '#ff6a00',
            }}
          >
            {site.phone}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
