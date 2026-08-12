import { NextRequest, NextResponse } from 'next/server';
import { markLeadBooked } from '@/lib/leads';
import { db, quietly } from '@/lib/db';
import { VISITOR_COOKIE, SESSION_COOKIE } from '@/lib/tracking';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Fired by the browser the moment Calendly confirms a time. Marks the matching
 * lead as booked and leaves an event on the session, so the funnel can show how
 * many people who reached the scheduler actually finished.
 *
 * Not authoritative — a visitor could call this by hand — but it only ever
 * promotes a lead that already exists to "booked", which is not worth faking.
 * The webhook at /api/calendly/webhook is the signed version of the same thing.
 */
export async function POST(request: NextRequest) {
  try {
    const { email, name } = (await request.json()) ?? {};
    await markLeadBooked({ email, phone: null });

    const sql = db();
    const visitorId = request.cookies.get(VISITOR_COOKIE)?.value;
    const sessionId = request.cookies.get(SESSION_COOKIE)?.value;
    if (sql && visitorId && sessionId) {
      await quietly(
        () => sql`
          insert into events (session_id, visitor_id, type, label, meta)
          values (${sessionId}, ${visitorId}, 'calendly_booked', ${name ?? null}, ${sql.json({ email: email ?? null })})
        `
      );
      await quietly(() => sql`update sessions set converted = true where id = ${sessionId}`);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
