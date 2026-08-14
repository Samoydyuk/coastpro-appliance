import { requireDb } from '@/lib/db';
import { fetchMarketingJobs, type MarketingJob } from '@/lib/marketing/client';

/**
 * The local copy of the marketing dataset, and everything read off it.
 *
 * Why a copy at all, when the API is one call away: the writing has to hang on
 * something. A piece of content belongs to a job, and a job the owner later
 * un-marks would take its article with it if the article had nowhere else to
 * live. So the dataset is cached, the content references the cached id, and a
 * job that disappears from the API leaves its row — and its draft — behind.
 *
 * The cache is otherwise disposable: every refresh overwrites it, and the only
 * columns that survive are the human ones on marketing_photo, which is why
 * photos are upserted field by field rather than deleted and re-inserted.
 */

export interface MarketingJobRow {
  job_id: string;
  fetched_at: Date;
  status: string | null;
  completed_at: Date | null;
  appliance_type: string | null;
  manufacturer: string | null;
  model: string | null;
  diagnosis: string | null;
  repair_performed: string | null;
  technician_notes: string | null;
  error_codes: string[];
  replaced_parts: Array<{ description: string; partNumber: string | null }>;
  city: string | null;
  state: string | null;
  redacted: string[];
  photo_count: number;
  released: boolean;
}

export interface MarketingPhotoRow {
  photo_id: string;
  job_id: string;
  caption: string | null;
  category: string | null;
  selected: boolean;
  sort_order: number;
  alt_text: string | null;
}

export interface MarketingContentRow {
  id: string;
  job_id: string;
  channel: string;
  status: string;
  title: string | null;
  slug: string | null;
  meta_title: string | null;
  meta_desc: string | null;
  generated_body: string | null;
  edited_body: string | null;
  model: string | null;
  prompt_version: string | null;
  approved_by: string | null;
  approved_at: Date | null;
  flags: Array<{ label: string; excerpt: string }>;
  created_at: Date;
  updated_at: Date;
}

/**
 * The parts list, whatever shape it comes back in.
 *
 * A jsonb column reads as a parsed array through this driver, but a row
 * written before that was understood holds a JSON string instead — and the
 * difference is a page that crashes on `.map`. One line here beats a crash in
 * front of the owner.
 */
