import { getTrackingNumbers } from '@/lib/admin/queries';
import { CHANNEL_LABELS, channelLabel } from '@/lib/attribution';
import { googleAdsConfigured, metaConfigured } from '@/lib/conversions';
import { jobPocketConfig } from '@/lib/jobpocket';
import { secretsConfigured } from '@/lib/secrets';
import { siteConfig } from '@/data/site-config';
import { Empty, Hint, Panel, SetupNotice, Table, Td, Th } from '@/components/admin/ui';
import { NumberEditor, RetireNumberButton } from '@/components/admin/NumberEditor';
import { IntegrationKeyEditor } from '@/components/admin/IntegrationKeyEditor';
import { DispatchSetup } from '@/components/admin/DispatchSetup';
import { getSeat } from '@/lib/dispatch/client';
import { STATUS } from '@/components/admin/palette';
import { serverTranslator } from '@/lib/i18n/server';
import type { TranslationKey, Translator } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

/**
 * What a channel is called, in the language being read.
 *
 * The names live under `marketing.channel.*` because that is where the rest of
 * the console reads them from, and a number listed as "Прямі" here while the
 * channels report says something else would be two names for one thing. The
 * stored value is the key and is never touched; anything that was written into
 * the database but never added to the map falls back to `channelLabel`, so an
 * unrecognised channel reads as itself rather than as a dictionary key.
 */
function channelName(t: Translator, channel: string): string {
  return channel in CHANNEL_LABELS
    ? t(`marketing.channel.${channel}` as TranslationKey)
    : channelLabel(channel);
}

