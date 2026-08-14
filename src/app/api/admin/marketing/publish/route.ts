import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireDb } from '@/lib/db';
import { forgetPublishedArticles } from '@/lib/marketing/published';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Putting an article on the website, and taking it back off.
 *
 * Only the article channel goes anywhere from here — the social drafts are
 * copied out by hand, because posting to Instagram on somebody's behalf is a
 * different kind of act from adding a page to their own site.
 *
 * Unpublishing does not delete the publication row. The question later is
 * always "what was live in March", and a deleted row cannot answer it.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    jobId?: string;
    channel?: string;
    action?: 'publish' | 'unpublish';
  } | null;

  if (!body?.jobId || !body.channel) {
    return NextResponse.json({ error: 'Missing job or channel.' }, { status: 400 });
  }
  if (body.channel !== 'article') {
    return NextResponse.json(
      { error: 'Only the article goes on the website. The rest are for copying out by hand.' },
      { status: 400 }
    );
  }

  try {
    const sql = requireDb();

    const [piece] = (await sql`
      select id, slug, coalesce(edited_body, generated_body) as body
      from marketing_content
      where job_id = ${body.jobId} and channel = ${body.channel}
    `) as unknown as { id: string; slug: string | null; body: string | null }[];

    if (!piece) return NextResponse.json({ error: 'Nothing written yet.' }, { status: 404 });

    if (body.action === 'unpublish') {
      // Back to whatever it was before it went up — 'edited' only if somebody
      // actually edited it. Taking a page down does not make it a page that
      // was worked on.
      await sql`
        update marketing_content set
          status = case when edited_body is null then 'generated' else 'edited' end,
          updated_at = now()
        where id = ${piece.id}
      `;
      await sql`
        update marketing_publication set unpublished_at = now()
        where content_id = ${piece.id} and unpublished_at is null
      `;
    } else {
      if (!piece.slug || !piece.body?.trim()) {
        return NextResponse.json(
          { error: 'It needs a slug and a body before it can go up.' },
          { status: 400 }
        );
      }
      await sql`
        update marketing_content set
          status = 'published', approved_at = coalesce(approved_at, now()), updated_at = now()
        where id = ${piece.id}
      `;
      // One open publication at a time: re-publishing after an unpublish opens
      // a new row rather than reviving the old one, so the history reads as a
      // sequence of periods it was live.
      const [open] = (await sql`
        select id from marketing_publication
        where content_id = ${piece.id} and unpublished_at is null
      `) as unknown as { id: string }[];
      if (!open) {
        await sql`
          insert into marketing_publication (content_id, destination, url)
          values (${piece.id}, 'website', ${'/blog/' + piece.slug})
        `;
      }
    }

    // The public pages are cached; without this the article is live in the
    // database and absent from the site until something else happens to
    // rebuild them. The tag is what actually does it — the paths are belt and
    // braces for the index, which is the one route revalidatePath does reach.
    forgetPublishedArticles();
    revalidatePath('/blog');
    if (piece.slug) revalidatePath(`/blog/${piece.slug}`);

    return NextResponse.json({ ok: true, url: piece.slug ? `/blog/${piece.slug}` : null });
  } catch (error) {
    console.error('Publish failed:', error);
    return NextResponse.json({ error: 'Could not change the publication.' }, { status: 500 });
  }
}
