import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMarketingJob, getContentHistory, findSimilarJobs } from '@/lib/marketing/queries';
import { dateTime } from '@/lib/admin/format';
import { serverTranslator } from '@/lib/i18n/server';
import type { TranslationKey } from '@/lib/i18n';
import { Empty, Hint, Panel, SetupNotice, Warning } from '@/components/admin/ui';
import { MarketingContent } from '@/components/admin/MarketingContent';
import { MarketingPhotos } from '@/components/admin/MarketingPhotos';
import type { EditRecipe } from '@/components/admin/PhotoEditor';
import type { Treatment } from '@/lib/marketing/treatment';
import { CHANNELS } from '@/lib/marketing/prompts';

export const dynamic = 'force-dynamic';

/** A labelled block of the technician's own words, or nothing at all. */
function Field({ label, value }: { label: string; value: string | null }) {
  if (!value?.trim()) return null;
  return (
    <div>
      <p className="font-heading text-[10px] font-semibold uppercase tracking-label text-gray-500">
        {label}
      </p>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink">{value}</p>
    </div>
  );
}

export default async function MarketingJobPage({ params }: { params: { jobId: string } }) {
  const t = serverTranslator();
  // The read is what can fail for a setup reason; `notFound()` throws a control
  // signal Next needs to see, so it is raised after the catch rather than
  // inside it, where it would be reported as a database problem.
  let detail: Awaited<ReturnType<typeof getMarketingJob>>;
  let history: Awaited<ReturnType<typeof getContentHistory>> = {};
  let similar: Awaited<ReturnType<typeof findSimilarJobs>> = [];
  try {
    detail = await getMarketingJob(params.jobId);
    if (detail) {
      [history, similar] = await Promise.all([
        getContentHistory(params.jobId),
        findSimilarJobs(detail.job),
      ]);
    }
  } catch (error) {
    return <SetupNotice error={error} />;
  }
  if (!detail) notFound();

  {
    const { job, photos, content } = detail;
    const title =
      [job.manufacturer, job.appliance_type].filter(Boolean).join(' ') ||
      t('marketing.job.repairFallback');
    const place = [job.city, job.state].filter(Boolean).join(', ');

    return (
      <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link
              href="/admin/marketing"
              className="font-heading text-[10px] uppercase tracking-label text-gray-500 hover:text-ink"
            >
              {t('marketing.job.back')}
            </Link>
            <h1 className="mt-1 font-heading text-xl font-bold uppercase tracking-label text-ink">
              {title}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {[
                job.model ? t('marketing.job.model', { model: job.model }) : null,
                place || null,
                job.completed_at ? dateTime(job.completed_at, t.lang) : null,
              ]
                .filter(Boolean)
                .join(' · ') || '—'}
            </p>
          </div>
          {job.error_codes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {job.error_codes.map((code) => (
                <span
                  key={code}
                  className="rounded-card border border-primary-500/30 px-2 py-1 font-mono text-xs text-ink"
                >
                  {code}
                </span>
              ))}
            </div>
          )}
        </header>

        {!job.released && <Warning>{t('marketing.job.unreleased')}</Warning>}

        {similar.length > 0 && (
          <Warning>
            {t('marketing.job.similarLead', {
              jobs: t.plural(similar.length, 'marketing.plural.similarJob'),
            })}{' '}
            {similar.map((entry, index) => (
              <span key={entry.job_id}>
                {index > 0 ? ', ' : ''}
                <Link
                  href={`/admin/marketing/${entry.job_id}`}
                  className="underline underline-offset-2"
                >
                  {entry.title || `${entry.manufacturer ?? ''} ${entry.appliance_type ?? ''}`.trim()}
                </Link>
                {entry.status === 'published' ? t('marketing.job.live') : ''}
              </span>
            ))}
            {t('marketing.job.similarTail')}
          </Warning>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <Panel title={t('marketing.job.theRepair')}>
              <div className="space-y-5">
                <Field label={t('marketing.job.whatWasWrong')} value={job.diagnosis} />
                <Field label={t('marketing.job.whatWasDone')} value={job.repair_performed} />
                <Field label={t('marketing.job.techNote')} value={job.technician_notes} />
                {!job.diagnosis && !job.repair_performed && !job.technician_notes && (
                  <Empty>{t('marketing.job.nothingWritten')}</Empty>
                )}
              </div>

              {job.redacted.length > 0 && (
                // The field names come across with the job and are left as they
                // arrived; only the sentence around them is ours.
                <Hint>{t('marketing.job.redacted', { fields: job.redacted.join(', ') })}</Hint>
              )}
            </Panel>

            <Panel title={t('marketing.job.parts')}>
              {job.replaced_parts.length === 0 ? (
                <Empty>{t('marketing.job.noParts')}</Empty>
              ) : (
                <ul className="space-y-2">
                  {job.replaced_parts.map((part, index) => (
                    <li key={`${part.partNumber}-${index}`} className="flex justify-between text-sm">
                      <span className="text-ink">{part.description}</span>
                      <span className="font-mono text-xs text-gray-600">{part.partNumber}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel
              title={t('marketing.job.content')}
              subtitle={t('marketing.job.contentSub')}
            >
              <MarketingContent
                jobId={job.job_id}
                // No diagnosis and no repair means there is nothing to write an
                // article *about* — only a note. Say so before the button is
                // pressed rather than producing three paragraphs of hedging.
                thin={!job.diagnosis && !job.repair_performed}
                channels={CHANNELS.map((channel) => ({
                  key: channel.key,
                  label: t(`marketing.piece.${channel.key}` as TranslationKey),
                }))}
                pieces={content.map((piece) => ({
                  channel: piece.channel,
                  status: piece.status,
                  slug: piece.slug,
                  title: piece.title,
                  metaTitle: piece.meta_title,
                  metaDesc: piece.meta_desc,
                  generatedBody: piece.generated_body,
                  editedBody: piece.edited_body,
                  model: piece.model,
                  flags: piece.flags,
                  updatedAt: piece.updated_at ? String(piece.updated_at) : null,
                  history: (history[piece.channel] ?? []).map((version) => ({
                    id: version.id,
                    at: String(version.created_at),
                    source: version.source,
                    model: version.model,
                  })),
                }))}
              />
            </Panel>
          </div>

          <Panel
            title={t('marketing.job.photos')}
            subtitle={t('marketing.job.photosSub', {
              photos: t.plural(photos.length, 'marketing.plural.photo'),
            })}
          >
            {photos.length === 0 ? (
              <Empty>{t('marketing.job.noPhotos')}</Empty>
            ) : (
              <MarketingPhotos
                jobId={job.job_id}
                fallbackHeadline={(job.diagnosis ?? job.repair_performed ?? '')
                  .split(/[.;]/)[0]
                  .trim()
                  .slice(0, 28)
                  .toUpperCase()}
                photos={photos.map((photo) => ({
                  id: photo.photo_id,
                  caption: photo.caption,
                  selected: photo.selected,
                  sortOrder: photo.sort_order,
                  altText: photo.alt_text,
                  editRecipe: (photo as { edit_recipe?: EditRecipe | null }).edit_recipe ?? null,
                  editedRev: (photo as { edited_rev?: string | null }).edited_rev ?? null,
                  treatment: ((): Treatment | null => {
                    // Same caution as the public read: a row written before the
                    // encoding was fixed holds a JSON string here.
                    const raw = (photo as { treatment?: unknown }).treatment;
                    if (!raw) return null;
                    if (typeof raw === 'string') {
                      try {
                        return JSON.parse(raw) as Treatment;
                      } catch {
                        return null;
                      }
                    }
                    return raw as Treatment;
                  })(),
                  approved: Boolean((photo as { approved_at?: unknown }).approved_at),
                }))}
              />
            )}
            <Hint>{t('marketing.job.photosHint')}</Hint>
          </Panel>
        </div>
      </div>
    );
  }
}
