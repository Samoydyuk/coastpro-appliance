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
    ];
  },
}

module.exports = nextConfig