export default async function SettingsPage() {
  try {
    const t = serverTranslator();
    const numbers = (await getTrackingNumbers()) as Record<
      string,
      string | boolean | Date | null
    >[];
    const jobPocket = await jobPocketConfig();
    const desk = await getSeat().catch(() => ({ seat: null, ringing: false }));

    // `id` rather than `name` as the React key: the name is display text, and a
    // list keyed on display text re-mounts itself the moment the language
    // changes.
    const integrations = [
      {
        id: 'database',
        name: t('settings.integ.database'),
        ready: true,
        detail: t('settings.integ.database.on'),
      },
      {
        id: 'resend',
        name: t('settings.integ.resend'),
        ready: Boolean(process.env.RESEND_API_KEY),
        detail: process.env.RESEND_API_KEY
          ? t('settings.integ.resend.on', {
              email: process.env.CONTACT_TO_EMAIL ?? siteConfig.contact.email,
            })
          : t('settings.integ.resend.off'),
      },
      {
        id: 'jobpocket',
        name: t('settings.integ.jobpocket'),
        ready: Boolean(jobPocket?.enabled),
        detail: jobPocket?.enabled
          ? t('settings.integ.jobpocket.on')
          : jobPocket
            ? t('settings.integ.jobpocket.paused')
            : t('settings.integ.jobpocket.off'),
      },
      {
        id: 'telnyx',
        name: t('settings.integ.telnyx'),
        ready: Boolean(process.env.TELNYX_PUBLIC_KEY || process.env.TELNYX_WEBHOOK_TOKEN),
        detail:
          process.env.TELNYX_PUBLIC_KEY || process.env.TELNYX_WEBHOOK_TOKEN
            ? t('settings.integ.telnyx.on')
            : t('settings.integ.telnyx.off'),
      },
      {
        id: 'google_ads',
        name: t('settings.integ.googleAds'),
        ready: googleAdsConfigured(),
        detail: googleAdsConfigured()
          ? t('settings.integ.googleAds.on')
          : t('settings.integ.googleAds.off'),
      },
      {
        id: 'meta',
        name: t('settings.integ.meta'),
        ready: metaConfigured(),
        detail: metaConfigured() ? t('settings.integ.meta.on') : t('settings.integ.meta.off'),
      },
    ];

    /**
     * Stated plainly, because a protection nobody knows is off is not a
     * protection. Each of these is one environment variable away from on, and
     * until it is, this panel says so in red.
     */
    const protections = [
      {
        id: 'totp',
        name: t('settings.access.totp'),
        ready: Boolean(process.env.ADMIN_TOTP_SECRET),
        detail: process.env.ADMIN_TOTP_SECRET
          ? t('settings.access.totp.on')
          : t('settings.access.totp.off'),
      },
      {
        id: 'sealed',
        name: t('settings.access.sealed'),
        ready: secretsConfigured(),
        detail: secretsConfigured()
          ? t('settings.access.sealed.on')
          : t('settings.access.sealed.off'),
      },
    ];

    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-xl font-bold uppercase tracking-label text-ink">
            {t('settings.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-600">{t('settings.subtitle')}</p>
        </div>

        <Panel
          title={t('settings.integrations.title')}
          subtitle={t('settings.integrations.subtitle')}
        >
          <ul className="divide-y divide-primary-500/10">
            {integrations.map((entry) => (
              <li key={entry.id} className="flex items-start gap-3 py-3">
                <span
                  aria-hidden
                  className="mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: entry.ready ? STATUS.good : STATUS.warning }}
                />
                <div>
                  <p className="text-sm font-medium text-ink">
                    {entry.name}
                    <span
                      className="ml-2 font-heading text-[10px] uppercase tracking-label"
                      style={{ color: entry.ready ? '#006300' : '#8a5a12' }}
                    >
                      {entry.ready
                        ? t('settings.integrations.ready')
                        : t('settings.integrations.notReady')}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-gray-600">{entry.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title={t('settings.access.title')} subtitle={t('settings.access.subtitle')}>
          <ul className="divide-y divide-primary-500/10">
            {protections.map((entry) => (
              <li key={entry.id} className="flex items-start gap-3 py-3">
                <span
                  aria-hidden
                  className="mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: entry.ready ? STATUS.good : STATUS.critical }}
                />
                <div>
                  <p className="text-sm font-medium text-ink">
                    {entry.name}
                    <span
                      className="ml-2 font-heading text-[10px] uppercase tracking-label"
                      style={{ color: entry.ready ? '#006300' : '#8f2323' }}
                    >
                      {entry.ready ? t('settings.access.on') : t('settings.access.off')}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-gray-600">{entry.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title={t('settings.desk.title')} subtitle={t('settings.desk.subtitle')}>
          <DispatchSetup seat={desk.seat} ringing={desk.ringing} />
        </Panel>

        <Panel title={t('settings.keys.title')} subtitle={t('settings.keys.subtitle')}>
          <IntegrationKeyEditor />
        </Panel>

        <Panel title={t('settings.numbers.title')} subtitle={t('settings.numbers.subtitle')}>
          <NumberEditor />

          <div className="mt-5">
            {numbers.length === 0 ? (
              <Empty>{t('settings.numbers.empty', { phone: siteConfig.contact.phone })}</Empty>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>{t('settings.numbers.number')}</Th>
                    <Th>{t('settings.numbers.shownTo')}</Th>
                    <Th>{t('settings.numbers.label')}</Th>
                    <Th>{t('settings.numbers.status')}</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {numbers.map((row) => (
                    <tr key={String(row.id)}>
                      <Td className="font-mono text-xs">{row.number_e164 as string}</Td>
                      <Td>
                        {row.channel === 'default'
                          ? t('settings.numbers.everyoneElse')
                          : channelName(t, row.channel as string)}
                      </Td>
                      <Td>{(row.label as string) || '—'}</Td>
                      <Td>
                        <span style={{ color: row.active ? '#006300' : '#898781' }}>
                          {row.active
                            ? t('settings.numbers.active')
                            : t('settings.numbers.retired')}
                        </span>
                      </Td>
                      <Td numeric>{row.active ? <RetireNumberButton id={String(row.id)} /> : null}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>

          {/* The `<code>` samples stay out of the dictionary — a tracking
              template is a literal to copy, not language. The prose around them
              is split only where a sample sits mid-sentence. */}
          <Hint>
            {t('settings.numbers.hint.1', { phone: siteConfig.contact.phone })}{' '}
            <code className="rounded bg-cream-dark px-1 py-0.5">/api/telnyx/webhook</code>
            {'. '}
            {t('settings.numbers.hint.2')}
          </Hint>
        </Panel>

        <Panel title={t('settings.tag.title')} subtitle={t('settings.tag.subtitle')}>
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="font-medium text-ink">{t('settings.tag.google')}</dt>
              <dd className="mt-1 text-gray-600">
                {t('settings.tag.google.body')}{' '}
                <code className="break-all rounded bg-cream-dark px-1 py-0.5">
                  {'{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_content={creative}&utm_term={keyword}'}
                </code>
              </dd>
            </div>
            <div>
              <dt className="font-medium text-ink">{t('settings.tag.lsa')}</dt>
              <dd className="mt-1 text-gray-600">
                {t('settings.tag.lsa.1')}{' '}
                <code className="rounded bg-cream-dark px-1 py-0.5">
                  ?utm_source=google&amp;utm_medium=lsa
                </code>
                {'. '}
                {t('settings.tag.lsa.2')}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-ink">{t('settings.tag.meta')}</dt>
              <dd className="mt-1 text-gray-600">
                {t('settings.tag.meta.1')}{' '}
                <code className="break-all rounded bg-cream-dark px-1 py-0.5">
                  utm_source=facebook&amp;utm_medium=paid-social&amp;utm_campaign=
                  {'{{campaign.name}}'}&amp;utm_content={'{{ad.name}}'}
                </code>{' '}
                {t('settings.tag.meta.2')}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-ink">{t('settings.tag.other')}</dt>
              <dd className="mt-1 text-gray-600">
                {t('settings.tag.other.1')}{' '}
                <code className="rounded bg-cream-dark px-1 py-0.5">utm_source</code>{' '}
                {t('settings.tag.other.2')}{' '}
                <code className="rounded bg-cream-dark px-1 py-0.5">utm_medium=cpc</code>
                {'. '}
                {t('settings.tag.other.3')}
              </dd>
            </div>
          </dl>
        </Panel>
      </div>
    );
  } catch (error) {
    return <SetupNotice error={error} />;
  }
}
