import Link from 'next/link';
import { parseRange } from '@/lib/admin/range';
import { count, money } from '@/lib/admin/format';
import { getByTechnician } from '@/lib/money/client';
import { getTeam, OperationsApiError } from '@/lib/bookings/client';
import { buildLanes } from '@/lib/bookings/lanes';
import { Empty, Hint, Panel, SetupNotice, StatTile, Table, Td, Th, Warning } from '@/components/admin/ui';
import { NotConnected } from '@/components/admin/NotConnected';
import { RankedBars } from '@/components/admin/charts';
import { NEUTRAL } from '@/components/admin/palette';

export const dynamic = 'force-dynamic';

export default async function TechniciansPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const range = parseRange({
    range: searchParams.range as string,
    from: searchParams.from as string,
    to: searchParams.to as string,
  });

  let report: Awaited<ReturnType<typeof getByTechnician>> | null = null;
  let unconfigured = false;
  let failure: string | null = null;

  try {
    report = await getByTechnician(range.from, range.to);
  } catch (error) {
    if (error instanceof OperationsApiError) {
      if (error.code === 'not_configured') unconfigured = true;
      else failure = error.message;
    } else {
      return <SetupNotice error={error} />;
    }
  }

  if (unconfigured) {
    return (
      <div className="space-y-6">
        <Header subtitle={range.label} />
        <NotConnected what="Jobs and payments" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-6">
        <Header subtitle={range.label} />
        <Warning>{failure ?? 'JobPocket did not answer.'}</Warning>
      </div>
    );
  }

  // The roster only supplies colour, so a technician is the same colour here as
  // on the calendar board. Losing it costs nothing worth failing the page for.
  const team = await getTeam().catch(() => ({ members: [] }));
  const lanes = buildLanes(team.members);
  const colourFor = (techId: string | null) =>
    lanes.find((lane) => lane.id === techId)?.colour ?? NEUTRAL;

  const rows = report.technicians;
  const totalRevenue = rows.reduce((sum, row) => sum + row.ownShareRevenueCents, 0);
  const totalJobs = rows.reduce((sum, row) => sum + row.jobs, 0);

  return (
    <div className="space-y-6">
      <Header subtitle={`${range.label} · ${report.creditRule}`} />
      {failure ? <Warning>{failure}</Warning> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Own revenue" value={money(totalRevenue)} emphasis />
        <StatTile label="Jobs finished" value={count(totalJobs)} />
        <StatTile label="Technicians with work" value={count(rows.length)} />
        <StatTile
          label="Average ticket"
          value={totalJobs ? money(Math.round(totalRevenue / totalJobs)) : '—'}
          hint="after the dispatchers' share"
        />
      </div>

      <Panel title="Revenue by technician" subtitle="What each of them brought in, after the split">
        {rows.length === 0 ? (
          <Empty>No finished work in this window.</Empty>
        ) : (
          <RankedBars
            format="money"
            items={rows.map((row) => ({
              label: row.name,
              value: row.ownShareRevenueCents / 100,
              color: colourFor(row.techId),
              note: `${count(row.jobs)} jobs · ${money(row.avgTicketCents)} avg`,
            }))}
          />
        )}
      </Panel>

      <Panel
        title="Every technician"
        subtitle="Open the week to see what they actually did"
        action={<a
              href={`/api/admin/export?type=technicians&range=${range.key}`}
              className="inline-flex h-8 items-center rounded-card border border-primary-500/30 px-3 font-heading text-[10px] font-semibold uppercase tracking-label text-gray-600 hover:border-ink hover:text-ink"
            >
              Export CSV
            </a>}
      >
        {rows.length === 0 ? (
          <Empty>No finished work in this window.</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Technician</Th>
                <Th numeric>Jobs</Th>
                <Th numeric>Revenue</Th>
                <Th numeric>Avg ticket</Th>
                <Th numeric>Avg booked</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.techId ?? 'you'}>
                  <Td>
                    {row.techId ? (
                      <Link
                        href={`/admin/calendar?view=week&who=${row.techId}`}
                        className="text-ink underline decoration-primary-500/40 underline-offset-2 hover:text-primary-600"
                      >
                        {row.name}
                      </Link>
                    ) : (
                      row.name
                    )}
                  </Td>
                  <Td numeric>{count(row.jobs)}</Td>
                  <Td numeric className="font-medium">
                    {money(row.ownShareRevenueCents)}
                  </Td>
                  <Td numeric>{money(row.avgTicketCents)}</Td>
                  <Td numeric className="text-gray-600">
                    {row.avgEstimatedMinutes ? `${row.avgEstimatedMinutes} min` : '—'}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <Hint>
          Revenue only, deliberately. What a job cost is not broken out per person here: on a short
          window a technician often has one job, and revenue beside a margin would give away what
          that job&apos;s parts cost. The booked time answers the same question without it.
        </Hint>
      </Panel>
    </div>
  );
}

function Header({ subtitle }: { subtitle: string }) {
  return (
    <div>
      <h1 className="font-heading text-xl font-bold uppercase tracking-label text-ink">
        Technicians
      </h1>
      <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
    </div>
  );
}
