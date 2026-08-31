import { count, dateTime, money, percent } from '@/lib/admin/format';
import { getMarketplace, providerLabel, MANUAL_CHARGE_PROVIDER } from '@/lib/marketplace/client';
import type { MarketplaceProvider } from '@/lib/marketplace/client';
import { OperationsApiError } from '@/lib/bookings/client';
import {
  Empty,
  Hint,
  Panel,
  SetupNotice,
  StatTile,
  Table,
  Td,
  Th,
  Warning,
} from '@/components/admin/ui';
import { NotConnected } from '@/components/admin/NotConnected';
import { ManualLeadCost } from '@/components/admin/ManualLeadCost';
import { STATUS } from '@/components/admin/palette';
import { serverTranslator } from '@/lib/i18n/server';
import type { Translator, TranslationKey } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

/**
 * Whether the paid marketplaces are still delivering.
 *
 * This page exists for one question, and it is not the money. A webhook that
 * quietly stopped and a fortnight with no work look identical from every other
 * screen in the console — both are an empty inbox — and the difference between
 * them is a subscription still being paid for against a phone that is simply
 * not ringing. So the last delivery time is the first thing on the page, it is
 * measured to now rather than to the window, and it says so in words when it
 * has gone stale.
 *
 * A marketplace lead is deliberately not in the console's own `leads` table.
 * That table is about website attribution — visitor, session, click id — and a
 * Thumbtack lead has none of those, because it never touched the website.
 * JobPocket holds it, JobPocket prices it, and this page draws what JobPocket
 * says. Nothing here is added up on this side.
 */

/**
 * How long silence stays plausible.
 *
 * Thumbtack sends an event for every message in a negotiation, not only for a
 * new lead, so on a working account something lands most days. Four days of
 * nothing is the point at which "quiet" stops being the likeliest explanation.
 */
const STALE_AFTER_DAYS = 4;

/**
 * The window the money figures are read through.
 *
 * The page carries its own rather than taking the console's, for the same
 * reason the reconciliation screen does: the useful period here is however long
 * it takes a marketplace to settle, and the one figure that actually matters —
 * the last delivery — ignores the window entirely.
 */
const WINDOW_DAYS = 90;

/** Where the webhook is pasted. Free and self-serve; no agreement to sign. */
const WEBHOOK_URL = 'https://portal.jobpocket.app/marketplace/thumbtack/webhook';
const THUMBTACK_WEBHOOKS_PAGE = 'https://www.thumbtack.com/pro/webhooks/list';

function ageInDays(value: string | null): number | null {
  if (!value) return null;
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return null;
  return (Date.now() - then) / 86_400_000;
}

/**
 * How long ago, in this reader's language.
 *
 * `relativeTime` in `format.ts` writes "3d ago" in English whatever the console
 * is set to, and this whole page is an argument about how old one number is.
 */
function ago(value: string | null, t: Translator): string {
  if (!value) return '—';
  const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return t('marketing.ago.s', { n: seconds });
  if (seconds < 3600) return t('marketing.ago.m', { n: Math.round(seconds / 60) });
  if (seconds < 86_400) return t('marketing.ago.h', { n: Math.round(seconds / 3600) });
  return t('marketing.ago.d', { n: Math.round(seconds / 86_400) });
}

