import Link from 'next/link';
import { getVoice } from '@/lib/marketing/voice';
import { CHANNELS } from '@/lib/marketing/prompts';
import { serverTranslator } from '@/lib/i18n/server';
import type { TranslationKey } from '@/lib/i18n';
import { Hint, Panel, SetupNotice } from '@/components/admin/ui';
import { VoiceEditor } from '@/components/admin/VoiceEditor';

export const dynamic = 'force-dynamic';

export default async function VoicePage() {
  const t = serverTranslator();

  try {
    const voice = await getVoice();

    return (
      <div className="space-y-6">
        <header>
          <Link
            href="/admin/marketing"
            className="font-heading text-[10px] uppercase tracking-label text-gray-500 hover:text-ink"
          >
            {t('marketing.job.back')}
          </Link>
          <h1 className="mt-1 font-heading text-xl font-bold uppercase tracking-label text-ink">
            {t('marketing.voice.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-600">{t('marketing.voice.subtitle')}</p>
        </header>

        <Panel>
          <VoiceEditor voice={voice} />
        </Panel>

        <Panel title={t('marketing.voice.whatGets')}>
          <ul className="space-y-3">
            {/* The brief itself is what the model is given, in English; what is
                shown here is the same instruction said in the reader's language. */}
            {CHANNELS.map((channel) => (
              <li key={channel.key}>
                <p className="text-sm font-medium text-ink">
                  {t(`marketing.piece.${channel.key}` as TranslationKey)}
                </p>
                <p className="text-xs leading-relaxed text-gray-600">
                  {t(`marketing.brief.${channel.key}` as TranslationKey)}
                </p>
              </li>
            ))}
          </ul>
          <Hint>{t('marketing.voice.hint')}</Hint>
        </Panel>
      </div>
    );
  } catch (error) {
    return <SetupNotice error={error} />;
  }
}
