import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLead } from '@/lib/admin/queries';
import { dateTime, duration, money, relativeTime } from '@/lib/admin/format';
import { channelLabel } from '@/lib/attribution';
import { serverTranslator } from '@/lib/i18n/server';
import { Empty, Hint, Panel, SetupNotice, StatusPill, Table, Td, Th } from '@/components/admin/ui';
import { LeadEditor } from '@/components/admin/LeadEditor';
import { INK_MUTED, STATUS, channelColor } from '@/components/admin/palette';
import { numberLocale } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

/**
 * The event name on the left is what the tracker wrote and what the timeline is
 * queried by; only the words shown for it change with the language.
 */
const EVENT_LABELS = {
  pageview: 'work.event.pageview',
  engagement: 'work.event.engagement',
  scroll: 'work.event.scroll',
  click_phone: 'work.event.click_phone',
  click_email: 'work.event.click_email',
  click_cta: 'work.event.click_cta',
  outbound: 'work.event.outbound',
  form_start: 'work.event.form_start',
  form_field: 'work.event.form_field',
  form_step: 'work.event.form_step',
  form_submit: 'work.event.form_submit',
  form_error: 'work.event.form_error',
  calendly_view: 'work.event.calendly_view',
  calendly_booked: 'work.event.calendly_booked',
  rage_click: 'work.event.rage_click',
  js_error: 'work.event.js_error',
  exit: 'work.event.exit',
} as const;

/** Which form the enquiry arrived on — a stored value, not a label. */
const SOURCE_FORMS = {
  contact: 'work.sourceForm.contact',
  booking: 'work.sourceForm.booking',
  calendly: 'work.sourceForm.calendly',
  call: 'work.sourceForm.call',
  manual: 'work.sourceForm.manual',
} as const;

/** How a conversion upload ended. Again a stored value, not a label. */
const EXPORT_STATUS = {
  sent: 'work.lead.export.sent',
  failed: 'work.lead.export.failed',
  pending: 'work.lead.export.pending',
} as const;