export default async function MarketplacePage() {
  const t = serverTranslator();
  const to = new Date();
  const from = new Date(to.getTime() - WINDOW_DAYS * 86_400_000);

  let report: Awaited<ReturnType<typeof getMarketplace>> | null = null;
  let unconfigured = false;
  let failure: string | null = null;

  try {
    report = await getMarketplace(from, to);
  } catch (error) {
    if (error instanceof OperationsApiError) {
      if (error.code === 'not_configured') unconfigured = true;
      else failure = error.message;
    } else {
      return <SetupNotice error={error} />;
    }
  }

  if (unconfigured) {
    return (
      <div className="space-y-6">
        <Header t={t} />
        <NotConnected what={t('marketplace.notConnected')} />
        <SetupPanel t={t} />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-6">
        <Header t={t} />
        <Warning>{failure ?? t('money.noAnswer')}</Warning>
        <SetupPanel t={t} />
      </div>
    );
  }

  const { providers } = report;

  /**
   * The two deploys are separate and one of them can be weeks behind.
   *
   * This console ships by hand from a laptop and JobPocket ships to Railway,
   * where a failed deploy leaves the old container serving happily — so a
   * console that knows about `manual` can easily be talking to an API that does
   * not. Reading straight through would take the whole page down with it, and
   * this page is the one somebody opens to find out whether the marketplace is
   * still working. An empty panel is a far smaller lie than a 500.
   */
  const manual = report.manual ?? { rows: 0, chargedCents: 0, truncated: false, charges: [] };

  return (
    <div className="space-y-6">
      <Header t={t} />
      {failure ? <Warning>{failure}</Warning> : null}

      {providers.length === 0 ? (
        /* Not an empty table. Nothing has ever arrived, which is a different
           sentence from "no leads this quarter" and needs different advice. */
        <Warning>{t('marketplace.neverAnything')}</Warning>
      ) : (
        providers.map((provider) => (
          <ProviderBlock key={provider.provider} provider={provider} t={t} />
        ))
      )}

      {/* Shown whether or not a marketplace has ever delivered, and the empty
          case is the one it was built for: a lead that arrived before the
          webhook existed has no provider block to sit under, because nothing
          about it ever reached JobPocket. */}
      <ManualLeadCost
        provider={MANUAL_CHARGE_PROVIDER}
        charges={manual.charges}
        chargedCents={manual.chargedCents}
        truncated={manual.truncated}
      />

      <SetupPanel t={t} />
    </div>
  );
}

/**
 * `LeadCostOrigin`, in the schema's own order, and only the ones carrying money.
 *
 * A row of zeros says nothing; a missing row says the total is standing
 * entirely on the origins that are here. An origin this page has no word for
 * yet is drawn under its raw enum name rather than dropped — a figure that
 * silently left the breakdown would make it disagree with the total above it,
 * and a wrong sum is worse than an ugly label.
 */
const ORIGIN_ORDER = ['API', 'STATEMENT', 'ALLOCATED', 'DEFAULT', 'MANUAL'] as const;

const ORIGIN_LABELS: Record<string, TranslationKey> = {
  API: 'marketplace.origin.API',
  STATEMENT: 'marketplace.origin.STATEMENT',
  ALLOCATED: 'marketplace.origin.ALLOCATED',
  DEFAULT: 'marketplace.origin.DEFAULT',
  MANUAL: 'marketplace.origin.MANUAL',
};

function originRows(split: Record<string, number> | undefined): Array<[string, number]> {
  // Undefined only while an older JobPocket is still answering — the same
  // deploy-order gap the `manual` block above allows for. No breakdown then,
  // and the total above it carries on being drawn.
  if (!split) return [];

  const known = ORIGIN_ORDER.filter((origin) => (split[origin] ?? 0) > 0).map(
    (origin) => [origin, split[origin]] as [string, number]
  );
  const unknown = Object.entries(split).filter(
    ([origin, cents]) => cents > 0 && !ORIGIN_ORDER.includes(origin as (typeof ORIGIN_ORDER)[number])
  );
  return [...known, ...unknown];
}

function Header({ t }: { t: Translator }) {
  return (
    <div>
      <h1 className="font-heading text-xl font-bold uppercase tracking-label text-ink">
        {t('marketplace.title')}
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        {t('marketplace.subtitle', { days: WINDOW_DAYS })}
      </p>
    </div>
  );
}

/**
 * One marketplace, health first.
 *
 * The order of the panels is the order of the questions: is it working, which
 * businesses are wired up, how much is inside what arrives, what the leads
 * cost, and the deliveries themselves. The setup instructions sit below all of
 * it, where somebody who already has it working never has to scroll past them.
 */
