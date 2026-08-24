import { parseRange } from '@/lib/admin/range';
import { getQuality } from '@/lib/admin/queries';
import { count, percent } from '@/lib/admin/format';
import { channelLabel } from '@/lib/attribution';
import { Empty, Hint, Panel, SetupNotice, StatTile, Table, Td, Th, Warning } from '@/components/admin/ui';
import { RankedBars } from '@/components/admin/charts';
import { NEUTRAL, STATUS } from '@/components/admin/palette';

export const dynamic = 'force-dynamic';

export default async function QualityPage({
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
    const quality = await getQuality(range);
    const botShare = quality.sessions.total ? quality.sessions.bots / quality.sessions.total : 0;
    const undelivered = quality.leadQuality.reduce((sum, row) => sum + row.undelivered, 0);
    const missedCalls = quality.calls.reduce((sum, row) => sum + row.missed, 0);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-xl font-bold uppercase tracking-label text-ink">
            Traffic quality
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {range.label} — what the headline numbers would be hiding
          </p>
        </div>

        {undelivered > 0 && (
          <Warning>
            {count(undelivered)} lead notification{undelivered === 1 ? '' : 's'} failed to send by
            email. Those people filled in the form and nobody was told. Check that RESEND_API_KEY is
            set and the sending domain is verified.
          </Warning>
        )}

        {missedCalls > 0 && (
          <Warning>
            {count(missedCalls)} call{missedCalls === 1 ? '' : 's'} went unanswered in this period.
            On paid channels that is money spent to make a phone ring that nobody picked up.
          </Warning>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Requests seen"
            value={count(quality.sessions.total)}
            hint="before filtering"
          />
          <StatTile
            label="Bots filtered"
            value={count(quality.sessions.bots)}
            higherIsBetter={false}
            hint={percent(botShare, 0) + ' of all traffic'}
          />
          <StatTile
            label="Our own visits"
            value={count(quality.sessions.internal)}
            higherIsBetter={false}
            hint="excluded everywhere else"
          />
          <StatTile
            label="Instant bounces"
            value={count(quality.sessions.bouncedInstantly)}
            higherIsBetter={false}
            hint="one page, under five seconds"
          />
          <StatTile
            label="Failed notifications"
            value={count(undelivered)}
            higherIsBetter={false}
            hint={undelivered ? 'needs attention' : 'all delivered'}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="What the bot filter caught" subtitle="Matched token in the user agent">
            {quality.botReasons.length === 0 ? (
              <Empty>No bot traffic in this period.</Empty>
            ) : (
              <RankedBars
                items={quality.botReasons.map((row) => ({
                  label: row.reason,
                  value: row.total,
                  color: NEUTRAL,
                }))}
              />
            )}
            <Hint>
              These visits are excluded everywhere else in the console. Left in, a crawler that
              hits every service page hourly would sit at the top of the most-viewed report and
              drag every bounce rate with it.
            </Hint>
          </Panel>

          <Panel title="Lead quality by channel" subtitle="Duplicates, spam and lost">
            {quality.leadQuality.length === 0 ? (
              <Empty>No leads in this period.</Empty>
            ) : (
              <Table className="min-w-0">
                <thead>
                  <tr>
                    <Th>Channel</Th>
                    <Th numeric>Leads</Th>
                    <Th numeric>Dup</Th>
                    <Th numeric>Spam</Th>
                    <Th numeric>Lost</Th>
                    <Th numeric>Junk rate</Th>
                  </tr>
                </thead>
                <tbody>
                  {quality.leadQuality.map((row) => {
                    const junk = row.leads ? (row.duplicates + row.spam) / row.leads : 0;
                    return (
                      <tr key={row.channel}>
                        <Td>{channelLabel(row.channel)}</Td>
                        <Td numeric>{count(row.leads)}</Td>
                        <Td numeric>{count(row.duplicates)}</Td>
                        <Td numeric>{count(row.spam)}</Td>
                        <Td numeric>{count(row.lost)}</Td>
                        <Td numeric>
                          <span style={{ color: junk > 0.3 ? STATUS.critical : undefined }}>
                            {percent(junk, 0)}
                          </span>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
            <Hint>
              A channel with a high junk rate is not cheap just because its cost per lead looks
              low. This is the column that tells the difference.
            </Hint>
          </Panel>
        </div>

        <Panel title="Call quality by channel" subtitle="Missed calls and calls too short to be real">
          {quality.calls.length === 0 ? (
            <Empty>No calls recorded in this period.</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Channel</Th>
                  <Th numeric>Calls</Th>
                  <Th numeric>Missed</Th>
                  <Th numeric>Under 30s</Th>
                  <Th numeric>Usable</Th>
                  <Th numeric>Miss rate</Th>
                </tr>
              </thead>
              <tbody>
                {quality.calls.map((row) => {
                  const usable = row.calls - row.missed - row.tooShort;
                  const missRate = row.calls ? row.missed / row.calls : 0;
                  return (
                    <tr key={row.channel}>
                      <Td>{channelLabel(row.channel)}</Td>
                      <Td numeric>{count(row.calls)}</Td>
                      <Td numeric>{count(row.missed)}</Td>
                      <Td numeric>{count(row.tooShort)}</Td>
                      <Td numeric>{count(usable)}</Td>
                      <Td numeric>
                        <span style={{ color: missRate > 0.2 ? STATUS.critical : undefined }}>
                          {percent(missRate, 0)}
                        </span>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Panel>
      </div>
    );
  } catch (error) {
    return <SetupNotice error={error} />;
  }
}
