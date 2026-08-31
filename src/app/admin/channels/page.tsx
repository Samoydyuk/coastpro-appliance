import Link from 'next/link';
import { parseRange } from '@/lib/admin/range';
import { getCampaigns, getChannels } from '@/lib/admin/queries';
import { count, money, percent } from '@/lib/admin/format';
import { CHANNELS, CHANNEL_LABELS, channelLabel, isPaidChannel } from '@/lib/attribution';
import { getChannelPayback, type ChannelPaybackRow, type PaybackRow } from '@/lib/channels/client';
import { serverTranslator } from '@/lib/i18n/server';
import { numberLocale, type Lang, type TranslationKey } from '@/lib/i18n';
import { Empty, Hint, Panel, SetupNotice, Table, Td, Th } from '@/components/admin/ui';
import { RankedBars } from '@/components/admin/charts';
import { channelColor } from '@/components/admin/palette';
import { MoneyBasisLine } from '@/components/admin/MoneyBasis';
import { rangeLabel } from '@/lib/i18n/range';

export const dynamic = 'force-dynamic';

// `key` is the query-string value and stays English; only the label moves.
const GROUPINGS = [
  { key: 'campaign', labelKey: 'marketing.channels.group.campaign' },
  { key: 'content', labelKey: 'marketing.channels.group.content' },
  { key: 'term', labelKey: 'marketing.channels.group.term' },
] as const;

/**
 * Where this site's own tracking stops and JobPocket begins.
 *
 * A rule and not decoration. Everything left of it is a session, a form or a
 * tracked number — things this database watched happen. Everything right of it
 * is money, and comes from JobPocket, which is the only place a marketplace
 * lead and a website enquiry sit in the same ledger.
 */
const DIVIDER = 'border-l border-primary-500/25 pl-3';

/**
 * A return like `2,40×`. Through `Intl` rather than `toFixed`, or it is the one
 * number on a Ukrainian screen still written with a full stop.
 */
