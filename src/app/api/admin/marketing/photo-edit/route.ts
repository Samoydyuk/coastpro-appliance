import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { revalidatePath } from 'next/cache';
import { requireDb } from '@/lib/db';
import { forgetPublishedArticles } from '@/lib/marketing/published';
import { requireAdmin } from '@/lib/admin-guard';

/**
 * The edited copy of a photograph: cropped, and with whatever was drawn on it.
 *
 * The bytes arrive already finished — the browser did the crop, the marks and
 * the downscale on a canvas — so nothing here rasterises anything. That is what
 * lets this project keep its nine dependencies.
 *
 * Stored in the database rather than a bucket on purpose. The rule that keeps
 * the untouched original safe is that no storage URL ever reaches a visitor;
 * putting the edit in a public bucket would be the first crack in it. A canvas
 * re-encode also carries no metadata at all, so this copy is the safer one.
 *
 * The path has no file extension, deliberately: the middleware matcher skips
 * anything ending in one, and a route under /api/admin that the middleware
 * skips is a route with no sign-in on it.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** A megabyte of base64 is roughly 700 KB of JPEG — far past what a 1600px
 *  export should weigh, so anything bigger is a mistake worth refusing. */
const MAX_IMAGE_CHARS = 3_000_000;

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;


  const body = (await request.json().catch(() => null)) as {
    jobId?: string;
    photoId?: string;
    recipe?: unknown;
    image?: string;
    reset?: boolean;
  } | null;

  if (!body?.jobId || !body.photoId) {
    return NextResponse.json({ error: 'Missing job or photo.' }, { status: 400 });
  }

  const sql = requireDb();

  try {
    if (body.reset) {
      await sql`
        update marketing_photo
        set edit_recipe = null, edited_image = null, edited_rev = null, edited_at = null
        where photo_id = ${body.photoId} and job_id = ${body.jobId}
      `;
    } else {
      const dataUrl = body.image ?? '';
      const base64 = dataUrl.startsWith('data:image/') ? dataUrl.slice(dataUrl.indexOf(',') + 1) : '';
      if (!base64) {
        return NextResponse.json({ error: 'No image was sent.' }, { status: 400 });
      }
      if (base64.length > MAX_IMAGE_CHARS) {
        return NextResponse.json({ error: 'That image is too large.' }, { status: 413 });
      }

      const bytes = Buffer.from(base64, 'base64');
      // The revision is what changes the public URL. Without it the day-long
      // immutable cache would keep serving the picture somebody just cropped.
      const rev = createHash('sha256').update(bytes).digest('hex').slice(0, 10);

      await sql`
        update marketing_photo set
          edit_recipe  = ${JSON.stringify(body.recipe ?? {})}::jsonb,
          edited_image = ${bytes},
          edited_rev   = ${rev},
          edited_at    = now()
        where photo_id = ${body.photoId} and job_id = ${body.jobId}
      `;
    }

    // If the article is already out, the page has to be rebuilt — the image URL
    // changed, and the old one is baked into the rendered HTML.
    const [live] = (await sql`
      select slug from marketing_content
      where job_id = ${body.jobId} and status = 'published' and slug is not null
    `) as unknown as { slug: string }[];
    if (live) {
      forgetPublishedArticles();
      revalidatePath('/blog');
      revalidatePath(`/blog/${live.slug}`);
    }

    await sql`
      insert into admin_audit (action, entity, entity_id, detail)
      values (
        ${body.reset ? 'photo.edit.reset' : 'photo.edit'},
        'marketing_photo',
        ${body.photoId},
        ${JSON.stringify({ jobId: body.jobId })}::jsonb
      )
    `.catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[photo-edit]', error);
    return NextResponse.json({ error: 'Could not save the edit.' }, { status: 500 });
  }
}
