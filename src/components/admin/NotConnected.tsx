import Link from 'next/link';
import { Panel } from '@/components/admin/ui';
import { serverTranslator } from '@/lib/i18n/server';

/**
 * What to show instead of an empty screen when nothing is connected yet.
 *
 * An empty month grid with a warning above it reads as "no work booked". That
 * is a far more alarming sentence than "not connected", and it is the wrong
 * one — so when there is no key, the month is not drawn at all.
 *
 * `what` is the thing the screen was going to show — "Jobs and payments" — and
 * it arrives already worded from the page that could not draw itself. Each
 * page names its own subject, so it is that page's job to say it in the
 * reader's language.
 */
export function NotConnected({ what }: { what: string }) {
  const t = serverTranslator();

  return (
    <Panel
      title={t('shared.notConnected.title')}
      subtitle={t('shared.notConnected.subtitle', { what })}
    >
      <div className="max-w-prose space-y-4 text-sm text-gray-700">
        <p>{t('shared.notConnected.body')}</p>

        <ol className="space-y-2">
          <Step n={1}>
            {t('shared.notConnected.step1')}{' '}
            <strong className="text-ink">{t('shared.notConnected.step1menu')}</strong>
            {t('shared.notConnected.step1find')}{' '}
            <strong className="text-ink">{t('shared.notConnected.step1toggle')}</strong>
            {t('shared.notConnected.step1end')}
          </Step>
          <Step n={2}>
            {t('shared.notConnected.step2')}{' '}
            <strong className="text-ink">{t('shared.notConnected.step2once')}</strong>{' '}
            {t('shared.notConnected.step2end')}
          </Step>
          <Step n={3}>
            {t('shared.notConnected.step3')}{' '}
            <Link href="/admin/settings" className="text-ink underline hover:text-primary-600">
              {t('nav.settings')}
            </Link>{' '}
            {t('shared.notConnected.step3under')}{' '}
            <strong className="text-ink">{t('shared.notConnected.step3keys')}</strong>
            {t('shared.notConnected.step3end')}
          </Step>
        </ol>

        <p className="text-xs text-gray-600">{t('shared.notConnected.footnote')}</p>
      </div>
    </Panel>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-semibold text-cream">
        {n}
      </span>
      <span>{children}</span>
    </li>
  );
}
