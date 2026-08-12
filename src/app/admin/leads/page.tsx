import Link from 'next/link';
import { parseRange } from '@/lib/admin/range';
import { getChannels, getLeads } from '@/lib/admin/queries';
import { count, dateTime, duration, money } from '@/lib/admin/format';
import { channelLabel } from '@/lib/attribution';
import { Empty, Hint, Panel, SetupNotice, StatusPill, Table, Td, Th } from '@/components/admin/ui';
import { channelColor } from '@/components/admin/palette';

export const dynamic = 'force-dynamic';

const STATUSES = ['new', 'contacted', 'booked', 'won', 'lost', 'spam'];

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const range = parseRange({
    range: searchParams.range as string,
    from: searchParams.from as string,
    to: searchParams.to as string,
  });

  const status = (searchParams.status as string) || undefined;
  const channel = (searchParams.channel as string) || undefined;
  const search = (searchParams.q as string) || undefined;
  const offset = Number(searchParams.offset ?? 0) || 0;
  const limit = 50;

  try {
    const [{ rows, total }, channels] = await Promise.all([
      getLeads(range, { status, channel, search, limit, offset }),
      getChannels(range),
    ]);

    const exportQuery = new URLSearchParams({
      range: range.key,
      ...(status ? { status } : {}),
      ...(channel ? { channel } : {}),
      ...(search ? { q: search } : {}),
    }).toString();

    return (
      <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-xl font-bold uppercase tracking-label text-ink">
              Leads
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {count(total)} in {range.label.toLowerCase()}
            </p>
          </div>
          <a
            href={`/api/admin/export?type=leads&${exportQuery}`}
            className="inline-flex h-8 items-center rounded-card border border-primary-500/30 px-3 font-heading text-[10px] font-semibold uppercase tracking-label text-gray-600 hover:border-ink hover:text-ink"
          >
            Export CSV
          </a>
        </header>

        <Panel>
          <form method="get" className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="range" value={range.key} />
            <label className="flex flex-col gap-1">
              <span className="font-heading text-[10px] uppercase tracking-label text-gray-500">
                Search
              </span>
              <input
                type="search"
                name="q"
                defaultValue={search ?? ''}
                placeholder="Name, phone, email, town"
                className="h-9 w-56 rounded-card border border-primary-500/30 bg-[#fcfcfb] px-3 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-heading text-[10px] uppercase tracking-label text-gray-500">
                Status
              </span>
              <select
                name="status"
                defaultValue={status ?? ''}
                className="h-9 rounded-card border border-primary-500/30 bg-[#fcfcfb] px-3 text-sm capitalize"
              >
                <option value="">Any</option>
                {STATUSES.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-heading text-[10px] uppercase tracking-label text-gray-500">
                Channel
              </span>
              <select
                name="channel"
                defaultValue={channel ?? ''}
                className="h-9 rounded-card border border-primary-500/30 bg-[#fcfcfb] px-3 text-sm"
              >
                <option value="">Any</option>
                {channels.map((entry) => (
                  <option key={entry.channel} value={entry.channel}>
                    {channelLabel(entry.channel)}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              className="h-9 rounded-card bg-ink px-4 font-heading text-[10px] font-semibold uppercase tracking-label text-cream"
            >
              Apply
            </button>
            {(status || channel || search) && (
              <Link
                href={`/admin/leads?range=${range.key}`}
                className="h-9 self-end px-2 font-heading text-[10px] uppercase tracking-label leading-9 text-gray-500 hover:text-ink"
              >
                Clear
              </Link>
            )}
          </form>
        </Panel>

        <Panel>
          {rows.length === 0 ? (
            <Empty>No leads match this filter.</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>When</Th>
                  <Th>Name</Th>
                  <Th>Contact</Th>
                  <Th>Town</Th>
                  <Th>Appliance</Th>
                  <Th>Channel</Th>
                  <Th>Form</Th>
                  <Th numeric>Decided in</Th>
                  <Th>Status</Th>
                  <Th numeric>Value</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const lead = row as Record<string, string | number | boolean | null | Date>;
                  return (
                    <tr key={String(lead.id)} className="hover:bg-cream-dark/40">
                      <Td>
                        <Link
                          href={`/admin/leads/${lead.id}`}
                          className="whitespace-nowrap text-gray-700 underline-offset-2 hover:underline"
                        >
                          {dateTime(lead.created_at as Date)}
                        </Link>
                      </Td>
                      <Td>
                        <Link href={`/admin/leads/${lead.id}`} className="font-medium text-ink">
                          {(lead.name as string) || '—'}
                        </Link>
                        {lead.is_duplicate ? (
                          <span className="ml-2 text-[10px] uppercase tracking-label text-gray-500">
                            dup
                          </span>
                        ) : null}
                      </Td>
                      <Td className="whitespace-nowrap text-xs text-gray-600">
                        {(lead.phone as string) || (lead.email as string) || '—'}
                      </Td>
                      <Td>{(lead.city as string) || '—'}</Td>
                      <Td className="capitalize">
                        {((lead.appliance as string) || '—').replace(/-/g, ' ')}
                      </Td>
                      <Td>
                        <span className="inline-flex items-center gap-2 whitespace-nowrap">
                          <span
                            aria-hidden
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: channelColor(String(lead.lt_channel ?? '')) }}
                          />
                          {channelLabel(lead.lt_channel as string)}
                        </span>
                      </Td>
                      <Td className="capitalize">{lead.source_form as string}</Td>
                      <Td numeric>
                        {lead.time_to_lead_sec ? duration(lead.time_to_lead_sec as number) : '—'}
                      </Td>
                      <Td>
                        <StatusPill status={String(lead.status)} />
                      </Td>
                      <Td numeric>{lead.value_cents ? money(lead.value_cents as number) : '—'}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}

          {total > limit && (
            <div className="mt-4 flex items-center justify-between text-xs text-gray-600">
              <span>
                {offset + 1}–{Math.min(offset + limit, total)} of {count(total)}
              </span>
              <div className="flex gap-2">
                {offset > 0 && (
                  <Link
                    href={`/admin/leads?${new URLSearchParams({
                      range: range.key,
                      ...(status ? { status } : {}),
                      ...(channel ? { channel } : {}),
                      ...(search ? { q: search } : {}),
                      offset: String(Math.max(0, offset - limit)),
                    })}`}
                    className="font-heading text-[10px] uppercase tracking-label hover:text-ink"
                  >
                    ← Newer
                  </Link>
                )}
                {offset + limit < total && (
                  <Link
                    href={`/admin/leads?${new URLSearchParams({
                      range: range.key,
                      ...(status ? { status } : {}),
                      ...(channel ? { channel } : {}),
                      ...(search ? { q: search } : {}),
                      offset: String(offset + limit),
                    })}`}
                    className="font-heading text-[10px] uppercase tracking-label hover:text-ink"
                  >
                    Older →
                  </Link>
                )}
              </div>
            </div>
          )}

          <Hint>
            Marking a lead won, with its value, is what makes the money figures elsewhere real —
            and it is also what gets sent back to Google and Meta so their bidding optimises for
            paid jobs instead of form fills.
          </Hint>
        </Panel>
      </div>
    );
  } catch (error) {
    return <SetupNotice error={error} />;
  }
}
