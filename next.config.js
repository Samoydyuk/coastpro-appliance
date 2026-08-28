/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  /**
   * The console can now ask for a microphone, so it should be the only thing
   * that can. Without this any page that manages to frame the admin could
   * prompt in its name.
   */
  async headers() {
    return [
      {
        source: '/admin/:path*',
        headers: [
          { key: 'Permissions-Policy', value: 'microphone=(self), camera=(), geolocation=()' },
          { key: 'Referrer-Policy', value: 'same-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },

  async redirects() {
    return [
      {
        source: '/reviews',
        destination: '/',
        permanent: true,
      },
      // /index served the whole home page with a 200 — Vercel's filesystem
      // routing answers it as the root. Nothing links to it and nothing 404s
      // around it (every other unknown path does), but it is a second address
      // for the front page, and a site where Google has already left half the
      // URLs uncrawled does not need a spare one.
      {
        source: '/index',
        destination: '/',
        permanent: true,
      },
      // The ice maker service page advertised standalone and commercial ice
      // machines, which is work CoastPro does not take. Removed rather than
      // reworded — but it was live and indexable for months, so it redirects to
      // the refrigerator page instead of 404ing. The ice maker *inside* a
      // refrigerator is still repaired and still described there.
      {
        source: '/services/ice-maker',
        destination: '/services/refrigerator',
        permanent: true,
      },
      // Wine cooler and cooktop were published and withdrawn the same day —
      // the owner does not take that work either. Live for minutes rather than
      // months, so almost certainly never crawled, but a redirect costs
      // nothing and a 404 in a sitemap Google fetched in between does not.
      {
        source: '/services/wine-cooler',
        destination: '/services/refrigerator',
        permanent: true,
      },
      {
        source: '/services/cooktop',
        destination: '/services/oven-range',
        permanent: true,
      },
    ];
  },
}

module.exports = nextConfig
