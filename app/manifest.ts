import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Relay by TRS',
    short_name: 'Relay',
    description: "India's first travel-retail bookstore online. Books, tech, chocolates & luxury across all TRS stores.",
    start_url: '/',
    display: 'standalone',
    background_color: '#CA0538',
    theme_color: '#CA0538',
    icons: [
      { src: '/relay-app-icon.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/relay-app-icon.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/relay-app-icon.png', sizes: '1024x1024', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
