import type { MetadataRoute } from 'next'

// Makes the website installable as an app on PC (Chrome / Edge) and phone (Android, iPhone home screen).
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'AL ZAHRA ERP',
    short_name: 'AL ZAHRA',
    description: 'AL ZAHRA Consultancy — investor license, customers, invoices and expenses',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#ffffff',
    theme_color: '#3d5fab',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