function ProviderBlock({ provider, t }: { provider: MarketplaceProvider; t: Translator }) {
  const name = providerLabel(provider.provider);
  const age = ageInDays(provider.lastEventAt);
  const stale = age === null || age > STALE_AFTER_DAYS;
  const { leads, detail, money: figures, events } = provider;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label={t('marketplace.lastDelivery')}
          value={provider.lastEventAt ? ago(provider.lastEventAt, t) : t('marketplace.never')}
          hint={provider.lastEventAt ? dateTime(provider.lastEventAt, t.lang) : undefined}
          emphasis
        />
        <StatTile
          label={t('marketplace.leadsBought')}
          value={count(leads.received, t.lang)}
          hint={t('marketplace.repliedTo', { n: count(leads.replied, t.lang) })}
        />
        <StatTile
          label={t('marketplace.becameCustomers')}
          value={count(leads.converted, t.lang)}
          hint={t('marketplace.lostAndUnanswered', {
            lost: count(leads.lost, t.lang),
            unanswered: count(leads.unanswered, t.lang),
          })}
        />
        <StatTile
          label={t('marketplace.costPerCustomer')}
          value={
            figures.costPerAcquiredCustomerCents === null
              ? t('marketplace.unknown')
              : money(figures.costPerAcquiredCustomerCents, t.lang)
          }
          hint={figures.costIsPartial ? t('marketplace.costPartialShort') : undefined}
        />
      </div>

      {/* The single most valuable thing on the page. */}
      {stale && (
        <Warning>
          {provider.lastEventAt
            ? t('marketplace.stale', {
                provider: name,
                days: t.plural(Math.round(age ?? 0), 'plural.day'),
              })
            : t('marketplace.neverAnything')}
        </Warning>
      )}

      {events.failed > 0 && (
        <Warning>
          {t('marketplace.someFailed', {
            failed: count(events.failed, t.lang),
            total: count(events.received, t.lang),
          })}
          {events.unattributed > 0
            ? ` ${t('marketplace.unattributed', { n: count(events.unattributed, t.lang) })}`
            : ''}
        </Warning>
      )}

      <Panel title={t('marketplace.businesses')} subtitle={t('marketplace.businessesSub')}>
        {provider.connections.length === 0 ? (
          <Empty>{t('marketplace.noBusinesses')}</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t('marketplace.col.business')}</Th>
                <Th>{t('common.status')}</Th>
                <Th>{t('marketplace.col.lastDelivery')}</Th>
                <Th numeric>{t('marketplace.col.deliveries')}</Th>
                <Th numeric>{t('marketplace.col.failed')}</Th>
                <Th numeric>{t('marketplace.col.leads')}</Th>
                <Th numeric>{t('marketplace.col.customers')}</Th>
              </tr>
            </thead>
            <tbody>
              {provider.connections.map((connection) => (
                <tr key={connection.id}>
                  <Td>
                    {connection.businessName ?? name}
                    {/* The id is what tells two webhooks apart, so it is worth
                        showing beside the name somebody typed into Thumbtack. */}
                    <span className="block text-[11px] text-gray-500">
                      {connection.externalBusinessId}
                    </span>
                  </Td>
                  <Td>
                    {connection.enabled ? (
                      <span className="text-gray-600">{t('marketplace.on')}</span>
                    ) : (
                      <span style={{ color: STATUS.warning }}>{t('marketplace.off')}</span>
                    )}
                  </Td>
                  <Td className="text-gray-600">{ago(connection.lastEventAt, t)}</Td>
                  <Td numeric>{count(connection.events.received, t.lang)}</Td>
                  <Td
                    numeric
                    className={connection.events.failed ? 'font-medium' : 'text-gray-400'}
                  >
                    {count(connection.events.failed, t.lang)}
                  </Td>
                  <Td numeric>{count(connection.leads.received, t.lang)}</Td>
                  <Td numeric>{count(connection.leads.converted, t.lang)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>

      {/* Small numbers, and the only ones on the page that would notice
          Thumbtack quietly sending less. A lead with a photograph of the model
          plate is one a technician can prepare for before driving out; a lead
          with neither a name nor a town is barely an introduction. */}
      <Panel
        title={t('marketplace.detail')}
        subtitle={t('marketplace.detailSub', { days: WINDOW_DAYS })}
      >
        {/* No empty state, on purpose. A window with nothing readable in it is
            a table of zeros with dashes for shares, which is the truth; an
            "everything was destroyed" case would otherwise have to be told
            twice, once as an empty state and once in the note below. */}
        <Table>
          <thead>
            <tr>
              <Th>{t('marketplace.col.arrivedWith')}</Th>
              <Th numeric>{t('marketplace.col.leads')}</Th>
              <Th numeric>{t('marketplace.col.share')}</Th>
            </tr>
          </thead>
          <tbody>
            <DetailRow
              label={t('marketplace.withPhoto')}
              n={detail.withAttachment}
              of={detail.measured}
              t={t}
            />
            <DetailRow
              label={t('marketplace.withTime')}
              n={detail.withProposedTime}
              of={detail.measured}
              t={t}
            />
            {/* The row that decides whether a lead can be worked without ringing
                first — and a real variable rather than a constant, which is why
                it is on the table at all: this page used to take it as read that
                a bought lead never carries a street, and the first payload a
                live account sent carried one. */}
            <DetailRow
              label={t('marketplace.withAddress')}
              n={detail.withAddress}
              of={detail.measured}
              t={t}
            />
            <DetailRow
              label={t('marketplace.anonymousLead')}
              n={detail.anonymous}
              of={detail.measured}
              t={t}
              // The one row here where a bigger number is a worse quarter.
              bad
            />
          </tbody>
        </Table>

        <Hint>{t('marketplace.detailHint')}</Hint>

        {detail.purged > 0 ? (
          <Hint>
            {t('marketplace.detailPurged', {
              n: count(detail.purged, t.lang),
              total: count(detail.measured + detail.purged, t.lang),
            })}
          </Hint>
        ) : null}
      </Panel>

      <Panel
        title={t('marketplace.money')}
        subtitle={t('marketplace.moneySub', { days: WINDOW_DAYS })}
      >
        <Table>
          <thead>
            <tr>
              <Th>{t('money.line')}</Th>
              <Th numeric>{t('common.amount')}</Th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <Td>{t('marketplace.charged')}</Td>
              <Td numeric>{money(figures.chargedCents, t.lang)}</Td>
            </tr>
            {/* What that total is standing on. Indented because it is a
                breakdown of the line above and not a figure of its own. */}
            {originRows(figures.chargedByOrigin).map(([origin, cents]) => (
              <tr key={origin}>
                <Td className="pl-5 text-gray-600">
                  {ORIGIN_LABELS[origin] ? t(ORIGIN_LABELS[origin]) : origin}
                </Td>
                <Td numeric className="text-gray-600">
                  {money(cents, t.lang)}
                </Td>
              </tr>
            ))}
            <tr>
              <Td>{t('marketplace.refunded')}</Td>
              <Td numeric className="text-gray-600">
                {figures.refundedCents ? `−${money(figures.refundedCents, t.lang)}` : '—'}
              </Td>
            </tr>
            <tr>
              <Td className="font-medium">{t('marketplace.netCost')}</Td>
              <Td numeric className="font-medium">
                {/* Unknown, not zero. Leads are not given away. */}
                {figures.leadCostCents === null
                  ? t('marketplace.unknown')
                  : money(figures.leadCostCents, t.lang)}
              </Td>
            </tr>
            <tr>
              <Td>{t('marketplace.pending')}</Td>
              <Td numeric className="text-gray-600">
                {figures.pendingCents ? money(figures.pendingCents, t.lang) : '—'}
              </Td>
            </tr>
            <tr>
              <Td>{t('marketplace.invoiced')}</Td>
              <Td numeric>{money(figures.invoicedCents, t.lang)}</Td>
            </tr>
            <tr>
              <Td className="font-medium">{t('marketplace.paid')}</Td>
              <Td numeric className="font-medium">
                {money(figures.paidCents, t.lang)}
              </Td>
            </tr>
            <tr>
              <Td>{t('marketplace.costPerCustomer')}</Td>
              <Td numeric>
                {figures.costPerAcquiredCustomerCents === null
                  ? t('marketplace.unknown')
                  : money(figures.costPerAcquiredCustomerCents, t.lang)}
              </Td>
            </tr>
          </tbody>
        </Table>

        {/* What the breakdown above is for. Two numbers in the same column,
            in the same currency, that are not the same kind of fact. */}
        {figures.chargedCents > 0 ? <Hint>{t('marketplace.originHint')}</Hint> : null}

        {figures.leadCostCents === null ? (
          <Hint>{t('marketplace.noCost')}</Hint>
        ) : figures.costIsPartial ? (
          <Hint>
            {t('marketplace.costPartial', {
              n: count(figures.leadsWithACost, t.lang),
              total: count(leads.received, t.lang),
            })}
          </Hint>
        ) : null}

        {/* Two things this page cannot see, said out loud rather than left for
            the reader to discover by disagreeing with their bank statement. */}
        <Hint>{t('marketplace.moneyHint')}</Hint>
      </Panel>

      <Panel title={t('marketplace.log')} subtitle={t('marketplace.logSub')}>
        {provider.recent.length === 0 ? (
          <Empty>{t('marketplace.noEvents')}</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t('marketplace.col.type')}</Th>
                <Th>{t('marketplace.col.arrived')}</Th>
                <Th>{t('marketplace.col.outcome')}</Th>
              </tr>
            </thead>
            <tbody>
              {provider.recent.map((event) => (
                <tr key={event.id}>
                  <Td>{event.type}</Td>
                  <Td className="text-gray-600">{dateTime(event.receivedAt, t.lang)}</Td>
                  <Td>
                    {event.error ? (
                      // JobPocket's own message, left as it was written.
                      <span className="text-red-800">{event.error.slice(0, 120)}</span>
                    ) : event.handled ? (
                      <span className="text-gray-500">{t('marketplace.handled')}</span>
                    ) : (
                      <span style={{ color: STATUS.warning }}>{t('marketplace.notHandled')}</span>
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
}

/**
 * One line of what a lead arrived with.
 *
 * The share is the figure to read and the count is there to stop it being read
 * out of two leads: 50% of a quiet fortnight is one photograph. Rounded to
 * whole percent, because a tenth of a point on a number this small is precision
 * the count cannot support. With nothing to divide by, `percent` writes a dash
 * rather than a zero — no leads and no photographs are different sentences.
 */
function DetailRow({
  label,
  n,
  of,
  t,
  bad = false,
}: {
  label: string;
  n: number;
  of: number;
  t: Translator;
  bad?: boolean;
}) {
  return (
    <tr>
      <Td>{label}</Td>
      <Td numeric className={n ? undefined : 'text-gray-400'}>
        {count(n, t.lang)}
      </Td>
      <Td numeric className={bad && n ? 'font-medium' : 'text-gray-600'}>
        {bad && n ? (
          <span style={{ color: STATUS.warning }}>{percent(n / of, 0, t.lang)}</span>
        ) : (
          percent(n / of, 0, t.lang)
        )}
      </Td>
    </tr>
  );
}

/**
 * How to wire it up.
 *
 * Shown whatever state the page is in, because the two moments it is wanted are
 * before anything is connected and after something has stopped. The credential
 * itself is never rendered — not the secret, not the last four characters of
 * it. It is minted in JobPocket, shown once there, and pasting it is the one
 * step this console has no part in.
 */
function SetupPanel({ t }: { t: Translator }) {
  return (
    <Panel title={t('marketplace.setup')} subtitle={t('marketplace.setupSub')}>
      <div className="max-w-prose space-y-4 text-sm text-gray-700">
        <div>
          <p className="font-heading text-[10px] font-semibold uppercase tracking-label text-gray-500">
            {t('marketplace.setupUrl')}
          </p>
          <code className="mt-1 block break-all rounded-card border border-primary-500/20 bg-cream-light px-3 py-2 text-[12px] text-ink">
            {WEBHOOK_URL}
          </code>
        </div>

        <p>
          {t('marketplace.setupWhere')}{' '}
          <a
            href={THUMBTACK_WEBHOOKS_PAGE}
            target="_blank"
            rel="noreferrer"
            className="text-ink underline decoration-primary-500/40 underline-offset-2 hover:text-primary-600"
          >
            thumbtack.com/pro/webhooks/list
          </a>
        </p>

        <p>{t('marketplace.setupAuth')}</p>
        <p className="text-xs text-gray-600">{t('marketplace.setupOne')}</p>
      </div>
    </Panel>
  );
}
