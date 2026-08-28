import { SERIES, INK_MUTED } from '@/components/admin/palette';
import type { CalendarJob } from '@/lib/bookings/client';

/**
 * Technicians as lanes.
 *
 * A dispatcher reads a board by who, not by what — "is Ihor free on Thursday"
 * comes before "what is the Thursday job". So every view is built from the
 * same lane list, in the same order, with the same colour per person: the
 * colour has to mean one technician across the month, the week and the day, or
 * switching views means re-learning the board.
 *
 * Unassigned work is a lane of its own and always last. It is the one a
 * dispatcher looks at first and the one that is easiest to leave out of a
 * layout, because it belongs to nobody.
 */

export const UNASSIGNED = '__unassigned__';

export interface Lane {
  id: string;
  name: string;
  colour: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  isYou: boolean;
}

/**
 * Colour by position in the team list, not by position among today's jobs.
 *
 * If it were the latter, filtering the board would repaint the survivors —
 * yesterday's blue technician becomes today's orange one, and the reader
 * quietly mistrusts the whole thing.
 */
export function buildLanes(team: TeamMember[]): Lane[] {
  return [
    ...team.map((member, index) => ({
      id: member.id,
      name: member.isYou ? `${member.name} (you)` : member.name,
      colour: SERIES[index % SERIES.length],
    })),
    { id: UNASSIGNED, name: 'Nobody yet', colour: INK_MUTED },
  ];
}

/**
 * Which lanes a job belongs in.
 *
 * A visit with two technicians on it appears in both, because it is genuinely
 * on both their days — showing it once would tell one of them they are free
 * when they are not.
 */
export function lanesFor(job: CalendarJob): string[] {
  const ids = (job.assignees ?? []).map((a) => a.id);
  return ids.length > 0 ? ids : [UNASSIGNED];
}

/** Jobs grouped by lane, keeping the lane order. */
export function groupByLane(jobs: CalendarJob[], lanes: Lane[]): Map<string, CalendarJob[]> {
  const byLane = new Map<string, CalendarJob[]>(lanes.map((lane) => [lane.id, []]));

  for (const job of jobs) {
    for (const laneId of lanesFor(job)) {
      // A technician who has left still has yesterday's jobs against their
      // name; those land in "nobody yet" rather than vanishing from the board.
      const bucket = byLane.get(laneId) ?? byLane.get(UNASSIGNED);
      bucket?.push(job);
    }
  }

  return byLane;
}

/** The lane a single job should be drawn in when only one will do. */
export function primaryLane(job: CalendarJob, lanes: Lane[]): Lane {
  const [first] = lanesFor(job);
  return lanes.find((lane) => lane.id === first) ?? lanes[lanes.length - 1];
}

export function filterToLane(jobs: CalendarJob[], laneId: string | null): CalendarJob[] {
  if (!laneId) return jobs;
  return jobs.filter((job) => lanesFor(job).includes(laneId));
}
