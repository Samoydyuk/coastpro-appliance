import { unstable_cache, revalidateTag } from 'next/cache';
import { db } from '@/lib/db';
import type { Treatment } from '@/lib/marketing/treatment';

/**
 * What the public site is allowed to read.
 *
 * Cached by tag rather than by path. Publishing changes two kinds of route at
 * once — a static index and a dynamic page generated on demand — and filing
 * both reads under one tag means a single invalidation rebuilds whichever of
 * them exists, without the caller having to know which. Verified by running
 * the cycle: publish, and the article and the index both change on the next
 * request; unpublish, and both change back.
 *
 * A separate module from the console's queries on purpose. These run on pages
 * a visitor can reach, so they use `db()` rather than `requireDb()` and return
 * nothing when the database is unavailable — a misconfigured analytics
 * database must never be able to take the website down. And every query here
 * carries `status = 'published'` in its own where clause, so there is no path
 * by which a draft can be rendered because a caller forgot a filter.
 */

export interface PublishedArticle {
  slug: string;
  title: string;
  metaTitle: string | null;
  metaDesc: string | null;
  body: string;
  /**
   * ISO strings, not Dates, and deliberately.
   *
   * Everything here goes through a cache that serialises to JSON, so a Date
   * put in comes back out as a string. Typing these as Date compiled cleanly
   * and then threw `publishedAt?.toISOString is not a function` on the first
   * cached read — at build time, on the page it had just generated. The type
   * now says what the value actually is.
   */
  publishedAt: string | null;
  updatedAt: string | null;

  applianceType: string | null;
  manufacturer: string | null;
  model: string | null;
  errorCodes: string[];
  city: string | null;
  state: string | null;

  /** `rev` versions the URL: an edit changes it, which is what gets past the
   *  day-long immutable cache on the image itself. */
  photos: Array<{
    id: string;
    alt: string | null;
    rev: string | null;
    category: string | null;
    /** Versions the URL when the corrected copy is remade. */
    processedRev: string | null;
    /** How it is dressed. Null, or unapproved, means the photograph as it is. */
    treatment: Treatment | null;
  }>;

  /**
   * The job sheet's own words, for the summary card at the top.
   *
   * Deliberately not the article's prose: a reader who wants to know whether
   * this is their fault reads three lines and leaves, and those three lines
   * should be what the technician wrote rather than a paraphrase of it.
   */
  diagnosis: string | null;
  repairPerformed: string | null;
  parts: Array<{ description: string; partNumber: string | null }>;
}

const SELECT = `
  c.slug, c.title, c.meta_title, c.meta_desc,
  coalesce(c.edited_body, c.generated_body) as body,
  c.approved_at, c.updated_at,
  j.appliance_type, j.manufacturer, j.model, j.error_codes, j.city, j.state,
  j.diagnosis, j.repair_performed, j.replaced_parts
`;

/**
 * Part numbers, out of a description meant to be read.
 *
 * Deliberately conservative: a run of letters and digits long enough to be a
 * catalogue number, and the known number for this part if it happens to be
 * spelled differently. An ordinary word survives it.
 */
function stripPartNumbers(text: string): string {
  return text
    .replace(/\b(?=[A-Z0-9-]{6,})(?=[A-Z-]*\d)[A-Z0-9-]+\b/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.])/g, '$1')
    .trim();
}

/** A timestamp from the driver, or from the cache, as one thing. */
function iso(value: unknown): string | null {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return null;
}

