import { parseRange } from '@/lib/admin/range';
import { getPages } from '@/lib/admin/queries';
import { count, duration, percent } from '@/lib/admin/format';
import { numberLocale } from '@/lib/i18n';
import { serverTranslator } from '@/lib/i18n/server';
import { Empty, Hint, Panel, SetupNotice, Table, Td, Th } from '@/components/admin/ui';
import { STATUS } from '@/components/admin/palette';
import { rangeLabel } from '@/lib/i18n/range';

export const dynamic = 'force-dynamic';

export default async function PagesPage({
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
    const { landing, viewed } = await getPages(range);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-xl font-bold uppercase tracking-label text-ink">
            {t('website.pages.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-600">{rangeLabel(range, t)}</p>
        </div>

        <Panel title={t('website.pages.landing')} subtitle={t('website.pages.landingSub')}>
          {landing.length === 0 ? (
            <Empty>{t('website.pages.noVisits')}</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>{t('website.pages.page')}</Th>
                  <Th numeric>{t('website.pages.visits')}</Th>
                  <Th numeric>{t('website.pages.bounced')}</Th>
                  <Th numeric>{t('website.pages.avgTime')}</Th>
                  <Th numeric>{t('website.pages.avgScroll')}</Th>
                  <Th numeric>{t('website.pages.converted')}</Th>
                  <Th numeric>{t('website.pages.convRate')}</Th>
                </tr>
              </thead>
              <tbody>
                {landing.map((row) => {
                  const bounceRate = row.sessions ? row.bounces / row.sessions : 0;
                  const conversionRate = row.sessions ? row.conversions / row.sessions : 0;
                  return (
                    <tr key={row.path}>
                      <Td className="max-w-[320px] truncate font-mono text-xs" >{row.path}</Td>
                      <Td numeric>{count(row.sessions, t.lang)}</Td>
                      <Td numeric>
                        <span style={{ color: bounceRate > 0.7 ? STATUS.critical : undefined }}>
                          {percent(bounceRate, 0, t.lang)}
                        </span>
                      </Td>
                      <Td numeric>{duration(row.avgSeconds)}</Td>
                      <Td numeric>{count(row.avgScroll, t.lang)}%</Td>
                      <Td numeric>{count(row.conversions, t.lang)}</Td>
                      <Td numeric>{percent(conversionRate, 1, t.lang)}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
          <Hint>{t('website.pages.bounceHint')}</Hint>
        </Panel>

        <Panel title={t('website.pages.mostViewed')} subtitle={t('website.pages.mostViewedSub')}>
          {viewed.length === 0 ? (
            <Empty>{t('website.pages.noViews')}</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>{t('website.pages.page')}</Th>
                  <Th numeric>{t('website.pages.views')}</Th>
                  <Th numeric>{t('website.pages.visits')}</Th>
                  <Th numeric>{t('website.pages.viewsPerVisit')}</Th>
                </tr>
              </thead>
              <tbody>
                {viewed.map((row) => (
                  <tr key={row.path}>
                    <Td className="max-w-[320px] truncate font-mono text-xs">{row.path}</Td>
                    <Td numeric>{count(row.views, t.lang)}</Td>
                    <Td numeric>{count(row.sessions, t.lang)}</Td>
                    <Td numeric>
                      {/* Through Intl rather than toFixed: this is the one
                          number in the table that would keep a full stop while
                          every figure beside it uses a comma. */}
                      {(row.views / Math.max(1, row.sessions)).toLocaleString(
                        numberLocale(t.lang),
                        { minimumFractionDigits: 1, maximumFractionDigits: 1 }
                      )}
                    </Td>
                  </tr>
                ))}
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
