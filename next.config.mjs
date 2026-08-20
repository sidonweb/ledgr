// @ts-check

import withPWAInit from '@ducanh2912/next-pwa'

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  cacheStartUrl: true,
  dynamicStartUrl: true,
  extendDefaultRuntimeCaching: true,
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    cleanupOutdatedCaches: true,
    runtimeCaching: [
      {
        urlPattern: ({ sameOrigin, url }) => sameOrigin && url.pathname.startsWith('/api/'),
        handler: 'NetworkOnly',
        method: 'GET',
        options: { cacheName: 'apis' },
      },
    ],
  },
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // the floating dev badge sits on top of the mobile navigation bar
  devIndicators: false,
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
    ]
  },
}

export default withPWA(nextConfig)
