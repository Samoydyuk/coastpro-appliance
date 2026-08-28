import Link from 'next/link';
import { getCalendar, OperationsApiError, type CalendarJob } from '@/lib/bookings/client';
import { getServices } from '@/lib/jobpocket';
import { BookJobForm } from '@/components/admin/BookJobForm';
import { NotConnected } from '@/components/admin/NotConnected';
import { parseMonth, monthWindow, buildWeeks, dayKey, timeOfDay, WEEKDAY_LABELS } from '@/lib/bookings/month';
import { money } from '@/lib/admin/format';
import { Empty, Hint, Panel, SetupNotice, Warning } from '@/components/admin/ui';
import { STATUS, SERIES, INK_MUTED } from '@/components/admin/palette';

export const dynamic = 'force-dynamic';

/**
 * The month ahead, as JobPocket has it.
 *
 * Nothing is stored here. The console holds no copy of the schedule, so there
 * is nothing to fall out of step and nothing in a stolen database dump. Each
 * view is a live read.
 */

/** What the colour of a job means at a glance. */
const STATUS_COLOUR: Record<string, string> = {
  SCHEDULED: SERIES[0],
  IN_PROGRESS: STATUS.warning,
  PAUSED: SERIES[4],
  COMPLETED: SERIES[2],
  INVOICED: SERIES[6],
  PAID: STATUS.good,
  DRAFT: INK_MUTED,
  SENT: SERIES[1],
  APPROVED: SERIES[1],
  WAITING_APPROVAL: SERIES[3],
};

