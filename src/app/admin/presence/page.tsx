import { parseRange } from '@/lib/admin/range';
import { getPresence, getPresenceImportRuns } from '@/lib/admin/presence-queries';
import { count, delta, percent, relativeTime, shortDate } from '@/lib/admin/format';
import { Empty, Hint, Panel, SetupNotice, Table, Td, Th, Warning } from '@/components/admin/ui';
import { PresenceEntry } from '@/components/admin/PresenceEntry';
import {
  PresenceConnections,
  type ConnectionState,
} from '@/components/admin/PresenceConnections';
import {
  getGoogleConnection,
  getMetaConnection,
  getSearchConsoleConnection,
  searchConsoleAppConfigured,
  googleAppConfigured,
  metaAppConfigured,
} from '@/lib/presence/credentials';

export const dynamic = 'force-dynamic';

/**
 * Everywhere the business appears that is not its own website.
 *
 * Two kinds of row on one screen, and the difference is stated rather than
 * smoothed over: Google, Instagram and Facebook are fetched; Yelp and Apple are
 * typed in, because those two report only into their own dashboards. A console
 * that showed both the same way would let a figure entered a month ago pass for
 * this morning's, which is the one failure mode that makes the whole screen
 * worse than no screen.
 *
 * So every channel carries when it was last written and by what. Anything older
 * than a week says so in plain words.
 */

const STALE_AFTER_DAYS = 7;

function ageInDays(value: string | null): number | null {
  if (!value) return null;
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return null;
  return (Date.now() - then) / 86_400_000;
}

function sourceLabel(source: string | null): string {
  if (source === 'gbp_api') return 'fetched from Google';
  if (source === 'meta_api') return 'fetched from Meta';
  if (source === 'manual_entry') return 'typed in';
  return source ?? '—';
}