function shape(
  row: Record<string, unknown>,
  photos: PublishedArticle['photos']
): PublishedArticle {
  return {
    slug: String(row.slug),
    title: String(row.title ?? ''),
    metaTitle: (row.meta_title as string) ?? null,
    metaDesc: (row.meta_desc as string) ?? null,
    body: String(row.body ?? ''),
    publishedAt: iso(row.approved_at),
    updatedAt: iso(row.updated_at),
    applianceType: (row.appliance_type as string) ?? null,
    manufacturer: (row.manufacturer as string) ?? null,
    model: (row.model as string) ?? null,
    errorCodes: (row.error_codes as string[]) ?? [],
    city: (row.city as string) ?? null,
    state: (row.state as string) ?? null,
    photos,
    diagnosis: (row.diagnosis as string) ?? null,
    repairPerformed: (row.repair_performed as string) ?? null,
    // Same jsonb caution as everywhere else here: a malformed array must not
    // take the page down.
    parts: Array.isArray(row.replaced_parts)
      ? (row.replaced_parts as Array<{ description?: unknown; partNumber?: unknown }>)
          .map((part) => ({
            // The number is stripped, not merely left unrendered: it is often
            // inside the description itself — "Evaporator Fan Motor
            // WR60X26866" — and the rule is that a part number never appears
            // in public copy, because it is an invitation to order the wrong
            // thing (owner's instruction).
            description: stripPartNumbers(String(part?.description ?? '')),
            partNumber: part?.partNumber ? String(part.partNumber) : null,
          }))
          .filter((part) => part.description.length > 0)
      : [],
  };
}

/** The one tag every public read is filed under. Dropped on publish. */
export const ARTICLES_TAG = 'marketing-articles';

/** Called after anything that changes what the public should see. */
export function forgetPublishedArticles() {
  revalidateTag(ARTICLES_TAG);
}

const cache = <A extends unknown[], R>(key: string, work: (...args: A) => Promise<R>) =>
  unstable_cache(work, [key], { tags: [ARTICLES_TAG], revalidate: 3600 });

/**
 * Every dressed photograph from every published piece, newest first.
 *
 * The gallery has always shown files dropped into a folder. These are the same
 * repairs the articles are about, already redacted, already captioned, and each
 * one leads back to the piece it came from — which is what turns a grid of
 * pictures into a service journal.
 */
export interface JournalPhoto {
  id: string;
  alt: string | null;
  rev: string | null;
  processedRev: string | null;
  treatment: Treatment | null;
  slug: string;
  title: string;
}

export const listJournalPhotos = cache(
  'marketing-journal-photos',
  async (limit: number = 24): Promise<JournalPhoto[]> => {
      const sql = db();
      if (!sql) return [];
      try {
        const rows = (await sql`
          select p.photo_id, p.alt_text, p.edited_rev, p.processed_rev, c.slug, c.title,
                 case when p.approved_at is not null then p.treatment else null end as treatment
          from marketing_photo p
          join marketing_content c on c.job_id = p.job_id
          where p.selected and c.status = 'published' and c.channel = 'article' and c.slug is not null
          order by c.approved_at desc nulls last, p.sort_order
          limit ${Number(limit)}
        `) as unknown as Array<Record<string, unknown>>;
        return rows.map((row) => ({
          id: String(row.photo_id),
          alt: (row.alt_text as string) ?? null,
          rev: (row.edited_rev as string) ?? null,
          processedRev: (row.processed_rev as string) ?? null,
          treatment: (row.treatment as Treatment) ?? null,
          slug: String(row.slug),
          title: String(row.title ?? ''),
        }));
      } catch {
        return [];
      }
  }
);


/**
 * The query itself, uncached. The sitemap uses this one: it renders per
 * request, so a cache in front of it would only add a second thing that has
 * to be invalidated correctly.
 */
export async function readPublishedArticles(): Promise<PublishedArticle[]> {
  const sql = db();
  if (!sql) return [];

  try {
    const rows = (await sql`
      select ${sql.unsafe(SELECT)},
        -- The lead photograph, so the list can show one. First in the chosen
        -- order, which is the same frame the article opens with.
        (
          select json_build_object('id', p.photo_id, 'alt', p.alt_text, 'rev', p.edited_rev,
                                   'category', p.category,
                                   'processedRev', p.processed_rev,
                                   'treatment',
                                   case when p.approved_at is not null then p.treatment else null end)
          from marketing_photo p
          where p.job_id = c.job_id and p.selected
          order by p.sort_order, p.photo_id
          limit 1
        ) as lead_photo
      from marketing_content c
      join marketing_job j on j.job_id = c.job_id
      where c.status = 'published' and c.channel = 'article' and c.slug is not null
      order by c.approved_at desc nulls last
    `) as unknown as Record<string, unknown>[];
    return rows.map((row) => {
      const lead = row.lead_photo as {
        id?: string; alt?: string | null; rev?: string | null;
        category?: string | null; processedRev?: string | null; treatment?: Treatment | null;
      } | null;
      return shape(
        row,
        lead?.id
          ? [{
              id: lead.id,
              alt: lead.alt ?? null,
              rev: lead.rev ?? null,
              category: lead.category ?? null,
              processedRev: lead.processedRev ?? null,
              treatment: lead.treatment ?? null,
            }]
          : []
      );
    });
  } catch {
    return [];
  }
}

