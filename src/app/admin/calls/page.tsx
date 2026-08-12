import Link from 'next/link';
import { parseRange } from '@/lib/admin/range';
import { getCalls, getTrackingNumbers } from '@/lib/admin/queries';
import { count, dateTime, duration, percent } from '@/lib/admin/format';
import { channelLabel } from '@/lib/attribution';
import { Empty, Hint, Panel, SetupNotice, StatTile, Table, Td, Th, Warning } from '@/components/admin/ui';
import { STATUS, channelColor } from '@/components/admin/palette';

export const dynamic = 'force-dynamic';

/** Calls shorter than this are misdials and wrong numbers, not customers. */
const REAL_CALL_SECONDS = 30;

export default async function CallsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const range = parseRange({
    range: searchParams.range as string,
    from: searchParams.from as string,
    to: searchParams.to as string,
  });

  try {
    const [calls, numbers] = await Promise.all([getCalls(range), getTrackingNumbers()]);

    const rows = calls as Record<string, string | number | boolean | Date | null>[];
    const answered = rows.filter((row) => row.answered);
    const real = answered.filter((row) => Number(row.duration_seconds ?? 0) >= REAL_CALL_SECONDS);
    const missed = rows.length - answered.length;
    const firstTime = rows.filter((row) => row.is_first_time).length;
    const totalTalk = answered.reduce((sum, row) => sum + Number(row.duration_seconds ?? 0), 0);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-xl font-bold uppercase tracking-label text-ink">Calls</h1>
          <p className="mt-1 text-sm text-gray-600">{range.label}</p>
        </div>

        {numbers.length === 0 && (
          <Warning>
            No tracking numbers are configured, so calls cannot be attributed to a channel. Add
            them under{' '}
            <Link href="/admin/settings" className="underline">
              Settings
            </Link>{' '}
            — one number per channel, each forwarded to the main line.
          </Warning>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Calls" value={count(rows.length)} hint={`${count(firstTime)} first-time callers`} />
          <StatTile
            label="Answered"
            value={count(answered.length)}
            hint={rows.length ? `${percent(answered.length / rows.length, 0)} of calls` : undefined}
          />
          <StatTile
            label="Missed"
            value={count(missed)}
            higherIsBetter={false}
            hint={missed ? 'each one is a job somebody else got' : 'none'}
          />
          <StatTile
            label="Talk time"
            value={duration(totalTalk)}
            hint={`${count(real.length)} calls over ${REAL_CALL_SECONDS}s`}
          />
        </div>

        <Panel title="Call log">
          {rows.length === 0 ? (
            <Empty>
              No calls recorded. Calls only appear here once tracking numbers are live and the
              Telnyx webhook is pointed at this site.
            </Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>When</Th>
                  <Th>From</Th>
                  <Th>Rang</Th>
                  <Th>Channel</Th>
                  <Th>Town</Th>
                  <Th>Was reading</Th>
                  <Th numeric>Length</Th>
                  <Th>Result</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const seconds = Number(row.duration_seconds ?? 0);
                  const short = Boolean(row.answered) && seconds < REAL_CALL_SECONDS;
                  return (
                    <tr key={String(row.id)}>
                      <Td className="whitespace-nowrap">{dateTime(row.started_at as Date)}</Td>
                      <Td className="whitespace-nowrap font-mono text-xs">
                        {(row.caller_number as string) || '—'}
                        {row.is_first_time ? (
                          <span className="ml-2 text-[10px] uppercase tracking-label text-gray-500">
                            new
                          </span>
                        ) : null}
                      </Td>
                      <Td className="whitespace-nowrap font-mono text-xs text-gray-600">
                        {(row.tracking_number as string) || '—'}
                      </Td>
                      <Td>
                        <span className="inline-flex items-center gap-2 whitespace-nowrap">
                          <span
                            aria-hidden
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: channelColor(String(row.channel ?? '')) }}
                          />
                          {channelLabel(row.channel as string)}
                        </span>
                      </Td>
                      <Td>{(row.city as string) || '—'}</Td>
                      <Td className="max-w-[200px] truncate font-mono text-xs text-gray-600">
                        {(row.landing_path as string) || '—'}
                      </Td>
                      <Td numeric>{row.answered ? duration(seconds) : '—'}</Td>
                      <Td>
                        {row.answered ? (
                          <span style={{ color: short ? STATUS.warning : '#006300' }}>
                            {short ? 'Too short' : 'Answered'}
                          </span>
                        ) : (
                          <span style={{ color: STATUS.critical }}>Missed</span>
                        )}
                        {row.lead_id ? (
                          <Link
                            href={`/admin/leads/${row.lead_id}`}
                            className="ml-2 text-xs underline"
                          >
                            lead
                          </Link>
                        ) : null}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
          <Hint>
            &quot;Was reading&quot; is the page the matching browsing session landed on — how the
            call gets tied back to an ad. It is a best match on channel and timing, so treat it as
            strong evidence rather than proof.
          </Hint>
        </Panel>
      </div>
    );
  } catch (error) {
    return <SetupNotice error={error} />;
  }
}