export default async function PresencePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const range = parseRange({
    range: searchParams.range as string,
    from: searchParams.from as string,
    to: searchParams.to as string,
  });

  const connected = searchParams.connected as string | undefined;
  const failed = searchParams.error as string | undefined;

  try {
    const [channels, runs, google, meta, searchConsole] = await Promise.all([
      getPresence(range),
      getPresenceImportRuns(),
      getGoogleConnection(),
      getMetaConnection(),
      getSearchConsoleConnection(),
    ]);

    const live = channels.filter((c) => c.hasData);
    const manual = channels.filter((c) => !c.channel.automated);

    const connections: ConnectionState[] = [
      {
        provider: 'google',
        label: 'Google Business Profile',
        appReady: googleAppConfigured(),
        connectedAs: google
          ? [google.locationName, google.accountName].filter(Boolean).join(' · ') || 'Connected'
          : null,
        connectedAt: google?.connectedAt ?? null,
        setupHint: 'Set GBP_CLIENT_ID and GBP_CLIENT_SECRET first — those register the app itself.',
      },
      {
        // Deliberately alongside the listings rather than on its own screen:
        // this is the same Connect flow and the same Google account, and the
        // Search Console API needs no approval queue, so it will usually be
        // working long before the Business Profile half is.
        provider: 'search-console',
        label: 'Google Search Console',
        appReady: searchConsoleAppConfigured(),
        connectedAs: searchConsole ? searchConsole.siteUrl : null,
        connectedAt: searchConsole?.connectedAt ?? null,
        setupHint:
          'Uses the same GBP_CLIENT_ID and GBP_CLIENT_SECRET, and needs the Search Console API switched on in the same Google Cloud project.',
      },
      {
        provider: 'meta',
        label: 'Instagram & Facebook',
        appReady: metaAppConfigured(),
        connectedAs: meta
          ? [meta.pageName, meta.igUsername ? `@${meta.igUsername}` : null]
              .filter(Boolean)
              .join(' · ') || 'Connected'
          : null,
        connectedAt: meta?.connectedAt ?? null,
        setupHint: 'Set META_APP_ID and META_APP_SECRET first — those register the app itself.',
      },
    ];

    return (
      <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-xl font-bold uppercase tracking-label text-ink">
              Presence
            </h1>
            <p className="mt-1 text-sm text-gray-600">{range.label}</p>
          </div>
          <PresenceEntry channels={manual.map((c) => c.channel)} />
        </header>

        {connected && (
          <div className="rounded-card border border-primary-700/40 bg-primary-700/5 px-4 py-3 text-sm text-ink">
            {connected}
          </div>
        )}
        {failed && <Warning>{failed}</Warning>}

        <Panel
          title="Connected accounts"
          subtitle="Connecting an account is a click; registering the app with Google and Meta is a one-time job in their developer consoles"
        >
          <PresenceConnections connections={connections} />
        </Panel>

        {!live.length && (
          <Warning>
            No listing has reported yet. Google, Instagram and Facebook fill themselves in once
            their accounts are connected above; Yelp and Apple are entered by hand.
          </Warning>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {channels.map((summary) => {
            const { channel } = summary;
            const age = ageInDays(summary.lastUpdated);
            const stale = age !== null && age > STALE_AFTER_DAYS;

            return (
              <Panel
                key={channel.key}
                title={channel.name}
                subtitle={
                  summary.lastUpdated
                    ? `${sourceLabel(summary.lastSource)} · ${relativeTime(summary.lastUpdated)}${
                        summary.lastDay ? ` · through ${shortDate(summary.lastDay)}` : ''
                      }`
                    : channel.automated
                      ? 'Nothing fetched yet'
                      : 'Nothing entered yet'
                }
              >
                {stale && (
                  <div className="mb-4">
                    <Warning>
                      {channel.automated
                        ? `No new rows for ${Math.round(age!)} days — the importer may have stopped or the credentials may have lapsed.`
                        : `Last entered ${Math.round(age!)} days ago. These numbers are older than the range above.`}
                    </Warning>
                  </div>
                )}

                {!summary.hasData ? (
                  <Empty>
                    {channel.manualReason ??
                      'Nothing for this range. It will fill in once the importer has credentials.'}
                  </Empty>
                ) : (
                  <Table>
                    <thead>
                      <tr>
                        <Th>Measure</Th>
                        <Th numeric>This period</Th>
                        <Th numeric>Change</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {channel.measures.map((measure) => {
                        const now = summary.totals[measure.key] ?? 0;
                        const before = summary.previousTotals[measure.key] ?? 0;
                        const change = delta(now, before);
                        return (
                          <tr key={measure.key}>
                            <Td>
                              {measure.label}
                              {measure.hint && (
                                <span className="block text-[11px] text-gray-500">{measure.hint}</span>
                              )}
                            </Td>
                            <Td numeric>{count(now)}</Td>
                            <Td numeric>
                              {change === null ? (
                                <span className="text-gray-400">—</span>
                              ) : (
                                <span
                                  className={change >= 0 ? 'text-primary-700' : 'text-red-800'}
                                >
                                  {change >= 0 ? '+' : ''}
                                  {percent(change)}
                                </span>
                              )}
                            </Td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                )}

                {!channel.automated && channel.manualReason && summary.hasData && (
                  <Hint>{channel.manualReason}</Hint>
                )}
              </Panel>
            );
          })}
        </div>

        <Panel
          title="Importer runs"
          subtitle="An importer that quietly stopped looks exactly like a quiet month"
        >
          {!runs.length ? (
            <Empty>No importer has run yet.</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Source</Th>
                  <Th>Started</Th>
                  <Th numeric>Rows</Th>
                  <Th>Outcome</Th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run, index) => (
                  <tr key={`${run.source}-${run.started_at}-${index}`}>
                    <Td>{sourceLabel(run.source)}</Td>
                    <Td>{relativeTime(run.started_at)}</Td>
                    <Td numeric>{count(run.rows_written ?? 0)}</Td>
                    <Td>
                      {run.error ? (
                        <span className="text-red-800">{run.error.slice(0, 120)}</span>
                      ) : run.finished_at ? (
                        <span className="text-gray-500">ok</span>
                      ) : (
                        <span className="text-gray-400">running</span>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Panel>

        <Hint>
          Nothing here is added to leads or calls. A tap on Google&rsquo;s call button and a phone
          that actually rang are two different events, and the same customer often causes both.
        </Hint>
      </div>
    );
  } catch (error) {
    return <SetupNotice error={error} />;
  }
}
