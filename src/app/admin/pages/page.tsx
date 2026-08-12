import { parseRange } from '@/lib/admin/range';
import { getPages } from '@/lib/admin/queries';
import { count, duration, percent } from '@/lib/admin/format';
import { Empty, Hint, Panel, SetupNotice, Table, Td, Th } from '@/components/admin/ui';
import { STATUS } from '@/components/admin/palette';

export const dynamic = 'force-dynamic';

export default async function PagesPage({
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
    const { landing, viewed } = await getPages(range);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-xl font-bold uppercase tracking-label text-ink">Pages</h1>
          <p className="mt-1 text-sm text-gray-600">{range.label}</p>
        </div>

        <Panel
          title="Landing pages"
          subtitle="Where visits begin — the pages ads actually pay for"
        >
          {landing.length === 0 ? (
            <Empty>No visits recorded yet.</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Page</Th>
                  <Th numeric>Visits</Th>
                  <Th numeric>Bounced</Th>
                  <Th numeric>Avg. time</Th>
                  <Th numeric>Avg. scroll</Th>
                  <Th numeric>Converted</Th>
                  <Th numeric>Conv. rate</Th>
                </tr>
              </thead>
              <tbody>
                {landing.map((row) => {
                  const bounceRate = row.sessions ? row.bounces / row.sessions : 0;
                  const conversionRate = row.sessions ? row.conversions / row.sessions : 0;
                  return (
                    <tr key={row.path}>
                      <Td className="max-w-[320px] truncate font-mono text-xs" >{row.path}</Td>
                      <Td numeric>{count(row.sessions)}</Td>
                      <Td numeric>
                        <span style={{ color: bounceRate > 0.7 ? STATUS.critical : undefined }}>
                          {percent(bounceRate, 0)}
                        </span>
                      </Td>
                      <Td numeric>{duration(row.avgSeconds)}</Td>
                      <Td numeric>{row.avgScroll}%</Td>
                      <Td numeric>{count(row.conversions)}</Td>
                      <Td numeric>{percent(conversionRate)}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
          <Hint>
            A bounce here means one page, under ten seconds, nothing clicked. On a landing page
            being paid for, anything above 70% usually means the ad promised something the page
            does not deliver.
          </Hint>
        </Panel>

        <Panel title="Most viewed" subtitle="Every page, however people got to it">
          {viewed.length === 0 ? (
            <Empty>No page views recorded yet.</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Page</Th>
                  <Th numeric>Views</Th>
                  <Th numeric>Visits</Th>
                  <Th numeric>Views per visit</Th>
                </tr>
              </thead>
              <tbody>
                {viewed.map((row) => (
                  <tr key={row.path}>
                    <Td className="max-w-[320px] truncate font-mono text-xs">{row.path}</Td>
                    <Td numeric>{count(row.views)}</Td>
                    <Td numeric>{count(row.sessions)}</Td>
                    <Td numeric>{(row.views / Math.max(1, row.sessions)).toFixed(1)}</Td>
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
