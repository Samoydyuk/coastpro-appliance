import { NextRequest, NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'crypto';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Won jobs, as a file Google Ads collects for itself.
 *
 * The alternative is the Google Ads API, which needs a developer token, a Cloud
 * project, an OAuth consent screen and an approval queue — and then a version
 * bump every year when Google retires the one you built against. A scheduled
 * file import needs none of that: Google fetches this URL on a timer and reads
 * it. The trade is that Google calls the file route "legacy", so this may need
 * replacing one day; the API client already exists for that day.
 *
 * Set it up once at Goals → Conversions → Uploads → Schedules, source HTTPS.
 *
 * Nothing here is marked as sent. Google deduplicates on conversion name, time
 * and click id, and every value this emits is stable — `won_at` does not move
 * once written — so serving the same rows again tomorrow is a no-op on their
 * side. That is deliberately simpler than tracking what was collected: a file
 * that can be fetched twice safely cannot get out of step with what was
 * actually imported.
 */

/** Must match the conversion action's name in Google Ads, character for character. */
const CONVERSION_NAME = process.env.GOOGLE_ADS_CONVERSION_NAME || 'Won job';

/** Google's own import window. Older conversions are rejected, so do not send them. */
const WINDOW_DAYS = 90;

function authorised(request: NextRequest): boolean {
  const expected = process.env.CONVERSION_FEED_SECRET;
  if (!expected) return false;
  const provided = request.nextUrl.searchParams.get('token') ?? '';
  const a = createHash('sha256').update(provided).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

/**
 * `yyyy-MM-dd HH:mm:ss` in UTC, paired with a `Parameters:TimeZone=+0000` line.
 *
 * Google's documentation calls a missing or mismatched time zone the most
 * common reason an upload fails, so this states the offset once, unambiguously,
 * rather than emitting local times and hoping the header agrees with them.
 */
function formatUtc(value: Date): string {
  return value.toISOString().slice(0, 19).replace('T', ' ');
}

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export async function GET(request: NextRequest) {
  if (!authorised(request)) {
    return new NextResponse('Not authorised\n', { status: 401 });
  }

  const sql = db();
  if (!sql) return new NextResponse('Database not configured\n', { status: 503 });

  try {
    const rows = (await sql`
      select id, gclid, won_at, created_at, value_cents
      from leads
      where status = 'won'
        and gclid is not null
        and value_cents is not null
        and coalesce(won_at, created_at) > now() - interval '${sql.unsafe(String(WINDOW_DAYS))} days'
      order by coalesce(won_at, created_at) asc
      limit 5000
    `) as unknown as {
      id: string;
      gclid: string;
      won_at: Date | null;
      created_at: Date;
      value_cents: number;
    }[];

    const lines = [
      'Parameters:TimeZone=+0000',
      'Google Click ID,Conversion Name,Conversion Time,Conversion Value,Conversion Currency,Order ID',
      ...rows.map((row) =>
        [
          csvCell(row.gclid),
          csvCell(CONVERSION_NAME),
          csvCell(formatUtc(new Date(row.won_at ?? row.created_at))),
          (row.value_cents / 100).toFixed(2),
          'USD',
          // Ours, so a conversion can be traced back to the lead that produced
          // it — and a second identifier for Google to deduplicate on.
          csvCell(row.id),
        ].join(',')
      ),
    ];

    return new NextResponse(`${lines.join('\n')}\n`, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="google-ads-conversions.csv"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Conversion feed failed:', error);
    return new NextResponse('Could not build the feed\n', { status: 500 });
  }
}
