import { NextRequest, NextResponse } from 'next/server';
import { requireDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The human's version of a draft.
 *
 * Written to `edited_body`, never over `generated_body`. Keeping both is what
 * makes a regeneration safe to offer — the model's new attempt lands beside
 * your edit rather than on top of it — and it is the only way to answer "did a
 * person actually go through this" six months later.
 */
export async function PATCH(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    jobId?: string;
    channel?: string;
    body?: string;
    title?: string | null;
    metaTitle?: string | null;
    metaDesc?: string | null;
  } | null;

  if (!body?.jobId || !body.channel) {
    return NextResponse.json({ error: 'Missing job or channel.' }, { status: 400 });
  }

  try {
    const sql = requireDb();
    const [row] = (await sql`
      update marketing_content set
        edited_body = ${body.body ?? null},
        title       = coalesce(${body.title ?? null}, title),
        meta_title  = coalesce(${body.metaTitle ?? null}, meta_title),
        meta_desc   = coalesce(${body.metaDesc ?? null}, meta_desc),
        status      = case when ${body.body ?? null}::text is null then status else 'edited' end,
        updated_at  = now()
      where job_id = ${body.jobId} and channel = ${body.channel}
      returning id
    `) as unknown as { id: string }[];

    if (!row) return NextResponse.json({ error: 'Nothing written for that channel yet.' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Content save failed:', error);
    return NextResponse.json({ error: 'Could not save.' }, { status: 500 });
  }
}
