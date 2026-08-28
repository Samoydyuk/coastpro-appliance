import Link from 'next/link';
import Image from 'next/image';
import { AdminNav, AdminRangeBar } from '@/components/admin/AdminNav';
import { CallBar } from '@/components/admin/CallBar';
import { getSeat } from '@/lib/dispatch/client';

export const metadata = {
  title: 'CoastPro admin',
  robots: { index: false, follow: false },
};

/**
 * The shell of the business's admin.
 *
 * Deliberately unlike the marketing site: dense, quiet, and built to be read
 * rather than to sell. The navigation runs down the side because this is where
 * CoastPro is run from and the list of places to go keeps growing — a row of
 * tabs was already seventeen wide and fighting the date controls for space.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // A seat that is not in the ring group would show a bar that never rings, so
  // the bar appears only once calls can actually arrive.
  const desk = await getSeat().catch(() => ({ seat: null, ringing: false }));
  return (
    <div className="flex min-h-screen flex-col bg-[#f2f0eb]">
      <header className="border-b border-primary-500/20 bg-[#fcfcfb]">
        <div className="mx-auto flex max-w-[1600px] items-center gap-6 px-5 py-3">
          <Link href="/admin" className="flex items-center">
            <Image
              src="/images/coastpro-logo.png"
              alt="CoastPro.us"
              width={2264}
              height={321}
              className="h-4 w-auto"
            />
          </Link>
          <span className="font-heading text-[10px] uppercase tracking-label text-gray-500">
            Admin
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
      </header>

      <CallBar teamMemberId={desk.ringing ? desk.seat?.id ?? null : null} />

      <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col lg:flex-row">
        <AdminNav />

        <main className="min-w-0 flex-1 px-5 py-6">
          <AdminRangeBar />
          {children}
        </main>
      </div>

      <footer className="border-t border-primary-500/15 px-5 py-4 text-center text-[11px] text-gray-500">
        CoastPro Appliance Repair — jobs, enquiries and advertising in one place.
      </footer>
    </div>
  );
}
