import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireDb } from '@/lib/db';
import { setPhotoSelection } from '@/lib/marketing/queries';
import { forgetPublishedArticles } from '@/lib/marketing/published';
import { requireAdmin } from '@/lib/admin-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Which pictures go out with a piece, and in what order. */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;


  const body = (await request.json().catch(() => null)) as {
    jobId?: string;
    selection?: Array<{ photoId: string; selected: boolean; sortOrder: number; altText?: string | null }>;
  } | null;

  if (!body?.jobId || !Array.isArray(body.selection)) {
    return NextResponse.json({ error: 'Nothing to save.' }, { status: 400 });
  }

  try {
    await setPhotoSelection(body.jobId, body.selection);

    // If this job's article is already live, the change is visible work, not a
    // draft edit — so the published page is rebuilt rather than left showing
    // yesterday's pictures.
    const sql = requireDb();
    const [live] = (await sql`
      select slug from marketing_content
      where job_id = ${body.jobId} and status = 'published' and slug is not null
    `) as unknown as { slug: string }[];
    if (live) {
      forgetPublishedArticles();
      revalidatePath(`/blog/${live.slug}`);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Photo selection failed:', error);
    return NextResponse.json({ error: 'Could not save the selection.' }, { status: 500 });
  }
}
