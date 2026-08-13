import { MapPin, Phone } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { RevealItem, RevealList } from '@/components/ui/reveal';
import { Reveal } from '@/components/ui/reveal';
import { SectionHeading } from '@/components/ui/section-heading';
import type { Locale } from '@/i18n/routing';
import { phoneHref, site, t as pick } from '@/lib/site';

/**
 * Marker positions on the decorative island graphic, ordered roughly west to
 * east. Purely illustrative — the graphic is `aria-hidden` and the region list
 * beside it carries all the actual information.
 */
const MARKERS: Record<string, { x: number; y: number }> = {
  'west-island': { x: 118, y: 196 },
  north: { x: 318, y: 148 },
  centre: { x: 452, y: 196 },
  east: { x: 636, y: 174 },
  south: { x: 372, y: 268 },
};

export async function ServiceAreas({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'areas' });

  return (
    <section
      id="areas"
      aria-labelledby="areas-title"
      className="grain relative scroll-mt-24 bg-ink py-20 lg:py-28"
    >
      <div className="shell">
        <SectionHeading
          id="areas-title"
          eyebrow={t('eyebrow')}
          title={t('title')}
          subtitle={t('subtitle')}
        />

        <div className="mt-14 grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Decorative island graphic */}
          <Reveal className="lg:col-span-5 lg:sticky lg:top-28 lg:self-start">
            <svg
              viewBox="0 0 800 380"
              role="img"
              aria-label={t('mapAlt')}
              className="w-full"
            >
              <defs>
                <clipPath id="island-clip">
                  <path d="M 60 232 C 120 172 220 142 330 132 C 440 122 566 112 668 144 C 726 162 764 200 734 240 C 704 280 600 306 480 316 C 360 326 198 316 110 288 C 68 274 44 252 60 232 Z" />
                </clipPath>
                <linearGradient id="island-fill" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#2a2a30" />
                  <stop offset="100%" stopColor="#16161a" />
                </linearGradient>
              </defs>

              {/* Water */}
              <rect width="800" height="380" fill="#101012" />
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <path
                  key={i}
                  d={`M 0 ${40 + i * 48} Q 200 ${24 + i * 48} 400 ${40 + i * 48} T 800 ${40 + i * 48}`}
                  fill="none"
                  stroke="#1e1e23"
                  strokeWidth="2"
                />
              ))}

              {/* Island */}
              <g clipPath="url(#island-clip)">
                <rect width="800" height="380" fill="url(#island-fill)" />
                {/* Street grid, purely textural */}
                {Array.from({ length: 16 }, (_, i) => (
                  <line
                    key={`v${i}`}
                    x1={40 + i * 48}
                    y1="90"
                    x2={80 + i * 48}
                    y2="340"
                    stroke="#3c3c44"
                    strokeWidth="1"
                    opacity="0.55"
                  />
                ))}
                {Array.from({ length: 6 }, (_, i) => (
                  <line
                    key={`h${i}`}
                    x1="20"
                    y1={130 + i * 36}
                    x2="780"
                    y2={110 + i * 36}
                    stroke="#3c3c44"
                    strokeWidth="1"
                    opacity="0.4"
                  />
                ))}
              </g>
              <path
                d="M 60 232 C 120 172 220 142 330 132 C 440 122 566 112 668 144 C 726 162 764 200 734 240 C 704 280 600 306 480 316 C 360 326 198 316 110 288 C 68 274 44 252 60 232 Z"
                fill="none"
                stroke="#ff6a00"
                strokeWidth="2"
                opacity="0.5"
              />

              {/* Region markers */}
              {site.serviceAreaDetail.map((area, i) => {
                const pos = MARKERS[area.slug];
                if (!pos) return null;
                return (
                  <g key={area.slug}>
                    <circle cx={pos.x} cy={pos.y} r="20" fill="#ff6a00" opacity="0.16" />
                    <circle cx={pos.x} cy={pos.y} r="12" fill="#ff6a00" />
                    <text
                      x={pos.x}
                      y={pos.y + 4}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="12"
                      fontWeight="700"
                      fontFamily="var(--font-sans)"
                    >
                      {i + 1}
                    </text>
                  </g>
                );
              })}
            </svg>
          </Reveal>

          {/* Region list */}
          <div className="lg:col-span-7">
            <RevealList as="ol" className="grid gap-px bg-bone/10">
              {site.serviceAreaDetail.map((area, i) => (
                <RevealItem key={area.slug} className="bg-ink p-6 sm:p-7">
                  <div className="flex items-start gap-5">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 flex size-8 shrink-0 items-center justify-center bg-accent font-sans text-sm font-bold text-white"
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-xl font-bold text-bone">
                        {pick(area.name, locale)}
                      </h3>
                      <p className="mt-1.5 inline-flex items-center gap-2 text-sm text-accent-300">
                        <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
                        {pick(area.range, locale)}
                      </p>
                      <p className="mt-4 font-sans text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-ink-400">
                        {t('boroughsLabel')}
                      </p>
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {area.boroughs.map((borough) => (
                          <li
                            key={borough}
                            className="border border-bone/10 px-2.5 py-1 text-xs text-muted-dark"
                          >
                            {borough}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </RevealItem>
              ))}
            </RevealList>

            <Reveal delay={0.05}>
              <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 border-l-2 border-accent pl-5">
                <p className="text-sm text-muted-dark">{t('notListed')}</p>
                <a
                  href={phoneHref}
                  className="inline-flex items-center gap-2 font-sans text-sm font-semibold text-accent hover:text-accent-300"
                >
                  <Phone aria-hidden="true" className="size-4" />
                  {t('notListedCta', { phone: site.phone })}
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
