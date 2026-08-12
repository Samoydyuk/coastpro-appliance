import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { siteConfig } from '@/data/site-config';
import { formatPhoneNumber } from '@/lib/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Which number a given channel should show. Answers with the real business
 * number whenever there is no tracking number to give, so the page always has
 * something dialable.
 *
 * Held in memory for a minute: the pool changes about once a month, and this is
 * called on every page load.
 */

let cache: { at: number; rows: { number_e164: string; display_number: string; channel: string }[] } | null = null;
const CACHE_MS = 60_000;

async function pool() {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.rows;
  const sql = db();
  if (!sql) return [];
  const rows = (await sql`
    select number_e164, display_number, channel
    from tracking_numbers
    where active = true
  `) as unknown as { number_e164: string; display_number: string; channel: string }[];
  cache = { at: Date.now(), rows };
  return rows;
}

export async function GET(request: NextRequest) {
  const channel = request.nextUrl.searchParams.get('channel') ?? 'direct';

  const fallback = NextResponse.json({
    number: `+1${siteConfig.contact.phoneClean}`,
    display: siteConfig.contact.phone,
    channel: 'default',
  });
  fallback.headers.set('Cache-Control', 'private, max-age=60');

  try {
    const numbers = await pool();
    const match =
      numbers.find((row) => row.channel === channel) ??
      numbers.find((row) => row.channel === 'default');
    if (!match) return fallback;

    const response = NextResponse.json({
      number: match.number_e164,
      display: match.display_number || formatPhoneNumber(match.number_e164),
      channel: match.channel,
    });
    response.headers.set('Cache-Control', 'private, max-age=60');
    return response;
  } catch {
    return fallback;
  }
}
