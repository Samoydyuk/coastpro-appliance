import { NextRequest, NextResponse } from 'next/server';
import { generate, GenerationError } from '@/lib/marketing/generate';
import { SanitizerRefusal } from '@/lib/marketing/sanitize';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// A model call, not a query. The platform default would cut it off mid-sentence.
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    jobId?: string;
    channel?: string;
  } | null;

  if (!body?.jobId || !body.channel) {
    return NextResponse.json({ error: 'Missing job or channel.' }, { status: 400 });
  }

  try {
    const draft = await generate(body.jobId, body.channel);
    return NextResponse.json({ ok: true, draft });
  } catch (error) {
    // The refusal is not a failure and is reported as its own thing: it means
    // the data carried something it should not, and it says what, so the rule
    // that missed it can be fixed at the source.
    if (error instanceof SanitizerRefusal) {
      return NextResponse.json({ error: error.message, refused: true }, { status: 422 });
    }
    if (error instanceof GenerationError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    console.error('Generation failed:', error);
    return NextResponse.json({ error: 'Could not write anything.' }, { status: 500 });
  }
}
