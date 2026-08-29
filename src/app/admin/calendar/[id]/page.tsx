import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getJob, getTeam, OperationsApiError } from '@/lib/bookings/client';
import { dateTime, money, relativeTime } from '@/lib/admin/format';
import { serverTranslator } from '@/lib/i18n/server';
import { timeOfDay } from '@/lib/bookings/month';
import { Empty, Hint, Panel, SetupNotice, StatusPill, Table, Td, Th, Warning } from '@/components/admin/ui';
import type { JobPhoto } from '@/lib/bookings/client';
import { RescheduleForm } from '@/components/admin/RescheduleForm';
import { AssignForm } from '@/components/admin/AssignForm';
import { CallButton } from '@/components/admin/CallButton';

export const dynamic = 'force-dynamic';

/**
 * One visit, in full.
 *
 * The calendar carries a name and a time because that is what a month is read
 * for. Everything else — the phone number, what it was priced from, what was
 * found — needs the job opened on its own, which is also the only shape the
 * API will hand it over in.
 */

export default async function JobPage({ params }: { params: { id: string } }) {
  const t = serverTranslator();
  let job;

  try {
    ({ job } = await getJob(params.id));
  } catch (error) {
    if (error instanceof OperationsApiError) {
      if (error.status === 404) notFound();
      return (
        <div className="space-y-4">
          <BackLink />
          <Warning>{error.message}</Warning>
        </div>
      );
    }
    return <SetupNotice error={error} />;
  }

  // A board without lanes is still a board; a job card that will not draw
  // because the roster failed is not.
  const team = await getTeam()
    .then((r) => r.members)
    .catch(() => []);

  const billable = job.lineItems.filter((item) => !item.isExcluded);

  // Scans of signed paper live under the same category as any other document
  // photograph, so they are split out by that category rather than by guessing
  // from a caption.
  const scans = job.photos.filter((photo) => photo.category === 'DOCUMENT');
  const workPhotos = job.photos.filter((photo) => photo.category !== 'DOCUMENT');
  const PHOTO_GROUPS: { key: JobPhoto['category']; label: string }[] = [
    { key: 'BEFORE', label: t('work.job.photo.BEFORE') },
    { key: 'DURING', label: t('work.job.photo.DURING') },
    { key: 'AFTER', label: t('work.job.photo.AFTER') },
    { key: 'ISSUE', label: t('work.job.photo.ISSUE') },
    { key: 'GENERAL', label: t('work.job.photo.GENERAL') },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <BackLink />
          <h1 className="mt-2 font-heading text-xl font-bold uppercase tracking-label text-ink">
            {job.jobNumber ?? t('work.job.untitled')}
            {job.client?.name ? ` · ${job.client.name}` : ''}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {job.scheduledAt ? (
              <>
                {dateTime(job.scheduledAt, t.lang)}
                {job.scheduledEnd && ` – ${timeOfDay(job.scheduledEnd)}`}
              </>
            ) : (
              t('work.job.notScheduled')
            )}
            {job.type ? ` · ${job.type}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={job.status} />
          <StatusPill status={job.paymentStatus} />
        </div>
      </div>

      {/* Whose name the work is under. On this account most visits are
          dispatched, so it is the first thing worth knowing about a job. */}
      {job.brand && (
        <p className="text-sm text-gray-600">
          {t('work.job.doneUnderBefore')}
          <strong className="text-ink">{job.brand.name}</strong>
          {t('work.job.doneUnderAfter')}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <Panel title={t('work.job.pricedFrom')}>
            {billable.length === 0 ? (
              <Empty>{t('work.job.nothingItemised')}</Empty>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>{t('work.job.item')}</Th>
                    <Th numeric>{t('work.job.qty')}</Th>
                    <Th numeric>{t('work.job.each')}</Th>
                    <Th numeric>{t('work.job.lineTotal')}</Th>
                  </tr>
                </thead>
                <tbody>
                  {billable.map((item) => (
                    <tr key={item.id}>
                      <Td>
                        {item.description}
                        {item.partNumber && (
                          <div className="font-mono text-xs text-gray-500">{item.partNumber}</div>
                        )}
                      </Td>
                      <Td numeric>{item.quantity}</Td>
                      <Td numeric>{money(item.unitPriceCents, t.lang)}</Td>
                      <Td numeric>{money(item.totalCents, t.lang)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}

            <dl className="mt-4 space-y-1.5 border-t border-primary-500/15 pt-4 text-sm">
              <Money label={t('work.job.subtotal')} cents={job.subtotalCents} />
              <Money label={t('work.job.tax', { rate: job.taxRate })} cents={job.taxCents} />
              <Money label={t('work.job.total')} cents={job.totalCents} strong />
            </dl>
          </Panel>

          <Panel
            title={t('work.job.photos')}
            subtitle={t('work.job.photosSubtitle', { n: workPhotos.length })}
          >
            {workPhotos.length === 0 ? (
              <Empty>{t('work.job.noPhotos')}</Empty>
            ) : (
              <div className="space-y-5">
                {PHOTO_GROUPS.map((group) => {
                  const inGroup = workPhotos.filter((photo) => photo.category === group.key);
                  if (inGroup.length === 0) return null;

                  return (
                    <div key={group.key}>
                      <div className="mb-2 font-heading text-[10px] uppercase tracking-label text-gray-500">
                        {group.label} · {inGroup.length}
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                        {inGroup.map((photo) => (
                          <PhotoTile key={photo.id} jobId={job.id} photo={photo} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>

          {(job.notes || job.diagnosis || job.resolution) && (
            <Panel title={t('work.job.whatHappened')}>
              {job.diagnosis && <Para label={t('work.job.diagnosis')}>{job.diagnosis}</Para>}
              {job.resolution && <Para label={t('work.job.resolution')}>{job.resolution}</Para>}
              {job.notes && <Para label={t('work.job.notes')}>{job.notes}</Para>}
            </Panel>
          )}
        </div>

        <div className="space-y-4">
          <Panel
            title={t('work.job.whoIsGoing')}
            subtitle={t('work.job.whoIsGoingSubtitle')}
          >
            <AssignForm
              jobId={job.id}
              team={team}
              current={job.assignedTo ? [job.assignedTo.id] : []}
            />
          </Panel>

          <Panel title={t('work.job.moveTitle')}>
            <RescheduleForm
              jobId={job.id}
              canMove={job.status !== 'CANCELLED' && job.status !== 'PAID'}
            />
            <Hint>{t('work.job.moveHint')}</Hint>
          </Panel>

          <Panel title={t('work.job.documents')}>
            {job.documents.length === 0 ? (
              <Empty>{t('work.job.nothingBilled')}</Empty>
            ) : (
              <ul className="space-y-3">
                {job.documents.map((doc) => (
                  <li key={doc.id}>
                    <a
                      href={`/api/admin/documents/${doc.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-card border border-primary-500/20 p-3 transition-colors hover:border-ink"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-medium text-ink">{doc.documentNumber}</span>
                        <span className="tabular-nums text-sm text-ink">
                          {money(doc.totalCents, t.lang)}
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs text-gray-500">
                        {doc.type === 'INVOICE'
                          ? t('work.job.doc.invoice')
                          : t('work.job.doc.estimate')}
                        {doc.voidedAt
                          ? t('work.job.doc.voided')
                          : doc.paidAt
                            ? t('work.job.doc.paid', { when: dateTime(doc.paidAt, t.lang) })
                            : doc.signedAt
                              ? t('work.job.doc.signed', { when: dateTime(doc.signedAt, t.lang) })
                              : doc.sentAt
                                ? t('work.job.doc.sent', { when: dateTime(doc.sentAt, t.lang) })
                                : t('work.job.doc.notSent')}
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {scans.length > 0 && (
            <Panel title={t('work.job.scans')} subtitle={t('work.job.scansSubtitle')}>
              <div className="grid grid-cols-2 gap-2">
                {scans.map((photo) => (
                  <PhotoTile key={photo.id} jobId={job.id} photo={photo} />
                ))}
              </div>
              <Hint>{t('work.job.scansHint')}</Hint>
            </Panel>
          )}

          <Panel title={t('work.job.customer')}>
            <dl className="space-y-3">
              <Field label={t('work.job.name')}>{job.client?.name ?? '—'}</Field>
              <Field label={t('work.job.phone')}>
                {job.client?.phone ? (
                  <CallButton
                    phone={job.client.phone}
                    name={job.client.name ?? ''}
                    clientId={job.client.id}
                  />
                ) : (
                  '—'
                )}
              </Field>
              <Field label={t('work.job.address')}>{job.address ?? '—'}</Field>
              {job.appliance && (
                <Field label={t('work.job.appliance')}>
                  {[job.appliance.brand, job.appliance.model].filter(Boolean).join(' ') || '—'}
                </Field>
              )}
            </dl>
          </Panel>

          <Panel title={t('work.job.timeline')}>
            <dl className="space-y-3">
              <Field label={t('work.job.created')}>{dateTime(job.createdAt, t.lang)}</Field>
              <Field label={t('work.job.scheduled')}>
                {job.scheduledAt ? dateTime(job.scheduledAt, t.lang) : t('work.job.notScheduled')}
              </Field>
              <Field label={t('work.job.started')}>
                {job.startedAt ? dateTime(job.startedAt, t.lang) : '—'}
              </Field>
              <Field label={t('work.job.completed')}>
                {job.completedAt ? (
                  <>
                    {dateTime(job.completedAt, t.lang)}
                    <div className="text-xs text-gray-500">{relativeTime(job.completedAt)}</div>
                  </>
                ) : (
                  '—'
                )}
              </Field>
              <Field label={t('work.job.paid')}>
                {job.paidAt ? dateTime(job.paidAt, t.lang) : t('work.job.notPaidYet')}
              </Field>
              {job.assignedTo && (
                <Field label={t('work.job.assignedTo')}>{job.assignedTo.name}</Field>
              )}
            </dl>
          </Panel>
        </div>
      </div>

      <Hint>{t('work.job.hint')}</Hint>
    </div>
  );
}

/**
 * One photograph.
 *
 * Served through this site rather than linked from JobPocket's bucket: those
 * URLs carry no signature and no expiry, so one that escaped would keep working
 * for good. The proxy also takes the metadata off, because a photo taken in
 * somebody's kitchen carries the coordinates of that kitchen.
 */
function PhotoTile({ jobId, photo }: { jobId: string; photo: JobPhoto }) {
  const t = serverTranslator();
  const src = `/api/admin/jobs/${jobId}/photo/${photo.id}`;

  return (
    <a
      href={src}
      target="_blank"
      rel="noreferrer"
      className="block overflow-hidden rounded-card border border-primary-500/20 transition-colors hover:border-ink"
    >
      {/* Plain <img>: next/image would want the bucket in remotePatterns, and
          the whole point is that the bucket is never named to the browser. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={photo.caption ?? t('work.job.photoAlt')}
        loading="lazy"
        className="aspect-[4/3] w-full bg-cream-dark object-cover"
      />
      {photo.caption && (
        <div className="truncate px-2 py-1 text-[11px] text-gray-600">{photo.caption}</div>
      )}
    </a>
  );
}

function BackLink() {
  const t = serverTranslator();
  return (
    <Link
      href="/admin/calendar"
      className="font-heading text-[10px] font-semibold uppercase tracking-label text-gray-600 hover:text-ink"
    >
      {t('work.job.back')}
    </Link>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-heading text-[10px] uppercase tracking-label text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink">{children}</dd>
    </div>
  );
}

function Money({ label, cents, strong }: { label: string; cents: number; strong?: boolean }) {
  const t = serverTranslator();
  return (
    <div className="flex justify-between">
      <dt className={strong ? 'font-medium text-ink' : 'text-gray-600'}>{label}</dt>
      <dd className={strong ? 'font-medium tabular-nums text-ink' : 'tabular-nums text-gray-600'}>
        {money(cents, t.lang)}
      </dd>
    </div>
  );
}

function Para({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="font-heading text-[10px] uppercase tracking-label text-gray-500">{label}</div>
      <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{children}</p>
    </div>
  );
}
