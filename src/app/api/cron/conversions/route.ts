import { NextRequest, NextResponse } from 'next/server';
import { flushConversionQueue } from '@/lib/conversions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Retries anything the ad platforms would not accept first time.
 *
 * Won jobs are pushed the moment they are marked in the console, so this is
 * only a safety net — for the case where Google was briefly unreachable, or
 * credentials were added after the fact.
 *
 * Scheduled once a day, because Vercel's Hobby plan triggers cron jobs daily
 * whatever expression is written. Daily is fine for a safety net; it would not
 * be fine if this were the primary path, which is why it is not.
 *
 * It can also be run by hand at any time:
 *   curl "https://coastpro.us/api/cron/conversions?token=$CRON_SECRET"
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorised =
    // Vercel signs its own scheduled invocations with this header.
    request.headers.get('authorization') === `Bearer ${secret}` ||
    (secret && request.nextUrl.searchParams.get('token') === secret);

  if (secret && !authorised) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 401 });
  }

  try {
    const result = await flushConversionQueue(50);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error('Conversion cron failed:', error);
    return NextResponse.json({ error: 'Flush failed' }, { status: 500 });
  }
}
