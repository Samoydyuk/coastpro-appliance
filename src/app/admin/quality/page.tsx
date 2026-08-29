import { parseRange } from '@/lib/admin/range';
import { getQuality } from '@/lib/admin/queries';
import { count, percent } from '@/lib/admin/format';
import { serverTranslator } from '@/lib/i18n/server';
import { channelLabel } from '@/lib/attribution';
import { Empty, Hint, Panel, SetupNotice, StatTile, Table, Td, Th, Warning } from '@/components/admin/ui';
import { RankedBars } from '@/components/admin/charts';
import { NEUTRAL, STATUS } from '@/components/admin/palette';
import { rangeLabel } from '@/lib/i18n/range';

export const dynamic = 'force-dynamic';

export default async function QualityPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const t = serverTranslator();
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
            {t('website.quality.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {t('website.quality.subtitle', { range: rangeLabel(range, t) })}
          </p>
        </div>

        {undelivered > 0 && (
          <Warning>
            {t('website.quality.undeliveredWarning', {
              notifications: t.plural(undelivered, 'website.plural.notification'),
            })}
          </Warning>
        )}

        {missedCalls > 0 && (
          <Warning>
            {t('website.quality.missedWarning', {
              calls: t.plural(missedCalls, 'website.plural.call'),
            })}
          </Warning>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label={t('website.quality.requestsSeen')}
            value={count(quality.sessions.total, t.lang)}
            hint={t('website.quality.beforeFiltering')}
          />
          <StatTile
            label={t('website.quality.botsFiltered')}
            value={count(quality.sessions.bots, t.lang)}
            higherIsBetter={false}
            hint={t('website.quality.shareOfTraffic', { pct: percent(botShare, 0, t.lang) })}
          />
          <StatTile
            label={t('website.quality.ourOwnVisits')}
            value={count(quality.sessions.internal, t.lang)}
            higherIsBetter={false}
            hint={t('website.quality.excludedElsewhere')}
          />
          <StatTile
            label={t('website.quality.instantBounces')}
            value={count(quality.sessions.bouncedInstantly, t.lang)}
            higherIsBetter={false}
            hint={t('website.quality.instantBouncesHint')}
          />
          <StatTile
            label={t('website.quality.failedNotifications')}
            value={count(undelivered, t.lang)}
            higherIsBetter={false}
            hint={
              undelivered
                ? t('website.quality.needsAttention')
                : t('website.quality.allDelivered')
            }
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title={t('website.quality.botFilter')} subtitle={t('website.quality.botFilterSub')}>
            {quality.botReasons.length === 0 ? (
              <Empty>{t('website.quality.noBots')}</Empty>
            ) : (
              <RankedBars
                items={quality.botReasons.map((row) => ({
                  // The reason is the token matched in the user agent — a
                  // recorded value, left exactly as it was written down.
                  label: row.reason,
                  value: row.total,
                  color: NEUTRAL,
                }))}
              />
            )}
            <Hint>{t('website.quality.botHint')}</Hint>
          </Panel>

          <Panel
            title={t('website.quality.leadQuality')}
            subtitle={t('website.quality.leadQualitySub')}
          >
            {quality.leadQuality.length === 0 ? (
              <Empty>{t('website.quality.noLeads')}</Empty>
            ) : (
              <Table className="min-w-0">
                <thead>
                  <tr>
                    <Th>{t('website.quality.channel')}</Th>
                    <Th numeric>{t('website.quality.leads')}</Th>
                    <Th numeric>{t('website.quality.dup')}</Th>
                    <Th numeric>{t('website.quality.spam')}</Th>
                    <Th numeric>{t('website.quality.lost')}</Th>
                    <Th numeric>{t('website.quality.junkRate')}</Th>
                  </tr>
                </thead>
                <tbody>
                  {quality.leadQuality.map((row) => {
                    const junk = row.leads ? (row.duplicates + row.spam) / row.leads : 0;
                    return (
                      <tr key={row.channel}>
                        <Td>{channelLabel(row.channel)}</Td>
                        <Td numeric>{count(row.leads, t.lang)}</Td>
                        <Td numeric>{count(row.duplicates, t.lang)}</Td>
                        <Td numeric>{count(row.spam, t.lang)}</Td>
                        <Td numeric>{count(row.lost, t.lang)}</Td>
                        <Td numeric>
                          <span style={{ color: junk > 0.3 ? STATUS.critical : undefined }}>
                            {percent(junk, 0, t.lang)}
                          </span>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
            <Hint>{t('website.quality.junkHint')}</Hint>
          </Panel>
        </div>

        <Panel
          title={t('website.quality.callQuality')}
          subtitle={t('website.quality.callQualitySub')}
        >
          {quality.calls.length === 0 ? (
            <Empty>{t('website.quality.noCalls')}</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>{t('website.quality.channel')}</Th>
                  <Th numeric>{t('website.quality.calls')}</Th>
                  <Th numeric>{t('website.quality.missed')}</Th>
                  <Th numeric>{t('website.quality.under30s')}</Th>
                  <Th numeric>{t('website.quality.usable')}</Th>
                  <Th numeric>{t('website.quality.missRate')}</Th>
                </tr>
              </thead>
              <tbody>
                {quality.calls.map((row) => {
                  const usable = row.calls - row.missed - row.tooShort;
                  const missRate = row.calls ? row.missed / row.calls : 0;
                  return (
                    <tr key={row.channel}>
                      <Td>{channelLabel(row.channel)}</Td>
                      <Td numeric>{count(row.calls, t.lang)}</Td>
                      <Td numeric>{count(row.missed, t.lang)}</Td>
                      <Td numeric>{count(row.tooShort, t.lang)}</Td>
                      <Td numeric>{count(usable, t.lang)}</Td>
                      <Td numeric>
                        <span style={{ color: missRate > 0.2 ? STATUS.critical : undefined }}>
                          {percent(missRate, 0, t.lang)}
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
