import { parseRange } from '@/lib/admin/range';
import { count, money, percent } from '@/lib/admin/format';
import { getByCompany } from '@/lib/money/client';
import { OperationsApiError } from '@/lib/bookings/client';
import { Empty, Hint, Panel, SetupNotice, StatTile, Table, Td, Th, Warning } from '@/components/admin/ui';
import { NotConnected } from '@/components/admin/NotConnected';
import { RankedBars } from '@/components/admin/charts';
import { SERIES } from '@/components/admin/palette';

export const dynamic = 'force-dynamic';

export default async function DispatchersPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const range = parseRange({
    range: searchParams.range as string,
    from: searchParams.from as string,
    to: searchParams.to as string,
  });

  let report: Awaited<ReturnType<typeof getByCompany>> | null = null;
  let unconfigured = false;
  let failure: string | null = null;

  try {
    report = await getByCompany(range.from, range.to);
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
        <Header label={range.label} subtitle="" />
        <NotConnected what="Jobs and payments" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-6">
        <Header label={range.label} subtitle="" />
        <Warning>{failure ?? 'JobPocket did not answer.'}</Warning>
      </div>
    );
  }

  const rows = report.companies;
  const own = rows.filter((row) => row.brandId === null);
  const dispatched = rows.filter((row) => row.brandId !== null);

  const sum = (list: typeof rows, key: 'billedCents' | 'ownShareCents' | 'jobs') =>
    list.reduce((total, row) => total + (row[key] as number), 0);

  const dispatchedBilled = sum(dispatched, 'billedCents');
  const dispatchedKept = sum(dispatched, 'ownShareCents');
  const totalJobs = sum(rows, 'jobs');
  const dispatchedJobs = sum(dispatched, 'jobs');

  // Said before any number, because every figure below reads differently once
  // you know most of the calendar carries somebody else's name.
  const subtitle =
    totalJobs === 0
      ? range.label
      : `${range.label} · ${percent(dispatchedJobs / totalJobs, 0)} of the work was dispatched — ` +
        `${count(totalJobs - dispatchedJobs)} of ${count(totalJobs)} jobs carried your own name.`;

  return (
    <div className="space-y-6">
      <Header label={range.label} subtitle={subtitle} />
      {failure ? <Warning>{failure}</Warning> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Your own work" value={money(sum(own, 'ownShareCents'))} emphasis />
        <StatTile
          label="Kept from dispatched work"
          value={money(dispatchedKept)}
          emphasis
          hint={
            dispatchedBilled
              ? `${Math.round((dispatchedKept / dispatchedBilled) * 100)}¢ on the dollar`
              : undefined
          }
        />
        <StatTile
          label="Dispatched, billed"
          value={money(dispatchedBilled)}
          hint="what the customers were charged"
        />
        <StatTile label="Jobs dispatched" value={count(dispatchedJobs)} />
      </div>

      <Panel title="Kept, by dispatcher" subtitle="Ranked on what survives, not on what they send">
        {rows.length === 0 ? (
          <Empty>No finished work in this window.</Empty>
        ) : (
          <RankedBars
            format="money"
            items={rows.map((row) => ({
              label: row.name,
              value: row.ownShareCents / 100,
              // One hue: dispatchers are not marketing channels, and borrowing
              // that palette would imply a connection that does not exist.
              color: SERIES[0]!,
              note: `${row.keptPct === null ? '—' : `${row.keptPct}%`} of ${money(row.billedCents)} · ${count(row.jobs)} jobs`,
            }))}
          />
        )}
        <Hint>
          Ranked on what you keep rather than what was billed: billed ranks who sends the most work,
          kept ranks who is worth the most, and only the second changes what you do about it.
        </Hint>
      </Panel>

      <Panel
        title="Every dispatcher"
        subtitle="What the deal actually returns"
        action={<a
              href={`/api/admin/export?type=dispatchers&range=${range.key}`}
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
                <Th>Company</Th>
                <Th numeric>Jobs</Th>
                <Th numeric>Billed</Th>
                <Th numeric>Their cut</Th>
                <Th numeric>Kept</Th>
                <Th numeric>Kept %</Th>
                <Th numeric>Avg ticket</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.brandId ?? 'own'}>
                  <Td>
                    {row.name}
                    {row.revenueSharePct !== null ? (
                      <span className="ml-2 text-[11px] text-gray-500">
                        {row.revenueSharePct}%{row.reimbursesParts ? ', parts back' : ''}
                      </span>
                    ) : null}
                  </Td>
                  <Td numeric>{count(row.jobs)}</Td>
                  <Td numeric>{money(row.billedCents)}</Td>
                  <Td numeric className="text-gray-600">
                    {money(row.billedCents - row.ownShareCents)}
                  </Td>
                  <Td numeric className="font-medium">
                    {money(row.ownShareCents)}
                  </Td>
                  <Td numeric>{row.keptPct === null ? '—' : `${row.keptPct}%`}</Td>
                  <Td numeric className="text-gray-600">
                    {row.jobs ? money(Math.round(row.ownShareCents / row.jobs)) : '—'}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <Hint>
          Kept % is what survives of the whole ticket, which is not the headline percentage: a
          dispatcher who reimburses parts returns that money whole, so the share they keep is
          smaller than their number suggests.
        </Hint>
      </Panel>
    </div>
  );
}

function Header({ label, subtitle }: { label: string; subtitle: string }) {
  return (
    <div>
      <h1 className="font-heading text-xl font-bold uppercase tracking-label text-ink">
        Dispatchers
      </h1>
      <p className="mt-1 text-sm text-gray-600">{subtitle || label}</p>
    </div>
  );
}
