import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Phone } from 'lucide-react';
import { siteConfig } from '@/data/site-config';

/**
 * The shell around a service report.
 *
 * It has a layout of its own for one reason, and the reason is not taste. The
 * `(site)` group wraps its children in two GA4 properties, the Google Ads tag
 * and `<Tracker/>`, every one of which reports the page path it was loaded on.
 * The path here *is* the credential — `/report/<token>` — so putting this page
 * in that group would have posted a bearer token for one household's invoice
 * into Google Analytics, into an Ads account, and into our own visits table,
 * where it would sit in plain text for as long as we keep analytics. There is
 * no configuration of GA that fixes that; the fix is not to be in the group.
 * The precedent is `app/not-found.tsx`, which renders its own chrome for the
 * same structural reason.
 *
 * That also settles how much chrome there is. The full header and footer carry
 * something like forty links, and every one of them is a chance for the token
 * to ride out in a `Referer`. `referrer: 'no-referrer'` below closes that, but
 * a document does not want a navigation bar anyway: this is the paper the
 * technician used to hand over at the door, and it should read like it. A mark
 * at the top, a phone number, and the report.
 */

export const metadata: Metadata = {
  title: 'Service report',
  /**
   * Two rules, and they are the same rule twice.
   *
   * `noindex, nofollow` because a link that reaches a crawler must not become a
   * search result — the page is one customer's appliance, their address and
   * what they owe. `no-referrer` because the token lives in the URL, so any
   * outbound click — a supplier's parts page is the obvious one, and this page
   * prints those links — would otherwise hand the whole credential to a
   * stranger's access log. JobPocket sets the same two as headers on its own
   * copy of this page; this is the Next equivalent, as meta tags.
   */
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              /* The page is drawn live from a job that can still be edited, so
                 the printed copy is the customer's permanent record — it has to
                 come out looking like the document, not like a screenshot of a
                 website with the shading dropped. */
              @page { margin: 14mm; }
              html, body { background: #fff !important; }
              * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              /* Supplier links are useful on paper only if you can read where
                 they go. Relative links — the booking page, the phone — do not
                 match, so nothing internal is spelled out, and the report's own
                 address is never printed anywhere. */
              a[href^="http"]::after {
                content: " (" attr(href) ")";
                font-size: 10px;
                color: #635c56;
                word-break: break-all;
              }
            }
          `,
        }}
      />

      <header className="border-b border-primary-500/20 bg-cream-light print:border-b-0">
        <div className="mx-auto flex max-w-[60rem] items-center justify-between gap-6 px-4 py-4">
          <Link href="/" className="flex items-center">
            <Image
              src="/images/coastpro-logo.png"
              alt={siteConfig.name}
              width={2264}
              height={321}
              className="h-5 w-auto"
            />
          </Link>
          <a
            href={`tel:${siteConfig.contact.phoneClean}`}
            className="inline-flex items-center gap-2 font-heading text-[11px] font-semibold uppercase tracking-label text-ink transition-colors hover:text-primary-600"
          >
            <Phone className="h-3.5 w-3.5" strokeWidth={1.5} />
            {siteConfig.contact.phone}
          </a>
        </div>
      </header>

      <main className="flex-grow">{children}</main>

      {/* Deliberately not the site footer: one line, no links, and it survives
          the print stylesheet because a printed record with no way to reach the
          people who wrote it is half a record. */}
      <footer className="border-t border-primary-500/20 print:border-t">
        <div className="mx-auto max-w-[60rem] px-4 py-6 text-[12px] text-gray-500">
          {siteConfig.name} · {siteConfig.contact.phone} · {siteConfig.contact.email}
        </div>
      </footer>
    </div>
  );
}
