/* eslint-disable no-restricted-exports */
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  const siteName = process.env.SITE_NAME || 'Website'

  return {
    background_color: '#ffffff',
    display: 'standalone',
    icons: [
      {
        sizes: '192x192',
        src: '/icon-192.png',
        type: 'image/png',
      },
      {
        sizes: '512x512',
        src: '/icon-512.png',
        type: 'image/png',
      },
    ],
    name: siteName,
    short_name: siteName,
    start_url: '/',
    theme_color: '#105898',
  }
}
