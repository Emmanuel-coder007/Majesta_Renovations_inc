import type { MetadataRoute } from 'next';

import { site } from '@/lib/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: 'Majesta',
    description:
      'Entrepreneur en rénovation licencié RBQ à Montréal — RBQ-licensed renovation contractor in Montreal.',
    // French is the default locale (Charter of the French Language).
    lang: 'fr-CA',
    start_url: '/fr',
    scope: '/',
    display: 'standalone',
    background_color: '#0b0b0c',
    theme_color: '#0b0b0c',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/icons/mark-transparent.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
