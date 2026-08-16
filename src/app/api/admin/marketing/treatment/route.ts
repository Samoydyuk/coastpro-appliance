import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireDb } from '@/lib/db';
import { analysePhotos, TreatmentError, type Treatment } from '@/lib/marketing/treatment';
import { forgetPublishedArticles } from '@/lib/marketing/published';

/**
 * The Field Journal treatment for a job's photographs.
 *
 * POST asks the model to look at them and propose one. PATCH saves what the
 * person made of that proposal, and is the only way anything gets approved —
 * a suggestion is never published on its own (§29).
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/** Rebuild the live page, if this job has one. */
async function republish(jobId: string): Promise<void> {
  const sql = requireDb();
  const [live] = (await sql`
    select slug from marketing_content
    where job_id = ${jobId} and status = 'published' and slug is not null
  `) as unknown as { slug: string }[];
  if (!live) return;
  forgetPublishedArticles();
  revalidatePath('/blog');
  revalidatePath(`/blog/${live.slug}`);
  revalidatePath('/gallery');
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { jobId?: string } | null;
  if (!body?.jobId) return NextResponse.json({ error: 'Missing job.' }, { status: 400 });

  try {
    const { analysed } = await analysePhotos(body.jobId);
    return NextResponse.json({ ok: true, analysed });
  } catch (error) {
    if (error instanceof TreatmentError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    console.error('[treatment]', error);
    return NextResponse.json({ error: 'Could not read the photographs.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    jobId?: string;
    photos?: Array<{ photoId: string; treatment: Treatment | null; approved?: boolean }>;
  } | null;

  if (!body?.jobId || !Array.isArray(body.photos)) {
    return NextResponse.json({ error: 'Nothing to save.' }, { status: 400 });
  }

  try {
    const sql = requireDb();
    const rev = Date.now().toString(36);

    for (const entry of body.photos) {
      // A treatment set back to null is "use the original" — the photograph
      // goes out with nothing on it, which the specification asks to remain
      // possible for every picture (§28).
      await sql`
        update marketing_photo set
          treatment     = ${entry.treatment ? sql.json(entry.treatment as never) : null},
          treatment_rev = ${entry.treatment ? rev : null},
          approved_at   = ${entry.approved ? new Date() : null},
          approved_by   = ${entry.approved ? 'admin' : null}
        where job_id = ${body.jobId} and photo_id = ${entry.photoId}
      `;
    }

    await republish(body.jobId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[treatment:save]', error);
    return NextResponse.json({ error: 'Could not save the treatment.' }, { status: 500 });
  }
}
