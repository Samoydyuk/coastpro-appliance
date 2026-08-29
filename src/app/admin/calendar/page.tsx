import Link from 'next/link';
import {
  getCalendar,
  getTeam,
  OperationsApiError,
  type CalendarJob,
  type TeamMemberSummary,
} from '@/lib/bookings/client';
import { getServices } from '@/lib/jobpocket';
import { BookJobForm } from '@/components/admin/BookJobForm';
import { NotConnected } from '@/components/admin/NotConnected';
import { WeekBoard, DayBoard } from '@/components/admin/CalendarBoards';
import {
  parseMonth,
  monthWindow,
  buildWeeks,
  dayKey,
  timeOfDay,
  todayInShopTz,
  weekOf,
  weekWindow,
  dayWindow,
  shiftDay,
  isDayKey,
} from '@/lib/bookings/month';
import { buildLanes, filterToLane, primaryLane, UNASSIGNED } from '@/lib/bookings/lanes';
import { money } from '@/lib/admin/format';
import { serverTranslator } from '@/lib/i18n/server';
import { numberLocale } from '@/lib/i18n';
import { Empty, Hint, Panel, SetupNotice, Warning } from '@/components/admin/ui';
import { STATUS, SERIES, INK_MUTED } from '@/components/admin/palette';

export const dynamic = 'force-dynamic';

/**
 * The schedule, three ways.
 *
 * A month answers "where is there room". A week by technician answers "who has
 * room". A day by technician answers "what does today actually look like".
 * A dispatcher asks all three, so they share one anchor date rather than each
 * keeping its own — switching from a week to the day you were reading lands on
 * that day, not on today.
 *
 * Nothing is stored here. The console holds no copy of the schedule, so there
 * is nothing to fall out of step and nothing in a stolen database dump.
 */

const VIEWS = [
  { key: 'month', label: 'work.calendar.view.month' },
  { key: 'week', label: 'work.calendar.view.week' },
  { key: 'day', label: 'work.calendar.view.day' },
] as const;

type ViewKey = (typeof VIEWS)[number]['key'];

/**
 * The headings, in the reader's language.
 *
 * `month.ts` formats through `en-US` on purpose: the same file builds the ISO
 * day keys that travel in the query string, and those must not move with the
 * interface language. The keys stay exactly as they are — only the words shown
 * above the board are formatted again, here.
 */
const LONG_DAY: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
};

const SHORT_DAY: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
};

function formatDayKey(key: string, locale: string, options: Intl.DateTimeFormatOptions): string {
  const [year, month, day] = key.split('-').map(Number);
  return new Intl.DateTimeFormat(locale, options).format(new Date(Date.UTC(year, month - 1, day)));
}

