import Link from 'next/link';
import { Panel } from '@/components/admin/ui';

/**
 * What to show instead of an empty screen when nothing is connected yet.
 *
 * An empty month grid with a warning above it reads as "no work booked". That
 * is a far more alarming sentence than "not connected", and it is the wrong
 * one — so when there is no key, the month is not drawn at all.
 */
export function NotConnected({ what }: { what: string }) {
  return (
    <Panel title="Not connected yet" subtitle={`${what} come from JobPocket, and there is no key yet`}>
      <div className="max-w-prose space-y-4 text-sm text-gray-700">
        <p>
          This screen is empty because it has nothing to ask. It is not saying you have no work —
          it has not been given a way to look.
        </p>

        <ol className="space-y-2">
          <Step n={1}>
            In JobPocket: <strong className="text-ink">Settings → Integrations</strong>, find{' '}
            <strong className="text-ink">Bookings and calendar</strong>, and switch it on.
          </Step>
          <Step n={2}>
            Copy the key it shows. It is shown <strong className="text-ink">once</strong> — closing
            the screen means minting a new one.
          </Step>
          <Step n={3}>
            Paste it on{' '}
            <Link href="/admin/settings" className="text-ink underline hover:text-primary-600">
              Settings
            </Link>{' '}
            under <strong className="text-ink">JobPocket keys</strong>, with the type set to
            &ldquo;Bookings and calendar&rdquo;.
          </Step>
        </ol>

        <p className="text-xs text-gray-600">
          Not the &ldquo;Your own website&rdquo; key — that one can only file enquiries, and it is
          meant to be refused here. If you paste it by mistake this screen will say so rather than
          going quiet.
        </p>
      </div>
    </Panel>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-semibold text-cream">
        {n}
      </span>
      <span>{children}</span>
    </li>
  );
}
