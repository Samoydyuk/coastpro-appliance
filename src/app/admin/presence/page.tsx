import { parseRange } from '@/lib/admin/range';
import { getPresence, getPresenceImportRuns } from '@/lib/admin/presence-queries';
import { count, delta, percent, shortDate } from '@/lib/admin/format';
import { serverTranslator } from '@/lib/i18n/server';
import type { TranslationKey, Translator } from '@/lib/i18n';
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
  getSearchConsoleServiceAccount,
  searchConsoleAppConfigured,
  googleAppConfigured,
  metaAppConfigured,
} from '@/lib/presence/credentials';
import { rangeLabel } from '@/lib/i18n/range';

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

function sourceLabel(source: string | null, t: Translator): string {
  // The `source` values are what the importers write into the row; only the
  // words shown for the three we know about move.
  if (source === 'gbp_api') return t('marketing.presence.source.gbp_api');
  if (source === 'meta_api') return t('marketing.presence.source.meta_api');
  if (source === 'manual_entry') return t('marketing.presence.source.manual_entry');
  return source ?? '—';
}

/**
 * How long ago, in this reader's language.
 *
 * `relativeTime` in `format.ts` takes no language, and this whole screen is an
 * argument about how old each number is — so the words come from the dictionary
 * instead. Short forms, because these sit inside a panel subtitle.
 */
function ago(value: string | Date | null | undefined, t: Translator): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return t('marketing.ago.s', { n: seconds });
  if (seconds < 3600) return t('marketing.ago.m', { n: Math.round(seconds / 60) });
  if (seconds < 86_400) return t('marketing.ago.h', { n: Math.round(seconds / 3600) });
  return t('marketing.ago.d', { n: Math.round(seconds / 86_400) });
}

/**
 * A label out of the presence catalogue, which lives beside the importers in
 * `lib/presence/store.ts` and is shared with them. A channel or measure added
 * there and not yet named here keeps its own English rather than showing a key.
 */
