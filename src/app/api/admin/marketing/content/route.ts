import { NextRequest, NextResponse } from 'next/server';
import { requireDb } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';

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
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;


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

  // An empty box means "use what the model wrote", not "publish nothing".
  // The published page reads coalesce(edited_body, generated_body), and an
  // empty string is not null — so a cleared edit was quietly blanking the
  // article while the original sat intact beside it.
  const edited = typeof body.body === 'string' && body.body.trim() ? body.body : null;

  try {
    const sql = requireDb();
    const [row] = (await sql`
      update marketing_content set
        edited_body = ${edited},
        title       = coalesce(${body.title ?? null}, title),
        meta_title  = coalesce(${body.metaTitle ?? null}, meta_title),
        meta_desc   = coalesce(${body.metaDesc ?? null}, meta_desc),
        status      = case when ${edited}::text is null then status else 'edited' end,
        updated_at  = now()
      where job_id = ${body.jobId} and channel = ${body.channel}
      returning id
    `) as unknown as { id: string }[];

    if (!row) return NextResponse.json({ error: 'Nothing written for that channel yet.' }, { status: 404 });

    // Recorded alongside the model's attempts, and marked as a person's, so
    // the history answers "who wrote this" and not only "what did it say".
    if (body.body?.trim()) {
      await sql`
        insert into marketing_content_version (content_id, source, title, body)
        values (${row.id}, 'human', ${body.title ?? null}, ${body.body})
      `;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Content save failed:', error);
    return NextResponse.json({ error: 'Could not save.' }, { status: 500 });
  }
}
