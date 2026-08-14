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
  title: {
    default: 'Appliance Repair in Orange County, CA | CoastPro',
    // Just the shop name, not the full legal one. The suffix is appended to
    // every page title, so its length is spent twenty-four times over: at 28
    // characters it pushed every service and city page past the point a result
    // gets truncated, no matter how short the page's own title was.
    template: '%s | CoastPro',
  },
  description: siteConfig.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${archivo.variable}`}>
      <body className="font-sans min-h-screen flex flex-col bg-cream text-ink">{children}</body>
    </html>
  );
}