const HIGHLIGHT = new Set(['click_phone', 'form_submit', 'calendly_booked', 'form_start']);

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const t = serverTranslator();
  try {
    const data = await getLead(params.id);
    if (!data) notFound();

    const { lead, timeline, visits, calls, exports } = data;
    const record = lead as Record<string, string | number | boolean | null | Date>;

    return (
      <div className="space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/admin/leads"
              className="font-heading text-[10px] uppercase tracking-label text-gray-500 hover:text-ink"
            >
              {t('work.lead.back')}
            </Link>
            <h1 className="mt-1 font-heading text-xl font-bold uppercase tracking-label text-ink">
              {(record.name as string) || t('work.lead.unnamed')}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {dateTime(record.created_at as Date, t.lang)} ·{' '}
              {relativeTime(record.created_at as Date)} ·{' '}
              {String(record.source_form) in SOURCE_FORMS
                ? t(SOURCE_FORMS[String(record.source_form) as keyof typeof SOURCE_FORMS])
                : (record.source_form as string)}
            </p>
          </div>
          <StatusPill status={String(record.status)} />
        </header>

        {record.is_duplicate ? (
          <div className="rounded-card border border-primary-500/25 bg-cream-dark/40 px-4 py-3 text-sm text-gray-700">
            {t('work.lead.duplicate')}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            <Panel title={t('work.lead.contact')}>
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                <Field label={t('work.lead.phone')}>
                  {record.phone ? (
                    <a href={`tel:${record.phone_e164 ?? record.phone}`} className="underline">
                      {record.phone as string}
                    </a>
                  ) : (
                    '—'
                  )}
                </Field>
                <Field label={t('work.lead.email')}>
                  {record.email ? (
                    <a href={`mailto:${record.email}`} className="underline">
                      {record.email as string}
                    </a>
                  ) : (
                    '—'
                  )}
                </Field>
                <Field label={t('work.lead.address')}>
                  {[record.address, record.city, record.zip].filter(Boolean).join(', ') || '—'}
                </Field>
                <Field label={t('work.lead.appliance')}>
                  <span className="capitalize">
                    {((record.appliance as string) || '—').replace(/-/g, ' ')}
                  </span>
                </Field>
                <Field label={t('work.lead.notificationEmail')}>
                  {record.email_delivered === null
                    ? t('work.lead.emailNotAttempted')
                    : record.email_delivered
                      ? t('work.lead.emailDelivered')
                      : t('work.lead.emailFailed')}
                </Field>
                <Field label={t('work.lead.decidedIn')}>
                  {record.time_to_lead_sec ? duration(record.time_to_lead_sec as number) : '—'}
                </Field>
              </dl>
              {(record.problem || record.message) && (
                <div className="mt-4 rounded-card bg-cream-dark/40 p-3 text-sm text-gray-700">
                  {(record.problem as string) || (record.message as string)}
                </div>
              )}
            </Panel>

            <Panel
              title={t('work.lead.attribution')}
              subtitle={t('work.lead.attributionSubtitle')}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Touch
                  title={t('work.lead.firstTouch')}
                  note={t('work.lead.firstTouchNote')}
                  channel={record.ft_channel as string}
                  source={record.ft_source as string}
                  medium={record.ft_medium as string}
                  campaign={record.ft_campaign as string}
                  content={record.ft_content as string}
                  term={record.ft_term as string}
                  landing={record.ft_landing_path as string}
                />
                <Touch
                  title={t('work.lead.lastTouch')}
                  note={t('work.lead.lastTouchNote')}
                  channel={record.lt_channel as string}
                  source={record.lt_source as string}
                  medium={record.lt_medium as string}
                  campaign={record.lt_campaign as string}
                  content={record.lt_content as string}
                  term={record.lt_term as string}
                  landing={record.lt_landing_path as string}
                  referrer={record.lt_referrer as string}
                />
              </div>
              {(record.gclid || record.fbclid || record.msclkid || record.ttclid) && (
                <div className="mt-4 border-t border-primary-500/15 pt-3">
                  <p className="font-heading text-[10px] uppercase tracking-label text-gray-500">
                    {t('work.lead.clickIds')}
                  </p>
                  <ul className="mt-2 space-y-1 font-mono text-[11px] text-gray-600">
                    {(['gclid', 'gbraid', 'wbraid', 'fbclid', 'msclkid', 'ttclid'] as const).map(
                      (key) =>
                        record[key] ? (
                          <li key={key} className="truncate">
                            <span className="text-gray-500">{key}:</span> {record[key] as string}
                          </li>
                        ) : null
                    )}
                  </ul>
                  <Hint>{t('work.lead.clickIdsHint')}</Hint>
                </div>
              )}
            </Panel>

            <Panel
              title={t('work.lead.behaviour')}
              subtitle={t('work.lead.behaviourSubtitle')}
            >
              {timeline.length === 0 ? (
                <Empty>{t('work.lead.noBehaviour')}</Empty>
              ) : (
                <ol className="space-y-1.5">
                  {timeline.map((entry, index) => {
                    const event = entry as Record<string, string | number | Date | null>;
                    const type = String(event.type);
                    return (
                      <li
                        key={index}
                        className="flex gap-3 border-l-2 py-1 pl-3 text-sm"
                        style={{
                          borderColor: HIGHLIGHT.has(type) ? STATUS.good : '#e6e2da',
                        }}
                      >
                        <span
                          className="w-16 shrink-0 text-xs tabular-nums"
                          style={{ color: INK_MUTED }}
                        >
                          {new Date(event.ts as Date).toLocaleTimeString(numberLocale(t.lang), {
                            hour: 'numeric',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                        <span className={HIGHLIGHT.has(type) ? 'font-medium text-ink' : 'text-gray-700'}>
                          {type in EVENT_LABELS
                            ? t(EVENT_LABELS[type as keyof typeof EVENT_LABELS])
                            : type}{' '}
                          <span className="text-gray-500">
                            {event.label ? String(event.label) : ''}
                            {event.path && type === 'pageview' ? ` ${event.path}` : ''}
                            {type === 'scroll' ? `${event.value}%` : ''}
                            {type === 'exit' && event.value
                              ? t('work.lead.after', { duration: duration(Number(event.value)) })
                              : ''}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </Panel>
          </div>

          <div className="space-y-4">
            <Panel title={t('work.lead.outcome')}>
              <LeadEditor
                leadId={String(record.id)}
                status={String(record.status)}
                valueCents={record.value_cents as number | null}
                notes={record.notes as string | null}
              />
            </Panel>

            <Panel title={t('work.lead.calls')} subtitle={t('work.lead.callsSubtitle')}>
              {calls.length === 0 ? (
                <Empty>{t('work.lead.noCalls')}</Empty>
              ) : (
                <ul className="space-y-2 text-sm">
                  {calls.map((entry) => {
                    const call = entry as Record<string, string | number | boolean | Date | null>;
                    return (
                      <li key={String(call.id)} className="flex items-baseline justify-between gap-2">
                        <span className="text-gray-700">
                          {dateTime(call.started_at as Date, t.lang)}
                        </span>
                        <span className="text-xs" style={{ color: call.answered ? '#006300' : '#8f2323' }}>
                          {call.answered
                            ? duration(call.duration_seconds as number)
                            : t('work.lead.missed')}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>

            <Panel
              title={t('work.lead.earlierVisits')}
              subtitle={t('work.lead.earlierVisitsSubtitle')}
            >
              {visits.length === 0 ? (
                <Empty>{t('work.lead.noVisits')}</Empty>
              ) : (
                <Table className="min-w-0">
                  <thead>
                    <tr>
                      <Th>{t('work.lead.when')}</Th>
                      <Th>{t('work.lead.channel')}</Th>
                      <Th numeric>{t('work.lead.pages')}</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {visits.map((entry) => {
                      const visit = entry as Record<string, string | number | boolean | Date | null>;
                      return (
                        <tr key={String(visit.id)}>
                          <Td className="whitespace-nowrap text-xs">
                            {dateTime(visit.started_at as Date, t.lang)}
                          </Td>
                          <Td>
                            <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs">
                              <span
                                aria-hidden
                                className="inline-block h-2 w-2 rounded-full"
                                style={{ backgroundColor: channelColor(String(visit.channel ?? '')) }}
                              />
                              {channelLabel(visit.channel as string)}
                            </span>
                          </Td>
                          <Td numeric>{String(visit.pageviews ?? 0)}</Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              )}
            </Panel>

            {exports.length > 0 && (
              <Panel title={t('work.lead.exports')}>
                <ul className="space-y-2 text-sm">
                  {exports.map((entry, index) => {
                    const record_ = entry as Record<string, string | number | Date | null>;
                    return (
                      <li key={index} className="flex items-baseline justify-between gap-2">
                        <span className="capitalize text-gray-700">
                          {String(record_.platform).replace('_', ' ')}
                        </span>
                        <span
                          className="text-xs"
                          style={{
                            color:
                              record_.status === 'sent'
                                ? '#006300'
                                : record_.status === 'failed'
                                  ? '#8f2323'
                                  : INK_MUTED,
                          }}
                        >
                          {String(record_.status) in EXPORT_STATUS
                            ? t(EXPORT_STATUS[String(record_.status) as keyof typeof EXPORT_STATUS])
                            : String(record_.status)}
                          {record_.sent_at ? ` · ${relativeTime(record_.sent_at as Date)}` : ''}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </Panel>
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    return <SetupNotice error={error} />;
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-heading text-[10px] uppercase tracking-label text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-800">{children}</dd>
    </div>
  );
}

function Touch({
  title,
  note,
  channel,
  source,
  medium,
  campaign,
  content,
  term,
  landing,
  referrer,
}: {
  title: string;
  note: string;
  channel: string | null;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  content: string | null;
  term: string | null;
  landing: string | null;
  referrer?: string | null;
}) {
  const t = serverTranslator();
  return (
    <div className="rounded-card border border-primary-500/20 p-3">
      <p className="font-heading text-[10px] uppercase tracking-label text-gray-500">{title}</p>
      <p className="mt-1 flex items-center gap-2 font-medium text-ink">
        <span
          aria-hidden
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: channelColor(channel ?? '') }}
        />
        {channelLabel(channel)}
      </p>
      <p className="mt-0.5 text-xs" style={{ color: INK_MUTED }}>
        {note}
      </p>
      <dl className="mt-3 space-y-1 text-xs text-gray-600">
        {source && <Row label={t('work.lead.source')} value={source} />}
        {medium && <Row label={t('work.lead.medium')} value={medium} />}
        {campaign && <Row label={t('work.lead.campaign')} value={campaign} />}
        {content && <Row label={t('work.lead.ad')} value={content} />}
        {term && <Row label={t('work.lead.keyword')} value={term} />}
        {landing && <Row label={t('work.lead.landedOn')} value={landing} />}
        {referrer && <Row label={t('work.lead.referrer')} value={referrer} />}
      </dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-20 shrink-0 text-gray-500">{label}</dt>
      <dd className="truncate">{value}</dd>
    </div>
  );
}
