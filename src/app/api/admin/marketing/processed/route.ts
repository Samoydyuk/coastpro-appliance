import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { revalidatePath } from 'next/cache';
import { requireDb } from '@/lib/db';
import { forgetPublishedArticles } from '@/lib/marketing/published';

/**
 * The corrected copy of a photograph.
 *
 * Exposure, white balance and tone, applied on a canvas in the browser and
 * stored here — the same arrangement as the edited copy next door, and for the
 * same two reasons: the project has no server-side raster library, and a canvas
 * re-encode carries no metadata at all. The original in storage is never
 * written to and never reachable from a browser.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** A megabyte of base64 is roughly 700 KB of JPEG — past what a 2000px export
 *  should weigh, so anything bigger is a mistake worth refusing. */
const MAX_IMAGE_CHARS = 4_000_000;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    jobId?: string;
    photoId?: string;
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
        update marketing_photo set processed_image = null, processed_rev = null
        where photo_id = ${body.photoId} and job_id = ${body.jobId}
      `;
    } else {
      const dataUrl = body.image ?? '';
      const base64 = dataUrl.startsWith('data:image/') ? dataUrl.slice(dataUrl.indexOf(',') + 1) : '';
      if (!base64) return NextResponse.json({ error: 'No image was sent.' }, { status: 400 });
      if (base64.length > MAX_IMAGE_CHARS) {
        return NextResponse.json({ error: 'That image is too large.' }, { status: 413 });
      }

      const bytes = Buffer.from(base64, 'base64');
      const rev = createHash('sha256').update(bytes).digest('hex').slice(0, 10);

      await sql`
        update marketing_photo set processed_image = ${bytes}, processed_rev = ${rev}
        where photo_id = ${body.photoId} and job_id = ${body.jobId}
      `;
    }

    const [live] = (await sql`
      select slug from marketing_content
      where job_id = ${body.jobId} and status = 'published' and slug is not null
    `) as unknown as { slug: string }[];
    if (live) {
      forgetPublishedArticles();
      revalidatePath('/blog');
      revalidatePath(`/blog/${live.slug}`);
      revalidatePath('/gallery');
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[processed]', error);
    return NextResponse.json({ error: 'Could not save the corrected copy.' }, { status: 500 });
  }
}
