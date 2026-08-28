import Link from 'next/link';
import { cn } from '@/lib/utils';
import { deltaColor, INK_MUTED, STATUS } from './palette';
import { percent } from '@/lib/admin/format';

/** The building blocks every admin screen is assembled from. */

export function Panel({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn('rounded-card border border-primary-500/20 bg-[#fcfcfb]', className)}
    >
      {(title || action) && (
        <header className="flex items-start justify-between gap-4 border-b border-primary-500/15 px-5 py-4">
          <div>
            {title && (
              <h2 className="font-heading text-[11px] font-semibold uppercase tracking-label text-ink">
                {title}
              </h2>
            )}
            {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function StatTile({
  label,
  value,
  change,
  hint,
  higherIsBetter = true,
  emphasis = false,
}: {
  label: string;
  value: string;
  change?: number | null;
  hint?: string;
  higherIsBetter?: boolean;
  emphasis?: boolean;
}) {
  return (
    <div className="rounded-card border border-primary-500/20 bg-[#fcfcfb] px-5 py-4">
      <p className="font-heading text-[10px] font-semibold uppercase tracking-label text-gray-500">
        {label}
      </p>
      <p
        className={cn(
          'mt-2 font-heading font-bold text-ink tabular-nums',
          emphasis ? 'text-4xl' : 'text-2xl'
        )}
      >
        {value}
      </p>
      <div className="mt-1 flex items-baseline gap-2">
        {change !== undefined && change !== null && (
          <span
            className="text-xs font-semibold tabular-nums"
            style={{ color: deltaColor(change, higherIsBetter) }}
          >
            {change > 0 ? '▲' : change < 0 ? '▼' : '—'} {percent(Math.abs(change), 0)}
          </span>
        )}
        {hint && <span className="text-xs text-gray-500">{hint}</span>}
      </div>
    </div>
  );
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  new: { bg: '#e8f1fd', text: '#1c5cab', label: 'New' },
  contacted: { bg: '#fdf2e3', text: '#8a5a12', label: 'Contacted' },
  booked: { bg: '#e6f4ec', text: '#0b5c34', label: 'Booked' },
  won: { bg: '#e3f3e3', text: '#06600d', label: 'Won' },
  lost: { bg: '#f4e6e6', text: '#8f2323', label: 'Lost' },
  spam: { bg: '#eceae6', text: '#635c56', label: 'Spam' },

  // Booking requests, as JobPocket names them. Without these the pill fell back
  // to grey with the raw enum in it — "PENDING" shouted at the reader in a
  // column where every other row said something in English.
  PENDING: { bg: '#fdf2e3', text: '#8a5a12', label: 'Waiting' },
  ACCEPTED: { bg: '#e6f4ec', text: '#0b5c34', label: 'Accepted' },
  DECLINED: { bg: '#f4e6e6', text: '#8f2323', label: 'Declined' },
  CANCELLED: { bg: '#eceae6', text: '#635c56', label: 'Cancelled' },

  // And the job it becomes.
  SCHEDULED: { bg: '#e8f1fd', text: '#1c5cab', label: 'Scheduled' },
  IN_PROGRESS: { bg: '#fdf2e3', text: '#8a5a12', label: 'In progress' },
  PAUSED: { bg: '#eceae6', text: '#635c56', label: 'Paused' },
  COMPLETED: { bg: '#e6f4ec', text: '#0b5c34', label: 'Completed' },
  INVOICED: { bg: '#e8f1fd', text: '#1c5cab', label: 'Invoiced' },
  PAID: { bg: '#e3f3e3', text: '#06600d', label: 'Paid' },
  DRAFT: { bg: '#eceae6', text: '#635c56', label: 'Draft' },
};

export function StatusPill({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? { bg: '#eceae6', text: '#635c56', label: status };
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 font-heading text-[10px] font-semibold uppercase tracking-label"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {style.label}
    </span>
  );
}

export function ChannelDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden
        className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 0 2px #fcfcfb` }}
      />
      <span>{label}</span>
    </span>
  );
}

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <table className={cn('w-full min-w-[640px] border-collapse text-sm', className)}>
        {children}
      </table>
    </div>
  );
}

export function Th({
  children,
  numeric,
  className,
}: {
  children?: React.ReactNode;
  numeric?: boolean;
  className?: string;
}) {
  return (
    <th
      className={cn(
        'border-b border-primary-500/25 pb-2 font-heading text-[10px] font-semibold uppercase tracking-label text-gray-500',
        numeric ? 'text-right' : 'text-left',
        className
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  numeric,
  className,
}: {
  children?: React.ReactNode;
  numeric?: boolean;
  className?: string;
}) {
  return (
    <td
      className={cn(
        'border-b border-primary-500/10 py-2.5 align-middle',
        numeric ? 'text-right tabular-nums' : 'text-left',
        className
      )}
    >
      {children}
    </td>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-10 text-center">
      <p className="text-sm text-gray-500">{children}</p>
    </div>
  );
}

export function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-start gap-3 rounded-card border px-4 py-3 text-sm"
      style={{ borderColor: STATUS.warning, backgroundColor: '#fdf6e6', color: '#5c4408' }}
    >
      <span aria-hidden className="mt-px font-bold">
        !
      </span>
      <div>{children}</div>
    </div>
  );
}

export function Hint({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 text-xs leading-relaxed" style={{ color: INK_MUTED }}>
      {children}
    </p>
  );
}

/**
 * What a screen shows when it cannot reach the database. Almost always a
 * missing DATABASE_URL rather than a real fault, so it says so plainly instead
 * of showing a stack trace.
 */
export function SetupNotice({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : String(error);
  const missingUrl = message.includes('DATABASE_URL');
  const missingTables = /relation .* does not exist/i.test(message);

  return (
    <div className="mx-auto max-w-2xl py-16">
      <h1 className="font-heading text-xl font-bold uppercase tracking-label text-ink">
        {missingUrl ? 'Database not connected yet' : missingTables ? 'Tables not created yet' : 'Could not load'}
      </h1>
      <div className="mt-4 space-y-3 text-sm text-gray-700">
        {missingUrl && (
          <>
            <p>
              Copy <code className="rounded bg-cream-dark px-1.5 py-0.5">DATABASE_PUBLIC_URL</code>{' '}
              from the Railway Postgres service, add it to Vercel as{' '}
              <code className="rounded bg-cream-dark px-1.5 py-0.5">DATABASE_URL</code>, and
              redeploy.
            </p>
            <p className="text-gray-500">
              It has to be the public one. The internal address —{' '}
              <code className="rounded bg-cream-dark px-1.5 py-0.5">*.railway.internal</code> —
              only resolves inside Railway&apos;s own network, and this site does not run there.
            </p>
          </>
        )}
        {missingTables && (
          <p>
            The database is reachable but empty. Run{' '}
            <code className="rounded bg-cream-dark px-1.5 py-0.5">
              psql &quot;$DATABASE_PUBLIC_URL&quot; -f db/schema.sql
            </code>{' '}
            once.
          </p>
        )}
        {!missingUrl && !missingTables && (
          <p className="rounded-card bg-cream-dark p-3 font-mono text-xs">{message}</p>
        )}
      </div>
    </div>
  );
}

export function LinkButton({
  href,
  children,
  active,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex h-8 items-center rounded-card border px-3 font-heading text-[10px] font-semibold uppercase tracking-label transition-colors',
        active
          ? 'border-ink bg-ink text-cream'
          : 'border-primary-500/30 text-gray-600 hover:border-ink hover:text-ink'
      )}
    >
      {children}
    </Link>
  );
}
