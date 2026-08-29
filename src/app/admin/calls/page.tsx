import Link from 'next/link';
import { parseRange } from '@/lib/admin/range';
import { getCalls, getTrackingNumbers } from '@/lib/admin/queries';
import { count, dateTime, duration, percent } from '@/lib/admin/format';
import { channelLabel } from '@/lib/attribution';
import { serverTranslator } from '@/lib/i18n/server';
import { Empty, Hint, Panel, SetupNotice, StatTile, Table, Td, Th, Warning } from '@/components/admin/ui';
import { STATUS, channelColor } from '@/components/admin/palette';
import { rangeLabel } from '@/lib/i18n/range';

export const dynamic = 'force-dynamic';

/** Calls shorter than this are misdials and wrong numbers, not customers. */
const REAL_CALL_SECONDS = 30;

/**
 * The window the page is read through, named in the reader's language.
 *
 * `parseRange` labels in English because the export and the logs read the same
 * object. The key identifies the window; this only renames it.
 */
export default async function CallsPage({
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
          <h1 className="font-heading text-xl font-bold uppercase tracking-label text-ink">
            {t('work.calls.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-600">{rangeLabel(range, t)}</p>
        </div>

        {numbers.length === 0 && (
          <Warning>
            {t('work.calls.noNumbersBefore')}
            <Link href="/admin/settings" className="underline">
              {t('nav.settings')}
            </Link>
            {t('work.calls.noNumbersAfter')}
          </Warning>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label={t('work.calls.count')}
            value={count(rows.length, t.lang)}
            hint={t.plural(firstTime, 'work.plural.newCaller')}
          />
          <StatTile
            label={t('work.calls.answered')}
            value={count(answered.length, t.lang)}
            hint={
              rows.length
                ? t('work.calls.ofCalls', {
                    pct: percent(answered.length / rows.length, 0, t.lang),
                  })
                : undefined
            }
          />
          <StatTile
            label={t('work.calls.missed')}
            value={count(missed, t.lang)}
            higherIsBetter={false}
            hint={missed ? t('work.calls.missedHint') : t('work.calls.missedNone')}
          />
          <StatTile
            label={t('work.calls.talkTime')}
            value={duration(totalTalk)}
            hint={t('work.calls.overSeconds', {
              n: count(real.length, t.lang),
              seconds: REAL_CALL_SECONDS,
            })}
          />
        </div>

        <Panel title={t('work.calls.log')}>
          {rows.length === 0 ? (
            <Empty>{t('work.calls.empty')}</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>{t('work.calls.when')}</Th>
                  <Th>{t('work.calls.from')}</Th>
                  <Th>{t('work.calls.rang')}</Th>
                  <Th>{t('work.calls.channel')}</Th>
                  <Th>{t('work.calls.town')}</Th>
                  <Th>{t('work.calls.wasReading')}</Th>
                  <Th numeric>{t('work.calls.length')}</Th>
                  <Th>{t('work.calls.result')}</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const seconds = Number(row.duration_seconds ?? 0);
                  const short = Boolean(row.answered) && seconds < REAL_CALL_SECONDS;
                  return (
                    <tr key={String(row.id)}>
                      <Td className="whitespace-nowrap">
                        {dateTime(row.started_at as Date, t.lang)}
                      </Td>
                      <Td className="whitespace-nowrap font-mono text-xs">
                        {(row.caller_number as string) || '—'}
                        {row.is_first_time ? (
                          <span className="ml-2 text-[10px] uppercase tracking-label text-gray-500">
                            {t('work.calls.new')}
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
                            {short ? t('work.calls.tooShort') : t('work.calls.wasAnswered')}
                          </span>
                        ) : (
                          <span style={{ color: STATUS.critical }}>
                            {t('work.calls.wasMissed')}
                          </span>
                        )}
                        {row.lead_id ? (
                          <Link
                            href={`/admin/leads/${row.lead_id}`}
                            className="ml-2 text-xs underline"
                          >
                            {t('work.calls.lead')}
                          </Link>
                        ) : null}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
          <Hint>{t('work.calls.hint')}</Hint>
        </Panel>
      </div>
    );
  } catch (error) {
    return <SetupNotice error={error} />;
  }
}