function asParts(value: unknown): Array<{ description: string; partNumber: string | null }> {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

// ---------------------------------------------------------------------------
// Refresh
// ---------------------------------------------------------------------------

/** Pull every released job from JobPocket into the local cache. */
export async function refreshMarketingJobs(): Promise<{ jobs: number; photos: number }> {
  const sql = requireDb();

  const all: MarketingJob[] = [];
  for (let page = 0; page < 20; page += 1) {
    const { jobs, hasMore } = await fetchMarketingJobs({ limit: 100, offset: page * 100 });
    all.push(...jobs);
    if (!hasMore) break;
  }

  let photos = 0;

  // `sql.json` rather than a stringified value cast to jsonb: the cast form
  // stores the array as a JSON *string*, and it reads back as one, so
  // `parts.map` on the page would be undefined. Verified against the live
  // database before this comment was written.
  for (const job of all) {
    await sql`
      insert into marketing_job (
        job_id, fetched_at, status, completed_at, job_created_at, job_updated_at,
        appliance_type, manufacturer, model,
        diagnosis, repair_performed, technician_notes, error_codes, replaced_parts,
        city, state, redacted, photo_count, released
      ) values (
        ${job.jobId}, now(), ${job.status}, ${job.completionDate}, ${job.createdAt}, ${job.updatedAt},
        ${job.applianceType}, ${job.manufacturer}, ${job.model},
        ${job.diagnosis}, ${job.repairPerformed}, ${job.publicTechnicianNotes},
        ${job.errorCodes}, ${sql.json(job.replacedParts as never)},
        ${job.city}, ${job.state}, ${job.redacted}, ${job.photos.length}, true
      )
      on conflict (job_id) do update set
        fetched_at       = now(),
        status           = excluded.status,
        completed_at     = excluded.completed_at,
        job_updated_at   = excluded.job_updated_at,
        appliance_type   = excluded.appliance_type,
        manufacturer     = excluded.manufacturer,
        model            = excluded.model,
        diagnosis        = excluded.diagnosis,
        repair_performed = excluded.repair_performed,
        technician_notes = excluded.technician_notes,
        error_codes      = excluded.error_codes,
        replaced_parts   = excluded.replaced_parts,
        city             = excluded.city,
        state            = excluded.state,
        redacted         = excluded.redacted,
        photo_count      = excluded.photo_count,
        released         = true
    `;

    for (const photo of job.photos) {
      // `selected`, `sort_order` and `alt_text` are the human's and are
      // deliberately absent from the update — a refresh must never undo a
      // choice somebody made about which pictures go out.
      await sql`
        insert into marketing_photo (photo_id, job_id, caption, category)
        values (${photo.id}, ${job.jobId}, ${photo.caption}, ${photo.category})
        on conflict (photo_id) do update set
          caption  = excluded.caption,
          category = excluded.category
      `;
      photos += 1;
    }

    // A photo the owner has taken back off the marketing list stops arriving.
    const keep = job.photos.map((p) => p.id);
    if (keep.length > 0) {
      await sql`
        delete from marketing_photo
        where job_id = ${job.jobId} and photo_id <> all(${keep})
      `;
    } else {
      await sql`delete from marketing_photo where job_id = ${job.jobId}`;
    }
  }

  // Whatever did not come back has been taken off the list in the app. The row
  // stays — a draft written from it must not vanish — but it stops counting as
  // released, and the console stops offering it.
  const present = all.map((job) => job.jobId);
  if (present.length > 0) {
    await sql`update marketing_job set released = false where job_id <> all(${present})`;
  } else {
    await sql`update marketing_job set released = false`;
  }

  return { jobs: all.length, photos };
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export interface MarketingFilters {
  search?: string;
  applianceType?: string;
  brand?: string;
  city?: string;
  errorCode?: string;
  contentStatus?: string;
  limit?: number;
  offset?: number;
}

export interface MarketingListRow extends MarketingJobRow {
  /** Channels already written for this job, so the list can show progress. */
  channels: string[];
  content_status: string | null;
  selected_photos: number;
}

export async function listMarketingJobs(
  filters: MarketingFilters = {}
): Promise<{ rows: MarketingListRow[]; total: number }> {
  const sql = requireDb();
  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;

  const where = sql`
    where (
      j.released
      -- A job withdrawn in the app is still shown while something written from
      -- it exists, because hiding it would hide that writing with it.
      or exists (select 1 from marketing_content c where c.job_id = j.job_id)
    )
      ${filters.applianceType ? sql`and j.appliance_type = ${filters.applianceType}` : sql``}
      ${filters.brand ? sql`and j.manufacturer = ${filters.brand}` : sql``}
      ${filters.city ? sql`and j.city = ${filters.city}` : sql``}
      ${filters.errorCode ? sql`and ${filters.errorCode} = any(j.error_codes)` : sql``}
      ${
        filters.contentStatus === 'none'
          ? sql`and not exists (select 1 from marketing_content c where c.job_id = j.job_id)`
          : filters.contentStatus
            ? sql`and exists (
                select 1 from marketing_content c
                where c.job_id = j.job_id and c.status = ${filters.contentStatus}
              )`
            : sql``
      }
      ${
        filters.search
          ? sql`and (
              j.diagnosis ilike ${'%' + filters.search + '%'}
              or j.repair_performed ilike ${'%' + filters.search + '%'}
              or j.technician_notes ilike ${'%' + filters.search + '%'}
              or j.model ilike ${'%' + filters.search + '%'}
              or j.manufacturer ilike ${'%' + filters.search + '%'}
            )`
          : sql``
      }
  `;

  const rows = (await sql`
    select
      j.*,
      coalesce(
        (select array_agg(distinct c.channel) from marketing_content c where c.job_id = j.job_id),
        '{}'
      ) as channels,
      (select c.status from marketing_content c
        where c.job_id = j.job_id order by c.updated_at desc limit 1) as content_status,
      (select count(*)::int from marketing_photo p
        where p.job_id = j.job_id and p.selected) as selected_photos
    from marketing_job j
    ${where}
    order by j.completed_at desc nulls last
    limit ${limit} offset ${offset}
  `) as unknown as MarketingListRow[];

  const [counted] = (await sql`
    select count(*)::int as total from marketing_job j ${where}
  `) as unknown as { total: number }[];

  return { rows, total: counted?.total ?? 0 };
}

/** The values worth offering in the filter dropdowns, and only those in use. */
export async function marketingFacets(): Promise<{
  types: string[];
  brands: string[];
  cities: string[];
  codes: string[];
}> {
  const sql = requireDb();

  const [row] = (await sql`
    select
      coalesce(array_agg(distinct appliance_type) filter (where appliance_type is not null), '{}') as types,
      coalesce(array_agg(distinct manufacturer)   filter (where manufacturer is not null),   '{}') as brands,
      coalesce(array_agg(distinct city)           filter (where city is not null),           '{}') as cities,
      coalesce((select array_agg(distinct code)
                from marketing_job, unnest(error_codes) as code
                where released), '{}') as codes
    from marketing_job
    where released
  `) as unknown as { types: string[]; brands: string[]; cities: string[]; codes: string[] }[];

  return {
    types: (row?.types ?? []).sort(),
    brands: (row?.brands ?? []).sort(),
    cities: (row?.cities ?? []).sort(),
    codes: (row?.codes ?? []).sort(),
  };
}

export async function getMarketingJob(jobId: string): Promise<{
  job: MarketingJobRow;
  photos: MarketingPhotoRow[];
  content: MarketingContentRow[];
} | null> {
  const sql = requireDb();

  const [row] = (await sql`
    select * from marketing_job where job_id = ${jobId}
  `) as unknown as MarketingJobRow[];
  if (!row) return null;
  const job = { ...row, replaced_parts: asParts(row.replaced_parts) };

  const photos = (await sql`
    select * from marketing_photo where job_id = ${jobId}
    order by sort_order, photo_id
  `) as unknown as MarketingPhotoRow[];

  const contentRows = (await sql`
    select * from marketing_content where job_id = ${jobId}
    order by channel
  `) as unknown as MarketingContentRow[];
  // Same jsonb caution as the parts list: a flag array the page cannot map
  // over would take the page down rather than the draft.
  const content = contentRows.map((row) => ({
    ...row,
    flags: Array.isArray(row.flags) ? row.flags : [],
  }));

  return { job, photos, content };
}

/** When the cache was last filled — shown so a stale list is obvious. */
export async function marketingLastRefresh(): Promise<Date | null> {
  const sql = requireDb();
  const [row] = (await sql`
    select max(fetched_at) as at from marketing_job
  `) as unknown as { at: Date | null }[];
  return row?.at ?? null;
}

/** A photo the console is allowed to show — that is, one we know about. */
export async function marketingPhotoExists(photoId: string): Promise<boolean> {
  const sql = requireDb();
  const [row] = (await sql`
    select 1 as ok from marketing_photo where photo_id = ${photoId}
  `) as unknown as { ok: number }[];
  return Boolean(row);
}

/** Which pictures go out, and in what order. */
export async function setPhotoSelection(
  jobId: string,
  selection: Array<{ photoId: string; selected: boolean; sortOrder: number; altText?: string | null }>
): Promise<void> {
  const sql = requireDb();
  for (const entry of selection) {
    await sql`
      update marketing_photo set
        selected   = ${entry.selected},
        sort_order = ${entry.sortOrder},
        alt_text   = ${entry.altText ?? null}
      where photo_id = ${entry.photoId} and job_id = ${jobId}
    `;
  }
}