function ratio(value: number, lang: Lang): string {
  return value.toLocaleString(numberLocale(lang), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * One line of the merged table.
 *
 * `site` is null for a channel that never touched this website, and null rather
 * than a row of noughts on purpose: a Thumbtack customer did not fail to visit
 * the site, they were never offered the chance. A zero in the visits column
 * would read as a channel that is not working, which is the opposite of what it
 * would mean. `payback` is null the other way about — a channel this site
 * tracks that JobPocket has never heard of, usually because nothing from it has
 * become a job yet.
 */
interface MergedRow {
  key: string;
  name: string;
  color: string;
  site: { sessions: number; leads: number; calls: number } | null;
  payback: PaybackRow | null;
}

export default async function ChannelsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const range = parseRange({
    range: searchParams.range as string,
    from: searchParams.from as string,
    to: searchParams.to as string,
  });
  const attribution = (searchParams.attribution as string) === 'first' ? 'first' : 'last';
  const groupBy = (GROUPINGS.find((entry) => entry.key === searchParams.group)?.key ??
    'campaign') as 'campaign' | 'content' | 'term';
  const t = serverTranslator();

  // The slug is a JOIN key and never moves; only what the reader sees does.
  // A channel the dictionary has not heard of keeps the name attribution.ts
  // gives it rather than showing a raw key.
  const channelName = (channel: string | null | undefined) =>
    channel && channel in CHANNEL_LABELS
      ? t(`marketing.channel.${channel}` as TranslationKey)
      : channelLabel(channel);

  try {
    const [channels, campaigns, payback] = await Promise.all([
      getChannels(range, attribution),
      getCampaigns(range, groupBy),
      /**
       * Caught rather than allowed to fail the page.
       *
       * JobPocket is a second system behind a second key, and this screen read
       * perfectly well without it for a year. If the key was rotated this
       * afternoon, or the range is longer than the year JobPocket will report
       * on, the funnel this site measured itself is still worth looking at —
       * so the payback columns go blank and a note says why, rather than the
       * whole page turning into a setup notice.
       */
      getChannelPayback(range.from, range.to).catch(() => null),
    ]);

    /**
     * Matching a JobPocket channel to a slug on this side.
     *
     * Two handles, both published by JobPocket for exactly this: `kind` is the
     * machine key the channel was created under, and `sourceMatch` is the list
     * a lead's own source is compared against when it arrives. The mirror
     * writes this console's slug into both, so `google_ads` here is
     * `google_ads` there however the owner has since renamed the channel on
     * their phone.
     */
    const byKey = new Map<string, ChannelPaybackRow>();
    for (const row of payback?.channels ?? []) {
      for (const handle of [row.kind, ...row.sourceMatch]) {
        if (!handle) continue;
        const slug = handle.toLowerCase();
        if (!byKey.has(slug)) byKey.set(slug, row);
      }
    }

    /**
     * Claimed once and once only. One JobPocket channel can list several slugs
     * in `sourceMatch` — a "Google" channel matching both `google_ads` and
     * `google_lsa` is an ordinary thing for an owner to set up — and letting it
     * answer for two rows would print its spend twice and halve its own return.
     */
    const claimed = new Set<string>();
    const fromSite: MergedRow[] = channels.map((row) => {
      const match = byKey.get(row.channel);
      const mine = match && !claimed.has(match.id) ? match : null;
      if (mine) claimed.add(mine.id);
      return {
        key: `site:${row.channel}`,
        name: channelName(row.channel),
        color: channelColor(row.channel),
        site: { sessions: row.sessions, leads: row.leads, calls: row.calls },
        payback: mine,
      };
    });

    /**
     * The rows the owner opened this page looking for and did not find.
     *
     * A marketplace, a word-of-mouth channel, anything that reaches JobPocket
     * without passing through this website. A dormant channel with nothing at
     * all in the window is dropped; one the owner still has switched on is
     * kept, because a channel that produced nothing this month is a thing they
     * are still paying for.
     */
    const elsewhere = (payback?.channels ?? [])
      .filter((row) => !claimed.has(row.id))
      /**
       * A channel keyed to a slug this site tracks belongs on that slug's row
       * and nowhere else. Reaching here means the site had no row for it at all
       * — no visit, no enquiry, no spend in the window — so there is nothing to
       * show, and showing it with the funnel blank would say the wrong thing
       * entirely: blank on this table means "never came near the website", and
       * Meta Ads in a quiet fortnight is not that.
       */
      .filter(
        (row) =>
          ![row.kind, ...row.sourceMatch].some(
            (handle) => handle && CHANNELS.includes(handle.toLowerCase() as never)
          )
      )
      .filter(
        (row) =>
          row.isActive || row.spendRows > 0 || row.leads.received > 0 || row.jobs.count > 0
      )
      .map<MergedRow>((row) => ({
        key: `jp:${row.id}`,
        // JobPocket's own name, untranslated. It is the owner's word for the
        // channel — "Thumbtack", "Word of mouth" — and translating a name
        // somebody typed is inventing one.
        name: row.name,
        color: channelColor(row.kind ?? ''),
        site: null,
        payback: row,
      }));

    // Sorted whole rather than appended, so a marketplace that outspends Google
    // Ads sits above it. Money first, then work, then enquiries — the same
    // priority the SQL behind the site rows already used.
    const merged = [...fromSite, ...elsewhere].sort(
      (a, b) =>
        (b.payback?.spendCents ?? 0) - (a.payback?.spendCents ?? 0) ||
        (b.payback?.jobs.count ?? 0) - (a.payback?.jobs.count ?? 0) ||
        (b.site?.leads ?? 0) - (a.site?.leads ?? 0) ||
        (b.site?.sessions ?? 0) - (a.site?.sessions ?? 0)
    );

    const paid = channels.filter((row) => isPaidChannel(row.channel));
    const offSite = elsewhere.filter((row) => (row.payback?.spendCents ?? 0) > 0);
    // Both halves, because "Where the money went" is an unqualified claim and a
    // chart that quietly meant "where the advertising money went" is what sent
    // the owner looking for Thumbtack in the first place. The two cannot
    // double-count: a row only reaches `offSite` by matching no slug at all.
    const totalSpend =
      paid.reduce((sum, row) => sum + row.spendCents, 0) +
      offSite.reduce((sum, row) => sum + (row.payback?.spendCents ?? 0), 0);
    const totalRevenue = channels.reduce((sum, row) => sum + row.invoicedCents, 0);
    const totalMarked = channels.reduce((sum, row) => sum + row.revenueCents, 0);

    // What the table does not explain. Billed rather than collected, so it is
    // comparable with the same figure at the top of the profit waterfall.
    const unattributedCents = payback?.unattributed.jobs.billedCents ?? 0;
    const billedCents = payback?.totals.billedCents ?? 0;
    const unattributedShare = billedCents > 0 ? unattributedCents / billedCents : null;

    /**
     * Spend split by how far it can be checked.
     *
     * `API` is what a marketplace pushed and `STATEMENT` what an importer read
     * off a platform — both are somebody else's record of what they billed.
     * Everything else was typed here or worked out from a period total. This is
     * a split of what was *billed*, before refunds, which is why the note says
     * "billed" and does not claim the two add up to the spend column.
     */
    const kinds = (payback ? [...payback.channels, payback.unattributed] : []).reduce(
      (acc, row) => {
        for (const [origin, cents] of Object.entries(row.spendByOrigin)) {
          if (origin === 'API' || origin === 'STATEMENT') acc.reported += cents;
          else acc.typed += cents;
        }
        return acc;
      },
      { reported: 0, typed: 0 }
    );

    return (
      <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-xl font-bold uppercase tracking-label text-ink">
              {t('marketing.channels.title')}
            </h1>
            <p className="mt-1 text-sm text-gray-600">{rangeLabel(range, t)}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-heading text-[10px] uppercase tracking-label text-gray-500">
              {t('marketing.channels.creditThe')}
            </span>
            {(['last', 'first'] as const).map((mode) => (
              <Link
                key={mode}
                href={`/admin/channels?range=${range.key}&attribution=${mode}&group=${groupBy}`}
                className={`rounded-card border px-2.5 py-1 font-heading text-[10px] font-semibold uppercase tracking-label ${
                  attribution === mode
                    ? 'border-ink bg-ink text-cream'
                    : 'border-primary-500/25 text-gray-600 hover:border-ink hover:text-ink'
                }`}
              >
                {mode === 'last'
                  ? t('marketing.channels.lastClick')
                  : t('marketing.channels.firstClick')}
              </Link>
            ))}
          </div>
        </header>

        <Hint>{t('marketing.channels.attributionHint')}</Hint>

        <MoneyBasisLine attributedCents={totalRevenue} reportedCents={totalMarked} />

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel
            title={t('marketing.channels.spend')}
            subtitle={t('marketing.channels.spendSub')}
          >
            {totalSpend === 0 ? (
              <Empty>
                {t('marketing.channels.noSpendBefore')}{' '}
                <Link href="/admin/spend" className="underline">
                  {t('marketing.channels.noSpendLink')}
                </Link>
                {t('marketing.channels.noSpendAfter')}
              </Empty>
            ) : (
              <RankedBars
                items={[
                  ...paid.map((row) => ({
                    label: channelName(row.channel),
                    value: row.spendCents / 100,
                    color: channelColor(row.channel),
                    note: percent(row.spendCents / totalSpend, 0, t.lang),
                  })),
                  ...offSite.map((row) => ({
                    label: row.name,
                    value: (row.payback?.spendCents ?? 0) / 100,
                    color: row.color,
                    note: percent((row.payback?.spendCents ?? 0) / totalSpend, 0, t.lang),
                  })),
                ]}
                format="money"
              />
            )}
          </Panel>

          <Panel
            title={t('marketing.channels.revenue')}
            subtitle={t('marketing.channels.revenueSub')}
          >
            {totalRevenue === 0 ? (
              <Empty>{t('marketing.channels.noWon')}</Empty>
            ) : (
              <RankedBars
                items={channels
                  .filter((row) => row.invoicedCents > 0)
                  .map((row) => ({
                    label: channelName(row.channel),
                    value: row.invoicedCents / 100,
                    color: channelColor(row.channel),
                    note: percent(row.invoicedCents / totalRevenue, 0, t.lang),
                  }))}
                format="money"
              />
            )}
          </Panel>
        </div>

        <Panel
          title={t('marketing.channels.every')}
          subtitle={t('marketing.channels.everySub')}
        >
          {merged.length === 0 ? (
            <Empty>{t('marketing.channels.nothing')}</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>{t('marketing.col.channel')}</Th>
                  <Th numeric>{t('marketing.col.visits')}</Th>
                  <Th numeric>{t('marketing.col.enquiries')}</Th>
                  <Th numeric>{t('marketing.col.calls')}</Th>
                  <Th numeric>{t('marketing.col.convRate')}</Th>
                  <Th numeric className={DIVIDER}>
                    {t('marketing.col.spend')}
                  </Th>
                  <Th numeric>{t('marketing.col.jpLeads')}</Th>
                  <Th numeric>{t('marketing.col.jobs')}</Th>
                  <Th numeric>{t('marketing.col.invoiced')}</Th>
                  <Th numeric>{t('marketing.col.costPerJpLead')}</Th>
                  <Th numeric>{t('marketing.col.costPerJob')}</Th>
                  <Th numeric>{t('marketing.col.return')}</Th>
                </tr>
              </thead>
              <tbody>
                {merged.map((row) => {
                  const site = row.site;
                  const pb = row.payback;
                  return (
                    <tr key={row.key}>
                      <Td>
                        <span className="inline-flex items-center gap-2">
                          <span
                            aria-hidden
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: row.color }}
                          />
                          {row.name}
                        </span>
                      </Td>
                      {/* `count` and `money` already print an em dash for null,
                          which is the whole reason nothing here coerces to 0. */}
                      <Td numeric>{count(site?.sessions ?? null, t.lang)}</Td>
                      <Td numeric>{count(site?.leads ?? null, t.lang)}</Td>
                      <Td numeric>{count(site?.calls ?? null, t.lang)}</Td>
                      <Td numeric>
                        {site && site.sessions
                          ? percent((site.leads + site.calls) / site.sessions, 1, t.lang)
                          : '—'}
                      </Td>
                      <Td numeric className={DIVIDER}>
                        {money(pb?.spendCents ?? null, t.lang)}
                      </Td>
                      <Td numeric>{count(pb ? pb.leads.received : null, t.lang)}</Td>
                      <Td numeric>{count(pb ? pb.jobs.count : null, t.lang)}</Td>
                      <Td numeric>{money(pb ? pb.jobs.invoicedCents : null, t.lang)}</Td>
                      <Td numeric>{money(pb?.costPerLeadCents ?? null, t.lang)}</Td>
                      <Td numeric>{money(pb?.costPerJobCents ?? null, t.lang)}</Td>
                      <Td numeric>
                        {pb?.paybackRatio == null ? (
                          '—'
                        ) : (
                          <span style={{ color: pb.paybackRatio >= 1 ? '#006300' : '#d03b3b' }}>
                            {ratio(pb.paybackRatio, t.lang)}×
                          </span>
                        )}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}

          {/* Three things this table has to admit, in two lines rather than
              five. The page already carries an attribution note and a tagging
              note; a sixth paragraph of caveats is read by nobody. */}
          <Hint>{t('marketing.channels.sourceNote')}</Hint>
          {payback === null ? (
            <Hint>{t('marketing.channels.paybackUnavailable')}</Hint>
          ) : (
            <Hint>
              {unattributedCents > 0 && unattributedShare !== null
                ? t('marketing.channels.unattributedNote', {
                    amount: money(unattributedCents, t.lang),
                    share: percent(unattributedShare, 0, t.lang),
                  })
                : t('marketing.channels.unattributedNone')}{' '}
              {payback.totals.spendRows > 0
                ? t('marketing.channels.spendKindNote', {
                    reported: money(kinds.reported, t.lang),
                    typed: money(kinds.typed, t.lang),
                  })
                : t('marketing.channels.spendNotMirrored')}
            </Hint>
          )}
        </Panel>

        <Panel
          title={t('marketing.channels.inside')}
          subtitle={t('marketing.channels.insideSub')}
          action={
            <div className="flex gap-1">
              {GROUPINGS.map((entry) => (
                <Link
                  key={entry.key}
                  href={`/admin/channels?range=${range.key}&attribution=${attribution}&group=${entry.key}`}
                  className={`rounded-card border px-2.5 py-1 font-heading text-[10px] font-semibold uppercase tracking-label ${
                    groupBy === entry.key
                      ? 'border-ink bg-ink text-cream'
                      : 'border-primary-500/25 text-gray-600 hover:border-ink hover:text-ink'
                  }`}
                >
                  {t(entry.labelKey)}
                </Link>
              ))}
            </div>
          }
        >
          {campaigns.length === 0 ? (
            <Empty>{t('marketing.channels.untagged')}</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>{t('marketing.col.channel')}</Th>
                  <Th>
                    {t(
                      GROUPINGS.find((entry) => entry.key === groupBy)?.labelKey ??
                        'marketing.channels.group.campaign'
                    )}
                  </Th>
                  <Th numeric>{t('marketing.col.visits')}</Th>
                  <Th numeric>{t('marketing.col.leads')}</Th>
                  <Th numeric>{t('marketing.col.booked')}</Th>
                  <Th numeric>{t('marketing.col.won')}</Th>
                  <Th numeric>{t('marketing.col.spend')}</Th>
                  <Th numeric>{t('marketing.col.costPerLead')}</Th>
                  <Th numeric>{t('marketing.col.revenue')}</Th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((row) => (
                  <tr key={`${row.channel}-${row.label}`}>
                    <Td>
                      <span className="inline-flex items-center gap-2">
                        <span
                          aria-hidden
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: channelColor(row.channel) }}
                        />
                        {channelName(row.channel)}
                      </span>
                    </Td>
                    <Td className="max-w-[280px] truncate">{row.label}</Td>
                    <Td numeric>{count(row.sessions, t.lang)}</Td>
                    <Td numeric>{count(row.leads, t.lang)}</Td>
                    <Td numeric>{count(row.booked, t.lang)}</Td>
                    <Td numeric>{count(row.won, t.lang)}</Td>
                    <Td numeric>{row.spendCents ? money(row.spendCents, t.lang) : '—'}</Td>
                    <Td numeric>
                      {row.spendCents && row.leads
                        ? money(row.spendCents / row.leads, t.lang)
                        : '—'}
                    </Td>
                    <Td numeric>{row.revenueCents ? money(row.revenueCents, t.lang) : '—'}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
          <Hint>
            {t('marketing.channels.taggingHintBefore')}
            <code className="rounded bg-cream-dark px-1 py-0.5">
              utm_term={'{keyword}'}&amp;utm_content={'{creative}'}
            </code>
            {t('marketing.channels.taggingHintAfter')}
          </Hint>
        </Panel>
      </div>
    );
  } catch (error) {
    return <SetupNotice error={error} />;
  }
}
