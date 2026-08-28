import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { describePhotos, GenerationError } from '@/lib/marketing/generate';
import { requireDb } from '@/lib/db';
import { forgetPublishedArticles } from '@/lib/marketing/published';
import { requireAdmin } from '@/lib/admin-guard';

/**
 * Describe the photographs again, from the photographs.
 *
 * Separate from generating the piece on purpose: the body has usually been read
 * and approved by then, and the thing that is wrong is only the alt text. Every
 * article written before the model was shown its own pictures has descriptions
 * that were invented from the story rather than seen in the frame.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;


  const body = (await request.json().catch(() => null)) as { jobId?: string } | null;
  if (!body?.jobId) {
    return NextResponse.json({ error: 'Missing job.' }, { status: 400 });
  }

  try {
    const { described } = await describePhotos(body.jobId);

    // If the piece is already out, its pages carry the old wording.
    const sql = requireDb();
    const [live] = (await sql`
      select slug from marketing_content
      where job_id = ${body.jobId} and status = 'published' and slug is not null
    `) as unknown as { slug: string }[];
    if (live) {
      forgetPublishedArticles();
      revalidatePath('/blog');
      revalidatePath(`/blog/${live.slug}`);
    }

    return NextResponse.json({ ok: true, described });
  } catch (error) {
    if (error instanceof GenerationError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    console.error('[describe-photos]', error);
    return NextResponse.json({ error: 'Could not describe the photographs.' }, { status: 500 });
  }
}
