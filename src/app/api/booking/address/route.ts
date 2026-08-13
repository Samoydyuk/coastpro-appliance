import { NextRequest, NextResponse } from 'next/server';
import { getAddressSuggestions } from '@/lib/jobpocket';

/** Address suggestions, proxied through JobPocket so no Google key lives here. */
export async function GET(request: NextRequest) {
  const input = request.nextUrl.searchParams.get('q') || '';
  const suggestions = await getAddressSuggestions(input);
  return NextResponse.json({ suggestions }, { headers: { 'Cache-Control': 'no-store' } });
}
