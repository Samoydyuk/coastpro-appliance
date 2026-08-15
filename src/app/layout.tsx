import type { Metadata } from 'next';
import { Inter, Archivo } from 'next/font/google';
import { siteConfig } from '@/data/site-config';
import './globals.css';

/**
 * The root shell, deliberately almost empty: fonts, the stylesheet and the
 * document itself. Everything a visitor sees — the header, the footer, the
 * Google tags, the analytics — belongs to the `(site)` group, so the admin
 * console can render its own chrome without inheriting a marketing site's.
 */

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const archivo = Archivo({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-archivo',
  weight: ['500', '600', '700', '800'],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.seo.siteUrl),
  // A plain string, and deliberately no `template`. The `(site)` group defines
  // the marketing title — default and template both — and a template here was
  // applied to that default on the way up, so the home page went out as
  // "… | CoastPro | CoastPro". Only one segment may own the suffix; it is the
  // one whose pages actually carry it. This value is the fallback for routes in
  // neither group, which is the root `not-found` and nothing else.
  title: 'CoastPro Appliance Repair',
  description: siteConfig.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${archivo.variable}`}>
      <body className="font-sans min-h-screen flex flex-col bg-cream text-ink">{children}</body>
    </html>
  );
}
