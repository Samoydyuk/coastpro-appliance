import { NextResponse } from 'next/server';
import { refreshMarketingJobs } from '@/lib/marketing/queries';
import { MarketingApiError } from '@/lib/marketing/client';
import { requireAdmin } from '@/lib/admin-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Pull the released jobs from JobPocket into the console's own copy. */
export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;


  try {
    const { jobs, photos } = await refreshMarketingJobs();
    return NextResponse.json({ ok: true, jobs, photos });
  } catch (error) {
    // A key problem is the likely one and has a fix the owner can act on, so
    // it is passed through verbatim rather than flattened to "failed".
    if (error instanceof MarketingApiError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    console.error('Marketing refresh failed:', error);
    return NextResponse.json({ error: 'Could not read from JobPocket.' }, { status: 500 });
  }
}
