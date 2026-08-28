import { NextResponse } from 'next/server';
import { getLive } from '@/lib/admin/queries';
import { requireAdmin } from '@/lib/admin-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;


  try {
    const data = await getLive();
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