/** Every published article, newest first. Cached, for the pages that are. */
export const listPublishedArticles = cache('list', readPublishedArticles);

export const getPublishedArticle = cache('article', async function getPublishedArticle(
  slug: string
): Promise<PublishedArticle | null> {
  const sql = db();
  if (!sql) return null;

  try {
    const [row] = (await sql`
      select ${sql.unsafe(SELECT)}, c.job_id
      from marketing_content c
      join marketing_job j on j.job_id = c.job_id
      where c.status = 'published' and c.channel = 'article' and c.slug = ${slug}
    `) as unknown as Record<string, unknown>[];
    if (!row) return null;

    const photos = (await sql`
      -- Treatment only counts once somebody has approved it: a suggestion the
      -- console has not shown anyone must never reach a reader (§29).
      select photo_id, alt_text, edited_rev, category, processed_rev,
             case when approved_at is not null then treatment else null end as treatment
      from marketing_photo
      where job_id = ${String(row.job_id)} and selected
      order by sort_order, photo_id
    `) as unknown as Array<{
      photo_id: string; alt_text: string | null; edited_rev: string | null;
      category: string | null; processed_rev: string | null; treatment: Treatment | null;
    }>;

    return shape(
      row,
      photos.map((photo) => ({
        id: photo.photo_id,
        alt: photo.alt_text,
        rev: photo.edited_rev,
        category: photo.category,
        processedRev: photo.processed_rev ?? null,
        treatment: photo.treatment ?? null,
      }))
    );
  } catch {
    return null;
  }
});

/**
 * The edited bytes for a photo, if somebody made some.
 *
 * Deliberately not cached with the article tags: the image route has its own
 * day-long cache keyed by a URL that already carries the revision, so caching
 * here would only add a second thing to get wrong.
 */
export async function editedPhoto(photoId: string): Promise<Buffer | null> {
  const sql = db();
  if (!sql) return null;
  try {
    // Corrected first, then edited, then nothing — the corrected copy is made
    // from the original and is what the house tone means, while an edit is a
    // crop or a mark somebody drew before any of this existed.
    const [row] = (await sql`
      select coalesce(p.processed_image, p.edited_image) as bytes
      from marketing_photo p
      join marketing_content c on c.job_id = p.job_id
      where p.photo_id = ${photoId} and p.selected
        and coalesce(p.processed_image, p.edited_image) is not null
        and c.status = 'published' and c.channel = 'article'
      limit 1
    `) as unknown as Array<{ bytes: Buffer | null }>;
    return row?.bytes ?? null;
  } catch {
    return null;
  }
}

/**
 * Whether one photo may be shown to the public: it was chosen for a piece, and
 * that piece is published. Both halves matter — a selected photo on an
 * unpublished draft is still private.
 */
export const photoIsPublic = cache('photo', async function photoIsPublic(
  photoId: string
): Promise<boolean> {
  const sql = db();
  if (!sql) return false;

  try {
    const [row] = (await sql`
      select 1 as ok
      from marketing_photo p
      join marketing_content c on c.job_id = p.job_id
      where p.photo_id = ${photoId} and p.selected and c.status = 'published'
      limit 1
    `) as unknown as { ok: number }[];
    return Boolean(row);
  } catch {
    return false;
  }
});

/**
 * Where to fetch a photograph, with its revision in the address.
 *
 * The image route caches for a day and says `immutable`, which is true only
 * because an edit changes this URL. Every place that renders a repair photo
 * goes through here so none of them can forget.
 */
export function photoUrl(photo: { id: string; rev?: string | null; processedRev?: string | null }): string {
  // Whichever copy is newest gives the address its version. Without this the
  // immutable cache would keep serving the picture as it was before it was
  // corrected.
  const rev = photo.processedRev ?? photo.rev;
  return rev ? `/api/repair-photo/${photo.id}?v=${rev}` : `/api/repair-photo/${photo.id}`;
}
