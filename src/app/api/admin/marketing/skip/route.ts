import { NextRequest, NextResponse } from 'next/server';
import { skipJob } from '@/lib/marketing/queries';
import { requireAdmin } from '@/lib/admin-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Marking a job as one nothing will be written from.
 *
 * Without it the list is a pile that only grows: every finished job the owner
 * released sits there looking like unfinished work, including the ones with
 * three words in the diagnosis that will never make an article. Saying so once
 * is what keeps "nothing written" a useful filter.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;


  const body = (await request.json().catch(() => null)) as {
    jobId?: string;
    channel?: string;
  } | null;

  if (!body?.jobId || !body.channel) {
    return NextResponse.json({ error: 'Missing job or channel.' }, { status: 400 });
  }

  try {
    await skipJob(body.jobId, body.channel);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Skip failed:', error);
    return NextResponse.json({ error: 'Could not save.' }, { status: 500 });
  }
}
