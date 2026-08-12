import { NextResponse } from 'next/server';
import { getLive } from '@/lib/admin/queries';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getLive();
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
