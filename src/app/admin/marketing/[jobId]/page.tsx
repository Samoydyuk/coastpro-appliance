import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMarketingJob, getContentHistory, findSimilarJobs } from '@/lib/marketing/queries';
import { dateTime } from '@/lib/admin/format';
import { Empty, Hint, Panel, SetupNotice, Warning } from '@/components/admin/ui';
import { MarketingContent } from '@/components/admin/MarketingContent';
import { MarketingPhotos } from '@/components/admin/MarketingPhotos';
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
    const title = [job.manufacturer, job.appliance_type].filter(Boolean).join(' ') || 'Repair';
    const place = [job.city, job.state].filter(Boolean).join(', ');

    return (
      <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link
              href="/admin/marketing"
              className="font-heading text-[10px] uppercase tracking-label text-gray-500 hover:text-ink"
            >
              ← Marketing
            </Link>
            <h1 className="mt-1 font-heading text-xl font-bold uppercase tracking-label text-ink">
              {title}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {[
                job.model ? `Model ${job.model}` : null,
                place || null,
                job.completed_at ? dateTime(job.completed_at) : null,
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

        {!job.released && (
          <Warning>
            This job has been taken off the website list in the app. It is still here because
            something has been written from it — but nothing new should be, and anything already
            published from it is worth taking down.
          </Warning>
        )}

        {similar.length > 0 && (
          <Warning>
            Something has already been written about {similar.length === 1 ? 'a' : similar.length}{' '}
            similar {similar.length === 1 ? 'job' : 'jobs'}:{' '}
            {similar.map((entry, index) => (
              <span key={entry.job_id}>
                {index > 0 ? ', ' : ''}
                <Link
                  href={`/admin/marketing/${entry.job_id}`}
                  className="underline underline-offset-2"
                >
                  {entry.title || `${entry.manufacturer ?? ''} ${entry.appliance_type ?? ''}`.trim()}
                </Link>
                {entry.status === 'published' ? ' (live)' : ''}
              </span>
            ))}
            . Worth a look before writing another — two pages about the same fault compete with
            each other for the search that matters. Not a reason not to: the second one may be
            the better page.
          </Warning>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <Panel title="The repair">
              <div className="space-y-5">
                <Field label="What was wrong" value={job.diagnosis} />
                <Field label="What was done" value={job.repair_performed} />
                <Field label="Technician's note for the website" value={job.technician_notes} />
                {!job.diagnosis && !job.repair_performed && !job.technician_notes && (
                  <Empty>
                    Nothing was written on this job. An article can still be built from the
                    appliance, the brand and the parts — but it will be a thin one.
                  </Empty>
                )}
              </div>

              {job.redacted.length > 0 && (
                <Hint>
                  Removed before this left JobPocket: {job.redacted.join(', ')}. The text above is
                  what remains — a phone number or a name the technician typed never reached this
                  server, and the labels are here so that is visible rather than assumed.
                </Hint>
              )}
            </Panel>

            <Panel title="Parts replaced">
              {job.replaced_parts.length === 0 ? (
                <Empty>No parts recorded with a number.</Empty>
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
              title="Content"
              subtitle="Written from the fields above and nothing else. Every piece is a draft."
            >
              <MarketingContent
                jobId={job.job_id}
                channels={CHANNELS.map((channel) => ({ key: channel.key, label: channel.label }))}
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

          <Panel title="Photos" subtitle={`${photos.length} released · tap to choose`}>
            {photos.length === 0 ? (
              <Empty>
                No photos released for this job. A picture has its own switch in the app — off
                until somebody turns it on, because no field filter can see a house number or a
                face in an image.
              </Empty>
            ) : (
              <MarketingPhotos
                jobId={job.job_id}
                photos={photos.map((photo) => ({
                  id: photo.photo_id,
                  caption: photo.caption,
                  selected: photo.selected,
                  sortOrder: photo.sort_order,
                  altText: photo.alt_text,
                }))}
              />
            )}
            <Hint>
              Served through this console rather than from storage, so the location the camera
              wrote into the file is stripped on the way and the key never reaches the browser.
            </Hint>
          </Panel>
        </div>
      </div>
    );
  }
}
