import Link from 'next/link';
import { listMarketingJobs, marketingFacets, marketingLastRefresh } from '@/lib/marketing/queries';
import { dateTime } from '@/lib/admin/format';
import { serverTranslator } from '@/lib/i18n/server';
import { Empty, Hint, Panel, SetupNotice, Table, Td, Th } from '@/components/admin/ui';
import { MarketingRefresh } from '@/components/admin/MarketingRefresh';

export const dynamic = 'force-dynamic';

// `value` is what the filter sends and what the query matches on; only the
// label is the reader's.
const CONTENT_STATUSES = [
  { value: 'none', labelKey: 'marketing.jobs.status.none' },
  { value: 'draft', labelKey: 'marketing.jobs.status.draft' },
  { value: 'generated', labelKey: 'marketing.jobs.status.generated' },
  { value: 'edited', labelKey: 'marketing.jobs.status.edited' },
  { value: 'published', labelKey: 'marketing.jobs.status.published' },
  { value: 'skipped', labelKey: 'marketing.jobs.status.skipped' },
] as const;

const field =
  'h-9 rounded-card border border-primary-500/30 bg-[#fcfcfb] px-3 text-sm';
const legend = 'font-heading text-[10px] uppercase tracking-label text-gray-500';

export default async function MarketingPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const filters = {
    search: (searchParams.q as string) || undefined,
    applianceType: (searchParams.type as string) || undefined,
    brand: (searchParams.brand as string) || undefined,
    city: (searchParams.city as string) || undefined,
    errorCode: (searchParams.code as string) || undefined,
    contentStatus: (searchParams.content as string) || undefined,
    offset: Number(searchParams.offset ?? 0) || 0,
    limit: 50,
  };
  const t = serverTranslator();

  try {
    const [{ rows, total }, facets, lastRefresh] = await Promise.all([
      listMarketingJobs(filters),
      marketingFacets(),
      marketingLastRefresh(),
    ]);

    const active =
      filters.search ||
      filters.applianceType ||
      filters.brand ||
      filters.city ||
      filters.errorCode ||
      filters.contentStatus;

    const page = (offset: number) =>
      `/admin/marketing?${new URLSearchParams({
        ...(filters.search ? { q: filters.search } : {}),
        ...(filters.applianceType ? { type: filters.applianceType } : {}),
        ...(filters.brand ? { brand: filters.brand } : {}),
        ...(filters.city ? { city: filters.city } : {}),
        ...(filters.errorCode ? { code: filters.errorCode } : {}),
        ...(filters.contentStatus ? { content: filters.contentStatus } : {}),
        offset: String(offset),
      })}`;

    return (
      <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-xl font-bold uppercase tracking-label text-ink">
              {t('marketing.jobs.title')}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {total === 0
                ? t('marketing.jobs.none')
                : t('marketing.jobs.releasedCount', {
                    jobs: t.plural(total, 'marketing.plural.finishedJob'),
                  })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/marketing/voice"
              className="inline-flex h-8 items-center rounded-card border border-primary-500/30 px-3 font-heading text-[10px] font-semibold uppercase tracking-label text-gray-600 hover:border-ink hover:text-ink"
            >
              {t('marketing.jobs.houseVoice')}
            </Link>
            <MarketingRefresh
              lastRefresh={lastRefresh ? dateTime(lastRefresh, t.lang) : null}
            />
          </div>
        </header>

        {total === 0 && (
          <Panel>
            <Empty>{t('marketing.jobs.emptyState')}</Empty>
          </Panel>
        )}

        {total > 0 && (
          <>
            <Panel>
              <form method="get" className="flex flex-wrap items-end gap-3">
                <label className="flex flex-col gap-1">
                  <span className={legend}>{t('marketing.jobs.search')}</span>
                  <input
                    type="search"
                    name="q"
                    defaultValue={filters.search ?? ''}
                    placeholder={t('marketing.jobs.searchPlaceholder')}
                    className={`${field} w-56`}
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className={legend}>{t('marketing.jobs.appliance')}</span>
                  <select name="type" defaultValue={filters.applianceType ?? ''} className={field}>
                    <option value="">{t('marketing.any')}</option>
                    {facets.types.map((entry) => (
                      <option key={entry} value={entry}>
                        {entry}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className={legend}>{t('marketing.jobs.brand')}</span>
                  <select name="brand" defaultValue={filters.brand ?? ''} className={field}>
                    <option value="">{t('marketing.any')}</option>
                    {facets.brands.map((entry) => (
                      <option key={entry} value={entry}>
                        {entry}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className={legend}>{t('marketing.jobs.town')}</span>
                  <select name="city" defaultValue={filters.city ?? ''} className={field}>
                    <option value="">{t('marketing.any')}</option>
                    {facets.cities.map((entry) => (
                      <option key={entry} value={entry}>
                        {entry}
                      </option>
                    ))}
                  </select>
                </label>

                {facets.codes.length > 0 && (
                  <label className="flex flex-col gap-1">
                    <span className={legend}>{t('marketing.jobs.errorCode')}</span>
                    <select name="code" defaultValue={filters.errorCode ?? ''} className={field}>
                      <option value="">{t('marketing.any')}</option>
                      {facets.codes.map((entry) => (
                        <option key={entry} value={entry}>
                          {entry}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <label className="flex flex-col gap-1">
                  <span className={legend}>{t('marketing.jobs.content')}</span>
                  <select name="content" defaultValue={filters.contentStatus ?? ''} className={field}>
                    <option value="">{t('marketing.any')}</option>
                    {CONTENT_STATUSES.map((entry) => (
                      <option key={entry.value} value={entry.value}>
                        {t(entry.labelKey)}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="submit"
                  className="h-9 rounded-card bg-ink px-4 font-heading text-[10px] font-semibold uppercase tracking-label text-cream"
                >
                  {t('marketing.action.apply')}
                </button>
                {active && (
                  <Link
                    href="/admin/marketing"
                    className="h-9 self-end px-2 font-heading text-[10px] uppercase tracking-label leading-9 text-gray-500 hover:text-ink"
                  >
                    {t('marketing.action.clear')}
                  </Link>
                )}
              </form>
            </Panel>

            <Panel>
              {rows.length === 0 ? (
                <Empty>{t('marketing.jobs.noMatch')}</Empty>
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <Th>{t('marketing.col.finished')}</Th>
                      <Th>{t('marketing.jobs.appliance')}</Th>
                      <Th>{t('marketing.jobs.brand')}</Th>
                      <Th>{t('marketing.col.fault')}</Th>
                      <Th>{t('marketing.col.codes')}</Th>
                      <Th>{t('marketing.jobs.town')}</Th>
                      <Th numeric>{t('marketing.col.photos')}</Th>
                      <Th>{t('marketing.jobs.content')}</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.job_id} className="hover:bg-cream-dark/40">
                        <Td>
                          <Link
                            href={`/admin/marketing/${row.job_id}`}
                            className="whitespace-nowrap text-gray-700 underline-offset-2 hover:underline"
                          >
                            {row.completed_at ? dateTime(row.completed_at, t.lang) : '—'}
                          </Link>
                        </Td>
                        <Td>
                          <Link
                            href={`/admin/marketing/${row.job_id}`}
                            className="font-medium text-ink"
                          >
                            {row.appliance_type || t('marketing.jobs.appliance')}
                          </Link>
                        </Td>
                        <Td>{row.manufacturer || '—'}</Td>
                        <Td className="max-w-sm truncate text-gray-600">
                          {row.diagnosis || row.repair_performed || '—'}
                        </Td>
                        <Td className="whitespace-nowrap font-mono text-xs">
                          {row.error_codes.length ? row.error_codes.join(', ') : '—'}
                        </Td>
                        <Td>{row.city || '—'}</Td>
                        <Td numeric>
                          {row.photo_count === 0
                            ? '—'
                            : row.selected_photos > 0
                              ? `${row.selected_photos}/${row.photo_count}`
                              : row.photo_count}
                        </Td>
                        <Td>
                          {row.channels.length === 0 ? (
                            <span className="text-gray-500">—</span>
                          ) : (
                            t.plural(row.channels.length, 'marketing.plural.piece')
                          )}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              {total > filters.limit && (
                <div className="mt-4 flex items-center justify-between text-xs text-gray-600">
                  <span>
                    {filters.offset + 1}–{Math.min(filters.offset + filters.limit, total)}{' '}
                    {t('common.of')} {total}
                  </span>
                  <div className="flex gap-2">
                    {filters.offset > 0 && (
                      <Link
                        href={page(Math.max(0, filters.offset - filters.limit))}
                        className="font-heading text-[10px] uppercase tracking-label hover:text-ink"
                      >
                        {t('marketing.jobs.newer')}
                      </Link>
                    )}
                    {filters.offset + filters.limit < total && (
                      <Link
                        href={page(filters.offset + filters.limit)}
                        className="font-heading text-[10px] uppercase tracking-label hover:text-ink"
                      >
                        {t('marketing.jobs.older')}
                      </Link>
                    )}
                  </div>
                </div>
              )}

              <Hint>{t('marketing.jobs.listHint')}</Hint>
            </Panel>
          </>
        )}
      </div>
    );
  } catch (error) {
    return <SetupNotice error={error} />;
  }
}