function statusColour(status: string): string {
  return STATUS_COLOUR[status] ?? INK_MUTED;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const view = parseMonth(typeof searchParams.month === 'string' ? searchParams.month : undefined);

  let jobs: CalendarJob[] = [];
  let ownBusiness: string | null = null;
  let failure: string | null = null;
  let unconfigured = false;

  // The public list, so the form offers the same services the booking page
  // does. It needs no key and fails to an empty list.
  const services = await getServices().catch(() => []);

  try {
    const window = monthWindow(view);
    ({ jobs, ownBusiness } = await getCalendar(window.from, window.to));
  } catch (error) {
    if (error instanceof OperationsApiError) {
      // A missing key is a setup step, not a fault: drawing an empty month for
      // it would say "no work booked", which is a different and much more
      // alarming sentence than "not connected".
      if (error.code === 'not_configured') unconfigured = true;
      else failure = error.message;
    } else {
      return <SetupNotice error={error} />;
    }
  }

  // Bucketed by the day the shop is in, not the day UTC is in.
  const byDay = new Map<string, CalendarJob[]>();
  for (const job of jobs) {
    const key = dayKey(job.scheduledAt);
    const existing = byDay.get(key);
    if (existing) existing.push(job);
    else byDay.set(key, [job]);
  }

  const weeks = buildWeeks(view);
  const booked = jobs.length;
  const value = jobs.reduce((sum, job) => sum + job.totalCents, 0);

  /**
   * Whose name each visit is under.
   *
   * Dispatched work carries the dispatcher's brand and own work carries none,
   * so on an account that does both this is the difference between "my week"
   * and "somebody's week". Shown only when there is more than one name in the
   * month — a calendar that says CoastPro on every single row has told you
   * nothing and taken up space doing it.
   */
  const brandOf = (job: CalendarJob) => job.brand?.name ?? ownBusiness ?? 'Own work';
  const brands = [...new Set(jobs.map(brandOf))];
  const showBrand = brands.length > 1;

  const brandColour = (name: string) =>
    SERIES[Math.max(0, brands.indexOf(name)) % SERIES.length];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-bold uppercase tracking-label text-ink">
            Calendar
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {booked === 0
              ? 'Nothing booked this month'
              : `${booked} ${booked === 1 ? 'visit' : 'visits'}${value > 0 ? ` · ${money(value)}` : ''}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <MonthLink month={view.previousKey} label="←" />
          <span className="min-w-[9rem] text-center font-heading text-[11px] font-semibold uppercase tracking-label text-ink">
            {view.label}
          </span>
          <MonthLink month={view.nextKey} label="→" />
        </div>
      </div>

      {failure && <Warning>{failure}</Warning>}

      {unconfigured ? (
        <NotConnected what="Jobs and bookings" />
      ) : (
      <Panel title={view.label} subtitle="Straight from JobPocket — the same jobs the app shows">
        {/* The grid scrolls rather than the page: a month is wide, and a
            horizontally scrolling page loses the navigation with it. */}
        <div className="-mx-5 overflow-x-auto px-5">
          <div className="min-w-[840px]">
            <div className="grid grid-cols-7 gap-px">
              {WEEKDAY_LABELS.map((label) => (
                <div
                  key={label}
                  className="pb-2 text-center font-heading text-[10px] font-semibold uppercase tracking-label text-gray-500"
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-px bg-primary-500/15">
              {weeks.flat().map((cell, index) => {
                const dayJobs = cell.key ? byDay.get(cell.key) ?? [] : [];

                return (
                  <div
                    key={cell.key ?? `pad-${index}`}
                    className={`min-h-[104px] bg-[#fcfcfb] p-2 ${cell.key ? '' : 'opacity-40'}`}
                  >
                    {cell.day !== null && (
                      <div className="mb-1.5 flex items-center justify-between">
                        <span
                          className={
                            cell.isToday
                              ? 'inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-card bg-ink px-1 text-[11px] font-semibold text-cream'
                              : 'text-[11px] text-gray-500'
                          }
                        >
                          {cell.day}
                        </span>
                        {dayJobs.length > 2 && (
                          <span className="text-[10px] text-gray-500">{dayJobs.length}</span>
                        )}
                      </div>
                    )}

                    <div className="space-y-1">
                      {dayJobs.slice(0, 3).map((job) => (
                        <Link
                          key={job.id}
                          href={`/admin/calendar/${job.id}`}
                          className="block rounded-card border-l-2 bg-cream-dark/40 px-1.5 py-1 transition-colors hover:bg-cream-dark"
                          style={{ borderLeftColor: statusColour(job.status) }}
                          title={`${job.jobNumber ?? ''} ${job.status}${job.address ? ` · ${job.address}` : ''}`}
                        >
                          <div className="truncate text-[11px] font-medium text-ink">
                            {timeOfDay(job.scheduledAt)} {job.clientName ?? 'No name'}
                          </div>
                          {showBrand ? (
                            <div
                              className="truncate text-[10px] font-medium"
                              style={{ color: brandColour(brandOf(job)) }}
                            >
                              {brandOf(job)}
                            </div>
                          ) : (
                            job.type && (
                              <div className="truncate text-[10px] text-gray-600">{job.type}</div>
                            )
                          )}
                        </Link>
                      ))}
                      {dayJobs.length > 3 && (
                        <div className="px-1.5 text-[10px] text-gray-500">
                          +{dayJobs.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {booked === 0 && !failure && (
          <div className="mt-4">
            <Empty>
              No visits booked in {view.label}. Requests waiting for an answer are on the Bookings
              screen.
            </Empty>
          </div>
        )}
      </Panel>
      )}

      {showBrand && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {brands.map((name) => (
            <span key={name} className="flex items-center gap-1.5 text-xs text-gray-600">
              <span
                aria-hidden
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: brandColour(name) }}
              />
              {name} · {jobs.filter((j) => brandOf(j) === name).length}
              {(() => {
                const earned = jobs
                  .filter((j) => brandOf(j) === name)
                  .reduce((sum, j) => sum + j.totalCents, 0);
                return earned > 0 ? <span className="tabular-nums"> · {money(earned)}</span> : null;
              })()}
            </span>
          ))}
        </div>
      )}

      {!unconfigured && (
      <Panel
        title="Book a visit"
        subtitle="Somebody rang — put it in the diary"
      >
        <BookJobForm services={services.map((s) => ({ id: s.id, name: s.name }))} />
      </Panel>
      )}

      <Hint>
        This is a live view of JobPocket, not a copy — accept a request here or in the app and both
        show the same job a moment later. Times are in the shop&apos;s timezone. Cancelled work is
        left out.
      </Hint>
    </div>
  );
}

function MonthLink({ month, label }: { month: string; label: string }) {
  return (
    <Link
      href={`/admin/calendar?month=${month}`}
      className="inline-flex h-8 w-8 items-center justify-center rounded-card border border-primary-500/30 text-sm text-gray-600 transition-colors hover:border-ink hover:text-ink"
      aria-label={label === '←' ? 'Previous month' : 'Next month'}
    >
      {label}
    </Link>
  );
}