/** What the colour means when there is only ever one answer to "who". */
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

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const t = serverTranslator();
  const locale = numberLocale(t.lang);

  const view = (
    typeof searchParams.view === 'string' && VIEWS.some((v) => v.key === searchParams.view)
      ? searchParams.view
      : 'month'
  ) as ViewKey;

  const anchor = isDayKey(typeof searchParams.on === 'string' ? searchParams.on : undefined)
    ? (searchParams.on as string)
    : todayInShopTz();

  const who = typeof searchParams.who === 'string' ? searchParams.who : null;

  const month = parseMonth(anchor.slice(0, 7));
  const week = weekOf(anchor);

  const window =
    view === 'month' ? monthWindow(month) : view === 'week' ? weekWindow(week) : dayWindow(anchor);

  const services = await getServices().catch(() => []);

  let jobs: CalendarJob[] = [];
  let team: TeamMemberSummary[] = [];
  let ownBusiness: string | null = null;
  let failure: string | null = null;
  let unconfigured = false;

  try {
    const [calendar, roster] = await Promise.all([
      getCalendar(window.from, window.to),
      // A board without lanes is still a board; a calendar that will not draw
      // because the roster failed is not.
      getTeam().catch(() => ({ members: [] as TeamMemberSummary[] })),
    ]);
    jobs = calendar.jobs;
    ownBusiness = calendar.ownBusiness;
    team = roster.members;
  } catch (error) {
    if (error instanceof OperationsApiError) {
      if (error.code === 'not_configured') unconfigured = true;
      else failure = error.message;
    } else {
      return <SetupNotice error={error} />;
    }
  }

  const lanes = buildLanes(team);
  const visible = filterToLane(jobs, who);

  // Bucketed by the day the shop is in, not the day UTC is in.
  const byDay = new Map<string, CalendarJob[]>();
  for (const job of visible) {
    const key = dayKey(job.scheduledAt);
    const existing = byDay.get(key);
    if (existing) existing.push(job);
    else byDay.set(key, [job]);
  }

  const link = (next: { view?: ViewKey; on?: string; who?: string | null }) => {
    const params = new URLSearchParams();
    params.set('view', next.view ?? view);
    params.set('on', next.on ?? anchor);
    const person = next.who === undefined ? who : next.who;
    if (person) params.set('who', person);
    return `/admin/calendar?${params}`;
  };

  const back = view === 'month' ? `${month.previousKey}-15` : shiftDay(anchor, view === 'week' ? -7 : -1);
  const forward = view === 'month' ? `${month.nextKey}-15` : shiftDay(anchor, view === 'week' ? 7 : 1);

  // The week's own labels come out of `weekOf` in English; the day keys are
  // what the board is actually built from, so only the labels are replaced.
  const weekDays = week.map((day) => ({ ...day, label: formatDayKey(day.key, locale, SHORT_DAY) }));

  const heading =
    view === 'month'
      ? new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
          new Date(Date.UTC(month.year, month.month - 1, 15))
        )
      : view === 'week'
        ? `${weekDays[0].label} – ${weekDays[6].label}`
        : formatDayKey(anchor, locale, LONG_DAY);

  const booked = visible.length;
  const value = visible.reduce((sum, job) => sum + job.totalCents, 0);
  const hasTeam = team.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-bold uppercase tracking-label text-ink">
            {t('work.calendar.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {booked === 0
              ? t('work.calendar.nothingBooked')
              : `${t.plural(booked, 'work.plural.visit')}${
                  value > 0 ? ` · ${money(value, t.lang)}` : ''
                }`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1">
            {VIEWS.map((option) => (
              <Link
                key={option.key}
                href={link({ view: option.key })}
                className={`rounded-card border px-3 py-1.5 font-heading text-[10px] font-semibold uppercase tracking-label transition-colors ${
                  view === option.key
                    ? 'border-ink bg-ink text-cream'
                    : 'border-primary-500/25 text-gray-600 hover:border-ink hover:text-ink'
                }`}
              >
                {t(option.label)}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Step href={link({ on: back })} label="←" aria={t('work.calendar.stepBack')} />
            <span className="min-w-[12rem] text-center font-heading text-[11px] font-semibold uppercase tracking-label text-ink">
              {heading}
            </span>
            <Step href={link({ on: forward })} label="→" aria={t('work.calendar.stepForward')} />
            <Link
              href={link({ on: todayInShopTz() })}
              className="rounded-card border border-primary-500/25 px-2.5 py-1 font-heading text-[10px] font-semibold uppercase tracking-label text-gray-600 hover:border-ink hover:text-ink"
            >
              {t('work.calendar.today')}
            </Link>
          </div>
        </div>
      </div>

      {failure && <Warning>{failure}</Warning>}

      {unconfigured ? (
        <NotConnected what={t('work.calendar.notConnectedWhat')} />
      ) : (
        <>
          {/* One lane list, one colour per person, across all three views. A
              colour that meant one technician on the week and another on the
              day would make the board unreadable the moment somebody switched. */}
          {hasTeam && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Link
                href={link({ who: null })}
                className={`rounded-card border px-3 py-1.5 font-heading text-[10px] font-semibold uppercase tracking-label transition-colors ${
                  who === null
                    ? 'border-ink bg-ink text-cream'
                    : 'border-primary-500/25 text-gray-600 hover:border-ink hover:text-ink'
                }`}
              >
                {t('work.calendar.everyone')}
              </Link>
              {lanes.map((lane) => (
                <Link
                  key={lane.id}
                  href={link({ who: lane.id })}
                  className={`flex items-center gap-1.5 rounded-card border px-3 py-1.5 font-heading text-[10px] font-semibold uppercase tracking-label transition-colors ${
                    who === lane.id
                      ? 'border-ink bg-ink text-cream'
                      : 'border-primary-500/25 text-gray-600 hover:border-ink hover:text-ink'
                  }`}
                >
                  <span
                    aria-hidden
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: lane.colour }}
                  />
                  {lane.id === UNASSIGNED ? t('work.calendar.nobodyYet') : lane.name} ·{' '}
                  {filterToLane(jobs, lane.id).length}
                </Link>
              ))}
            </div>
          )}

          <Panel
            title={heading}
            subtitle={
              view === 'month'
                ? t('work.calendar.monthSubtitle')
                : t('work.calendar.laneSubtitle')
            }
          >
            {view === 'month' ? (
              <MonthGrid month={month} byDay={byDay} lanes={lanes} showLaneColour={hasTeam} />
            ) : view === 'week' ? (
              <WeekBoard jobs={visible} lanes={lanes} days={weekDays} />
            ) : (
              <DayBoard jobs={visible} lanes={lanes} day={anchor} />
            )}

            {booked === 0 && !failure && (
              <div className="mt-4">
                <Empty>{t('work.calendar.emptyHere')}</Empty>
              </div>
            )}
          </Panel>

          <Panel
            title={t('work.calendar.bookTitle')}
            subtitle={t('work.calendar.bookSubtitle')}
          >
            <BookJobForm services={services.map((s) => ({ id: s.id, name: s.name }))} />
          </Panel>
        </>
      )}

      <Hint>
        {t('work.calendar.hint')}
        {ownBusiness ? t('work.calendar.hintOwn') : ''}
      </Hint>
    </div>
  );
}

