import Link from 'next/link';
import { getVoice } from '@/lib/marketing/voice';
import { CHANNELS } from '@/lib/marketing/prompts';
import { Hint, Panel, SetupNotice } from '@/components/admin/ui';
import { VoiceEditor } from '@/components/admin/VoiceEditor';

export const dynamic = 'force-dynamic';

export default async function VoicePage() {
  try {
    const voice = await getVoice();

    return (
      <div className="space-y-6">
        <header>
          <Link
            href="/admin/marketing"
            className="font-heading text-[10px] uppercase tracking-label text-gray-500 hover:text-ink"
          >
            ← Marketing
          </Link>
          <h1 className="mt-1 font-heading text-xl font-bold uppercase tracking-label text-ink">
            House voice
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Applies to every channel. Changing it changes the next draft, not the ones already
            written.
          </p>
        </header>

        <Panel>
          <VoiceEditor voice={voice} />
        </Panel>

        <Panel title="What gets written">
          <ul className="space-y-3">
            {CHANNELS.map((channel) => (
              <li key={channel.key}>
                <p className="text-sm font-medium text-ink">{channel.label}</p>
                <p className="text-xs leading-relaxed text-gray-600">{channel.brief}</p>
              </li>
            ))}
          </ul>
          <Hint>
            Each draft is built from an outline assembled out of the fields that job actually
            has. A repair with no diagnosis recorded does not get a &ldquo;what we
            found&rdquo; section written from guesswork — it gets an outline with no such
            section in it.
          </Hint>
        </Panel>
      </div>
    );
  } catch (error) {
    return <SetupNotice error={error} />;
  }
}
