import Link from 'next/link';
import { timeOfDay, dayKey } from '@/lib/bookings/month';
import { groupByLane, lanesFor, type Lane } from '@/lib/bookings/lanes';
import type { CalendarJob } from '@/lib/bookings/client';
import { shopHour } from '@/lib/admin/clock';

/**
 * The two dispatcher boards: a week by technician, and a day by technician.
 *
 * Both read the same way — a lane is a person, and the empty stretch in a lane
 * is the thing being looked for. The month grid answers "where is there room";
 * these answer "who has room".
 *
 * Server components: nothing here needs to react to anything, and the console
 * is deliberately almost free of client JavaScript.
 */

interface BoardProps {
  jobs: CalendarJob[];
  lanes: Lane[];
  /** `YYYY-MM-DD` in shop time. */
  days: { key: string; label: string; isToday: boolean }[];
}

export function WeekBoard({ jobs, lanes, days }: BoardProps) {
  const byLane = groupByLane(jobs, lanes);

  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <div className="min-w-[900px]">
        <div
          className="grid gap-px"
          style={{ gridTemplateColumns: `10rem repeat(${days.length}, minmax(0, 1fr))` }}
        >
          <div />
          {days.map((day) => (
            <div
              key={day.key}
              className={`pb-2 text-center font-heading text-[10px] font-semibold uppercase tracking-label ${
                day.isToday ? 'text-ink' : 'text-gray-500'
              }`}
            >
              {day.label}
            </div>
          ))}
        </div>

        <div className="grid gap-px bg-primary-500/15">
          {lanes.map((lane) => {
            const laneJobs = byLane.get(lane.id) ?? [];

            return (
              <div
                key={lane.id}
                className="grid gap-px"
                style={{ gridTemplateColumns: `10rem repeat(${days.length}, minmax(0, 1fr))` }}
              >
                <div className="flex items-center gap-2 bg-[#fcfcfb] px-3 py-2">
                  <span
                    aria-hidden
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: lane.colour }}
                  />
                  <span className="truncate text-sm text-ink">{lane.name}</span>
                  <span className="ml-auto text-[11px] tabular-nums text-gray-500">
                    {laneJobs.length}
                  </span>
                </div>

                {days.map((day) => {
                  const inCell = laneJobs.filter((job) => dayKey(job.scheduledAt) === day.key);

                  return (
                    <div
                      key={day.key}
                      className={`min-h-[72px] space-y-1 p-1.5 ${
                        day.isToday ? 'bg-cream-dark/30' : 'bg-[#fcfcfb]'
                      }`}
                    >
                      {inCell.map((job) => (
                        <JobChip key={job.id} job={job} lane={lane} />
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Working hours, which is all a dispatcher's day needs to cover. */
const DAY_START = 7;
const DAY_END = 20;

export function DayBoard({ jobs, lanes, day }: { jobs: CalendarJob[]; lanes: Lane[]; day: string }) {
  const today = jobs.filter((job) => dayKey(job.scheduledAt) === day);
  const byLane = groupByLane(today, lanes);
  const hours = Array.from({ length: DAY_END - DAY_START }, (_, i) => DAY_START + i);

  /** Where a visit sits, and how tall it is, in hour-rows. */
  const place = (job: CalendarJob) => {
    const start = new Date(job.scheduledAt);
    // Not `Number(format(...))`: that reads 24 at midnight under one locale and
    // 0 under another, which would make this layout move with the interface
    // language. `shopHour` pins the format and normalises.
    const local = shopHour(start);
    const top = Math.max(0, local - DAY_START);
    const span = Math.max(1, Math.round((job.estimatedDuration ?? 60) / 60));
    return { top, span: Math.min(span, DAY_END - DAY_START - top) };
  };

  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <div className="min-w-[720px]">
        <div
          className="grid gap-px"
          style={{ gridTemplateColumns: `4rem repeat(${lanes.length}, minmax(0, 1fr))` }}
        >
          <div />
          {lanes.map((lane) => (
            <div key={lane.id} className="flex items-center justify-center gap-1.5 pb-2">
              <span
                aria-hidden
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: lane.colour }}
              />
              <span className="truncate font-heading text-[10px] font-semibold uppercase tracking-label text-ink">
                {lane.name}
              </span>
            </div>
          ))}
        </div>

        <div
          className="grid gap-px bg-primary-500/15"
          style={{
            gridTemplateColumns: `4rem repeat(${lanes.length}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${hours.length}, 3.25rem)`,
          }}
        >
          {hours.map((hour, row) => (
            <div
              key={hour}
              className="bg-[#fcfcfb] pr-2 pt-1 text-right text-[11px] tabular-nums text-gray-500"
              style={{ gridColumn: 1, gridRow: row + 1 }}
            >
              {hour % 12 === 0 ? 12 : hour % 12}
              {hour < 12 ? 'am' : 'pm'}
            </div>
          ))}

          {/* The empty grid first, so a lane with no work still reads as a lane
              rather than as a missing column. */}
          {lanes.map((lane, col) =>
            hours.map((hour, row) => (
              <div
                key={`${lane.id}-${hour}`}
                className="bg-[#fcfcfb]"
                style={{ gridColumn: col + 2, gridRow: row + 1 }}
              />
            ))
          )}

          {lanes.map((lane, col) =>
            (byLane.get(lane.id) ?? []).map((job) => {
              const { top, span } = place(job);
              return (
                <div
                  key={`${lane.id}-${job.id}`}
                  className="p-1"
                  style={{ gridColumn: col + 2, gridRow: `${top + 1} / span ${span}` }}
                >
                  <JobChip job={job} lane={lane} tall />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function JobChip({ job, lane, tall }: { job: CalendarJob; lane: Lane; tall?: boolean }) {
  const shared = lanesFor(job).length > 1;

  return (
    <Link
      href={`/admin/calendar/${job.id}`}
      title={`${job.jobNumber ?? ''} ${job.status}${job.address ? ` · ${job.address}` : ''}`}
      className={`block rounded-card border-l-2 bg-cream-dark/40 px-1.5 py-1 transition-colors hover:bg-cream-dark ${
        tall ? 'h-full overflow-hidden' : ''
      }`}
      style={{ borderLeftColor: lane.colour }}
    >
      <div className="truncate text-[11px] font-medium text-ink">
        {timeOfDay(job.scheduledAt)} {job.clientName ?? 'No name'}
      </div>
      {job.type && <div className="truncate text-[10px] text-gray-600">{job.type}</div>}
      {/* A visit with two people on it is on both their days; saying so stops
          the second lane reading as a duplicate. */}
      {shared && <div className="text-[10px] text-gray-500">shared</div>}
    </Link>
  );
}
