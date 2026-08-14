import { unstable_cache, revalidateTag } from 'next/cache';
import { db } from '@/lib/db';

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

  photos: Array<{ id: string; alt: string | null }>;
}

const SELECT = `
  c.slug, c.title, c.meta_title, c.meta_desc,
  coalesce(c.edited_body, c.generated_body) as body,
  c.approved_at, c.updated_at,
  j.appliance_type, j.manufacturer, j.model, j.error_codes, j.city, j.state
`;

/** A timestamp from the driver, or from the cache, as one thing. */
function iso(value: unknown): string | null {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return null;
}

function shape(row: Record<string, unknown>, photos: Array<{ id: string; alt: string | null }>): PublishedArticle {
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
 * The query itself, uncached. The sitemap uses this one: it renders per
 * request, so a cache in front of it would only add a second thing that has
 * to be invalidated correctly.
 */
export async function readPublishedArticles(): Promise<PublishedArticle[]> {
  const sql = db();
  if (!sql) return [];

  try {
    const rows = (await sql`
      select ${sql.unsafe(SELECT)}
      from marketing_content c
      join marketing_job j on j.job_id = c.job_id
      where c.status = 'published' and c.channel = 'article' and c.slug is not null
      order by c.approved_at desc nulls last
    `) as unknown as Record<string, unknown>[];
    return rows.map((row) => shape(row, []));
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
      select photo_id, alt_text from marketing_photo
      where job_id = ${String(row.job_id)} and selected
      order by sort_order, photo_id
    `) as unknown as Array<{ photo_id: string; alt_text: string | null }>;

    return shape(
      row,
      photos.map((photo) => ({ id: photo.photo_id, alt: photo.alt_text }))
    );
  } catch {
    return null;
  }
});

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
