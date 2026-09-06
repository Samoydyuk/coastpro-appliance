import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Phone } from 'lucide-react';
import { siteConfig } from '@/data/site-config';

/**
 * The shell around a customer's own repairs.
 *
 * Outside the `(site)` group for the same structural reason `/report` is: that
 * group wraps its children in two GA4 properties, the Google Ads tag and
 * `<Tracker/>`, all of which report the path they loaded on and write a row to
 * our own visits table. No token rides in this path — the session is a cookie —
 * but the pages behind it are one household's appliances, addresses and what
 * they owe, and there is no configuration of an analytics tag that makes it
 * appropriate to log a browse through somebody's repair history against an
 * advertising account. The fix is not to be in the group.
 *
 * `no-referrer` for the same reason as the report: outbound clicks from these
 * pages should not tell a stranger's access log which page of this site the
 * visitor came from.
 *
 * The chrome is the report's, deliberately. This is the same document family —
 * the mark, a phone number, and the customer's own record — and forty header
 * links would make it look like marketing.
 */

export const metadata: Metadata = {
  title: 'Your repairs',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <header className="border-b border-primary-500/20 bg-cream-light">
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

      <footer className="border-t border-primary-500/20">
        <div className="mx-auto max-w-[60rem] px-4 py-6 text-[12px] text-gray-500">
          {siteConfig.name} · {siteConfig.contact.phone} · {siteConfig.contact.email}
        </div>
      </footer>
    </div>
  );
}
