import { NextRequest, NextResponse } from 'next/server';
import { getWindows } from '@/lib/jobpocket';

/** Arrival windows for one day. Availability is never cached. */
export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get('date');
  const serviceId = request.nextUrl.searchParams.get('serviceId') || undefined;

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'A date of the form YYYY-MM-DD is required' }, { status: 400 });
  }

  const windows = await getWindows(date, serviceId);
  return NextResponse.json({ windows }, { headers: { 'Cache-Control': 'no-store' } });
}
