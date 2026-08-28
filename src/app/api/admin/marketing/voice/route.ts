import { NextRequest, NextResponse } from 'next/server';
import { saveVoice, DEFAULT_VOICE, type BrandVoice } from '@/lib/marketing/voice';
import { requireAdmin } from '@/lib/admin-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** The house voice, and the short list of business facts a draft may state. */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;


  const body = (await request.json().catch(() => null)) as Partial<BrandVoice> | null;
  if (!body) return NextResponse.json({ error: 'Nothing to save.' }, { status: 400 });

  const lines = (value: unknown, fallback: string[]) =>
    Array.isArray(value)
      ? value.map((entry) => String(entry).trim()).filter(Boolean)
      : typeof value === 'string'
        ? value
            .split('\n')
            .map((entry) => entry.replace(/^[-•]\s*/, '').trim())
            .filter(Boolean)
        : fallback;

  try {
    await saveVoice({
      businessName: body.businessName?.trim() || DEFAULT_VOICE.businessName,
      serviceArea: body.serviceArea?.trim() || DEFAULT_VOICE.serviceArea,
      tone: body.tone?.trim() || DEFAULT_VOICE.tone,
      forbidden: lines(body.forbidden, DEFAULT_VOICE.forbidden),
      facts: lines(body.facts, DEFAULT_VOICE.facts),
      callToAction: body.callToAction?.trim() || DEFAULT_VOICE.callToAction,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Voice save failed:', error);
    return NextResponse.json({ error: 'Could not save.' }, { status: 500 });
  }
}
