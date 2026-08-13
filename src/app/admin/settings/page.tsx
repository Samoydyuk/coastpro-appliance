import { getTrackingNumbers } from '@/lib/admin/queries';
import { channelLabel } from '@/lib/attribution';
import { googleAdsConfigured, metaConfigured } from '@/lib/conversions';
import { jobPocketConfig } from '@/lib/jobpocket';
import { siteConfig } from '@/data/site-config';
import { Empty, Hint, Panel, SetupNotice, Table, Td, Th } from '@/components/admin/ui';
import { NumberEditor, RetireNumberButton } from '@/components/admin/NumberEditor';
import { STATUS } from '@/components/admin/palette';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  try {
    const numbers = (await getTrackingNumbers()) as Record<
      string,
      string | boolean | Date | null
    >[];
    const jobPocket = await jobPocketConfig();

    const integrations = [
      {
        name: 'Database',
        ready: true,
        detail: 'Connected. Visits, leads and calls are being recorded.',
      },
      {
        name: 'Lead notifications (Resend)',
        ready: Boolean(process.env.RESEND_API_KEY),
        detail: process.env.RESEND_API_KEY
          ? `Delivered to ${process.env.CONTACT_TO_EMAIL ?? siteConfig.contact.email}`
          : 'RESEND_API_KEY is not set — form submissions are recorded but nobody is emailed.',
      },
      {
        name: 'JobPocket bookings',
        ready: Boolean(jobPocket?.enabled),
        detail: jobPocket?.enabled
          ? 'Enquiries go straight to the phone as booking requests, and the outcome of each job comes back here.'
          : jobPocket
            ? 'Configured but switched off — enquiries are being recorded and queued, not dispatched.'
            : 'No plugin key. Enquiries are recorded here but nobody is notified.',
      },
      {
        name: 'Call tracking (Telnyx)',
        ready: Boolean(process.env.TELNYX_PUBLIC_KEY || process.env.TELNYX_WEBHOOK_TOKEN),
        detail:
          process.env.TELNYX_PUBLIC_KEY || process.env.TELNYX_WEBHOOK_TOKEN
            ? 'Webhook authenticated. Point each tracking number at /api/telnyx/webhook.'
            : 'No public key or token set — the call webhook will accept anything, which is fine only while testing.',
      },
      {
        name: 'Google Ads conversions',
        ready: googleAdsConfigured(),
        detail: googleAdsConfigured()
          ? 'Won jobs are uploaded against the original click.'
          : 'Not configured. Google is optimising on form fills rather than on paid jobs.',
      },
      {
        name: 'Meta conversions',
        ready: metaConfigured(),
        detail: metaConfigured()
          ? 'Events are sent server-side through the Conversions API.'
          : 'Not configured. Meta sees only what survives the browser, which is a minority of it.',
      },
    ];

    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-xl font-bold uppercase tracking-label text-ink">
            Settings
          </h1>
          <p className="mt-1 text-sm text-gray-600">Numbers, integrations and what is still missing</p>
        </div>

        <Panel title="Integrations" subtitle="What is connected right now">
          <ul className="divide-y divide-primary-500/10">
            {integrations.map((entry) => (
              <li key={entry.name} className="flex items-start gap-3 py-3">
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
                      {entry.ready ? 'ready' : 'not set up'}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-gray-600">{entry.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title="Tracking numbers"
          subtitle="One per channel — whichever rings tells us which ad paid for the call"
        >
          <NumberEditor />

          <div className="mt-5">
            {numbers.length === 0 ? (
              <Empty>
                No numbers yet. Until one is added, every visitor sees {siteConfig.contact.phone}{' '}
                and calls cannot be attributed.
              </Empty>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Number</Th>
                    <Th>Shown to</Th>
                    <Th>Label</Th>
                    <Th>Status</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {numbers.map((row) => (
                    <tr key={String(row.id)}>
                      <Td className="font-mono text-xs">{row.number_e164 as string}</Td>
                      <Td>
                        {row.channel === 'default'
                          ? 'Everyone else'
                          : channelLabel(row.channel as string)}
                      </Td>
                      <Td>{(row.label as string) || '—'}</Td>
                      <Td>
                        <span style={{ color: row.active ? '#006300' : '#898781' }}>
                          {row.active ? 'Active' : 'Retired'}
                        </span>
                      </Td>
                      <Td numeric>{row.active ? <RetireNumberButton id={String(row.id)} /> : null}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>

          <Hint>
            Buy the numbers in Telnyx, forward each to {siteConfig.contact.phone}, and point their
            voice webhook at <code className="rounded bg-cream-dark px-1 py-0.5">/api/telnyx/webhook</code>.
            The site then shows each visitor the number for their channel; anyone whose channel has
            no number keeps the main line, so no call can ever be lost to a missing row here.
          </Hint>
        </Panel>

        <Panel title="How to tag your ads" subtitle="What each platform needs on its links">
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="font-medium text-ink">Google Ads</dt>
              <dd className="mt-1 text-gray-600">
                Leave auto-tagging on — it supplies the click id by itself. To get keyword and
                creative reporting, set the account tracking template to{' '}
                <code className="break-all rounded bg-cream-dark px-1 py-0.5">
                  {'{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_content={creative}&utm_term={keyword}'}
                </code>
              </dd>
            </div>
            <div>
              <dt className="font-medium text-ink">Local Services Ads</dt>
              <dd className="mt-1 text-gray-600">
                LSA has no click id, so tag the profile&apos;s website link with{' '}
                <code className="rounded bg-cream-dark px-1 py-0.5">
                  ?utm_source=google&amp;utm_medium=lsa
                </code>
                . Most LSA leads arrive by phone, so its tracking number matters more than the tag.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-ink">Meta</dt>
              <dd className="mt-1 text-gray-600">
                Add{' '}
                <code className="break-all rounded bg-cream-dark px-1 py-0.5">
                  utm_source=facebook&amp;utm_medium=paid-social&amp;utm_campaign=
                  {'{{campaign.name}}'}&amp;utm_content={'{{ad.name}}'}
                </code>{' '}
                to the URL parameters field. Without the medium, Meta traffic cannot be told apart
                from an ordinary post.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-ink">Yelp, Nextdoor, anything else</dt>
              <dd className="mt-1 text-gray-600">
                Any link works as long as it carries{' '}
                <code className="rounded bg-cream-dark px-1 py-0.5">utm_source</code> and{' '}
                <code className="rounded bg-cream-dark px-1 py-0.5">utm_medium=cpc</code>. Untagged
                traffic still gets classified by its referrer, just less precisely.
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