function MonthGrid({
  month,
  byDay,
  lanes,
  showLaneColour,
}: {
  month: ReturnType<typeof parseMonth>;
  byDay: Map<string, CalendarJob[]>;
  lanes: ReturnType<typeof buildLanes>;
  showLaneColour: boolean;
}) {
  const t = serverTranslator();
  const locale = numberLocale(t.lang);
  const weeks = buildWeeks(month);

  // Sunday first, matching the grid `buildWeeks` pads. 7 January 2024 was a
  // Sunday, and is only ever used as an anchor to name the seven weekdays.
  const weekdays = Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }).format(
      new Date(Date.UTC(2024, 0, 7 + index))
    )
  );

  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <div className="min-w-[840px]">
        <div className="grid grid-cols-7 gap-px">
          {weekdays.map((label, index) => (
            <div
              key={index}
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
                    {/* The day number opens that day's board — the move a
                        dispatcher makes constantly. */}
                    <Link
                      href={`/admin/calendar?view=day&on=${cell.key}`}
                      className={
                        cell.isToday
                          ? 'inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-card bg-ink px-1 text-[11px] font-semibold text-cream'
                          : 'text-[11px] text-gray-500 hover:text-ink'
                      }
                    >
                      {cell.day}
                    </Link>
                    {dayJobs.length > 2 && (
                      <span className="text-[10px] text-gray-500">{dayJobs.length}</span>
                    )}
                  </div>
                )}

                <div className="space-y-1">
                  {dayJobs.slice(0, 3).map((job) => {
                    const lane = primaryLane(job, lanes);
                    return (
                      <Link
                        key={job.id}
                        href={`/admin/calendar/${job.id}`}
                        className="block rounded-card border-l-2 bg-cream-dark/40 px-1.5 py-1 transition-colors hover:bg-cream-dark"
                        style={{
                          // With a team the colour says who; alone it says what
                          // state the job is in, which is the more useful of the
                          // two when there is only ever one answer to "who".
                          borderLeftColor: showLaneColour
                            ? lane.colour
                            : STATUS_COLOUR[job.status] ?? INK_MUTED,
                        }}
                        title={`${job.jobNumber ?? ''} ${job.status}${job.address ? ` · ${job.address}` : ''}`}
                      >
                        <div className="truncate text-[11px] font-medium text-ink">
                          {timeOfDay(job.scheduledAt)}{' '}
                          {job.clientName ?? t('work.calendar.noName')}
                        </div>
                        <div className="truncate text-[10px] text-gray-600">
                          {showLaneColour
                            ? lane.id === UNASSIGNED
                              ? t('work.calendar.nobodyYet')
                              : lane.name
                            : job.type}
                        </div>
                      </Link>
                    );
                  })}
                  {dayJobs.length > 3 && (
                    <div className="px-1.5 text-[10px] text-gray-500">
                      {t('work.calendar.more', { n: dayJobs.length - 3 })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Step({ href, label, aria }: { href: string; label: string; aria: string }) {
  return (
    <Link
      href={href}
      className="inline-flex h-8 w-8 items-center justify-center rounded-card border border-primary-500/30 text-sm text-gray-600 transition-colors hover:border-ink hover:text-ink"
      aria-label={aria}
    >
      {label}
    </Link>
  );
}