function catalogue(t: Translator, key: string, fallback: string): string {
  const text = t(key as TranslationKey);
  return text === key ? fallback : text;
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
  const t = serverTranslator();

  try {
    const [channels, runs, google, meta, searchConsole, serviceAccount] = await Promise.all([
      getPresence(range),
      getPresenceImportRuns(),
      getGoogleConnection(),
      getMetaConnection(),
      getSearchConsoleConnection(),
      Promise.resolve(getSearchConsoleServiceAccount()),
    ]);

    const live = channels.filter((c) => c.hasData);
    const manual = channels.filter((c) => !c.channel.automated);

    const connections: ConnectionState[] = [
      {
        provider: 'google',
        label: 'Google Business Profile',
        appReady: googleAppConfigured(),
        connectedAs: google
          ? [google.locationName, google.accountName].filter(Boolean).join(' · ') ||
            t('marketing.presence.connectedFallback')
          : null,
        connectedAt: google?.connectedAt ?? null,
        setupHint: t('marketing.presence.googleSetup'),
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
        managedByKey: serviceAccount
          ? t('marketing.presence.serviceAccount', { email: serviceAccount.client_email })
          : null,
        setupHint: t('marketing.presence.searchConsoleSetup'),
      },
      {
        provider: 'meta',
        label: 'Instagram & Facebook',
        appReady: metaAppConfigured(),
        connectedAs: meta
          ? [meta.pageName, meta.igUsername ? `@${meta.igUsername}` : null]
              .filter(Boolean)
              .join(' · ') || t('marketing.presence.connectedFallback')
          : null,
        connectedAt: meta?.connectedAt ?? null,
        setupHint: t('marketing.presence.metaSetup'),
      },
    ];

    return (
      <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-xl font-bold uppercase tracking-label text-ink">
              {t('marketing.presence.title')}
            </h1>
            <p className="mt-1 text-sm text-gray-600">{rangeLabel(range, t)}</p>
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
          title={t('marketing.presence.connections')}
          subtitle={t('marketing.presence.connectionsSub')}
        >
          <PresenceConnections connections={connections} />
        </Panel>

        {!live.length && <Warning>{t('marketing.presence.noneYet')}</Warning>}

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
                    ? `${sourceLabel(summary.lastSource, t)} · ${ago(summary.lastUpdated, t)}${
                        summary.lastDay
                          ? t('marketing.presence.through', {
                              day: shortDate(summary.lastDay, t.lang),
                            })
                          : ''
                      }`
                    : channel.automated
                      ? t('marketing.presence.nothingFetched')
                      : t('marketing.presence.nothingEntered')
                }
              >
                {stale && (
                  <div className="mb-4">
                    <Warning>
                      {channel.automated
                        ? t('marketing.presence.staleAuto', {
                            days: t.plural(Math.round(age!), 'plural.day'),
                          })
                        : t('marketing.presence.staleManual', {
                            days: t.plural(Math.round(age!), 'plural.day'),
                          })}
                    </Warning>
                  </div>
                )}

                {!summary.hasData ? (
                  <Empty>
                    {channel.manualReason
                      ? catalogue(
                          t,
                          `marketing.presence.reason.${channel.key}`,
                          channel.manualReason
                        )
                      : t('marketing.presence.emptyRange')}
                  </Empty>
                ) : (
                  <Table>
                    <thead>
                      <tr>
                        <Th>{t('marketing.col.measure')}</Th>
                        <Th numeric>{t('marketing.col.thisPeriod')}</Th>
                        <Th numeric>{t('marketing.col.change')}</Th>
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
                              {catalogue(
                                t,
                                `marketing.presence.measure.${channel.key}.${measure.key}`,
                                measure.label
                              )}
                              {measure.hint && (
                                <span className="block text-[11px] text-gray-500">
                                  {catalogue(
                                    t,
                                    `marketing.presence.hint.${channel.key}.${measure.key}`,
                                    measure.hint
                                  )}
                                </span>
                              )}
                            </Td>
                            <Td numeric>{count(now, t.lang)}</Td>
                            <Td numeric>
                              {change === null ? (
                                <span className="text-gray-400">—</span>
                              ) : (
                                <span
                                  className={change >= 0 ? 'text-primary-700' : 'text-red-800'}
                                >
                                  {change >= 0 ? '+' : ''}
                                  {percent(change, 1, t.lang)}
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
                  <Hint>
                    {catalogue(
                      t,
                      `marketing.presence.reason.${channel.key}`,
                      channel.manualReason
                    )}
                  </Hint>
                )}
              </Panel>
            );
          })}
        </div>

        <Panel title={t('marketing.presence.runs')} subtitle={t('marketing.presence.runsSub')}>
          {!runs.length ? (
            <Empty>{t('marketing.presence.noRuns')}</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>{t('marketing.col.source')}</Th>
                  <Th>{t('marketing.col.started')}</Th>
                  <Th numeric>{t('marketing.col.rows')}</Th>
                  <Th>{t('marketing.col.outcome')}</Th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run, index) => (
                  <tr key={`${run.source}-${run.started_at}-${index}`}>
                    <Td>{sourceLabel(run.source, t)}</Td>
                    <Td>{ago(run.started_at, t)}</Td>
                    <Td numeric>{count(run.rows_written ?? 0, t.lang)}</Td>
                    <Td>
                      {run.error ? (
                        // The importer's own message, left as it was written.
                        <span className="text-red-800">{run.error.slice(0, 120)}</span>
                      ) : run.finished_at ? (
                        <span className="text-gray-500">{t('marketing.presence.ok')}</span>
                      ) : (
                        <span className="text-gray-400">{t('marketing.presence.running')}</span>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Panel>

        <Hint>{t('marketing.presence.footHint')}</Hint>
      </div>
    );
  } catch (error) {
    return <SetupNotice error={error} />;
  }
}
