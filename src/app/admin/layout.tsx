import Link from 'next/link';
import { AdminNav } from '@/components/admin/AdminNav';

export const metadata = {
  title: 'CoastPro console',
  robots: { index: false, follow: false },
};

/**
 * The console shell. Its own chrome, deliberately unlike the marketing site:
 * dense, quiet, and built to be read rather than to sell.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f2f0eb]">
      <header className="border-b border-primary-500/20 bg-[#fcfcfb]">
        <div className="mx-auto flex max-w-[1400px] items-center gap-6 px-5 py-3">
          <Link href="/admin" className="font-heading text-sm font-bold uppercase tracking-brand text-ink">
            CoastPro
          </Link>
          <span className="font-heading text-[10px] uppercase tracking-label text-gray-500">
            Marketing console
          </span>
          <div className="ml-auto flex items-center gap-4">
            <Link
              href="/"
              className="font-heading text-[10px] uppercase tracking-label text-gray-500 hover:text-ink"
            >
              View site
            </Link>
            <a
              href="/api/admin/logout"
              className="font-heading text-[10px] uppercase tracking-label text-gray-500 hover:text-ink"
            >
              Sign out
            </a>
          </div>
        </div>
        <AdminNav />
      </header>

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-5 py-6">{children}</main>

      <footer className="border-t border-primary-500/15 px-5 py-4 text-center text-[11px] text-gray-500">
        First-party analytics — recorded by coastpro.us, not by an ad platform.
      </footer>
    </div>
  );
}
