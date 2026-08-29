import Link from 'next/link';
import { cn } from '@/lib/utils';
import { deltaColor, INK_MUTED, STATUS } from './palette';
import { percent } from '@/lib/admin/format';
import { SetupNoticeBody, StatusPill } from './ui.client';

/**
 * The building blocks every admin screen is assembled from.
 *
 * Nothing in this file reads the language, and nothing in it may. The live-now
 * screen is a client component and imports from here, so this whole file is
 * compiled into the browser bundle too — one `next/headers` import anywhere in
 * its reach and the build stops. The two blocks that have words of their own
 * live in `ui.client.tsx` and read the language from context instead.
 */

// Re-exported so every call site keeps importing the pill from one place.
export { StatusPill };

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
 *
 * The reading of the error stays here, on the server, for two reasons. The
 * driver writes its message in English whatever the console is set to, so the
 * matching below must never be translated — and an `Error` is a class
 * instance, which cannot be handed across the boundary to a client component
 * at all. What crosses is two booleans and a string.
 */
export function SetupNotice({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : String(error);
  const missingUrl = message.includes('DATABASE_URL');
  const missingTables = /relation .* does not exist/i.test(message);

  return (
    <SetupNoticeBody missingUrl={missingUrl} missingTables={missingTables} message={message} />
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
