import { NextRequest, NextResponse } from 'next/server';
import { requestCode } from '@/lib/customer/client';
import { toE164 } from '@/lib/customer-session';
import { clientIp, hashIp } from '@/lib/tracking';
import { db, quietly } from '@/lib/db';

// Reads cookies, writes to Postgres and holds a secret — none of it Edge work.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Send somebody the code that proves the number is theirs.
 *
 * JobPocket rate-limits its own endpoint by IP and by number, which protects
 * JobPocket. It does not protect this site from becoming the thing that carries
 * the abuse there, so the same counter the admin login uses runs here first:
 * attempts land in `admin_audit` keyed on a hashed IP, and past a handful in a
 * quarter of an hour this stops asking.
 *
 * The answer is always the same shape. A number we know and a number we have
 * never seen both come back "sent", because a form that says "no such customer"
 * is a form for finding out who somebody's plumber is.
 */
const MAX_ATTEMPTS = 6;
const WINDOW_MINUTES = 15;

async function recentAttempts(ipHash: string | null): Promise<number> {
  const sql = db();
  if (!sql || !ipHash) return 0;
  const rows = await quietly(async () => {
    return (await sql`
      select count(*)::int as n
      from admin_audit
      where action = 'portal_code_requested'
        and ip_hash = ${ipHash}
        and ts > now() - interval '${sql.unsafe(String(WINDOW_MINUTES))} minutes'
    `) as unknown as { n: number }[];
  });
  // Fails open, like the admin counter: a database outage must not lock every
  // customer out of their own warranty.
  return rows?.[0]?.n ?? 0;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const phone = toE164(body?.phone);
  if (!phone) {
    return NextResponse.json({ error: 'Please enter a valid phone number.' }, { status: 400 });
  }

  const ipHash = hashIp(clientIp(request.headers) ?? 'unknown');

  if ((await recentAttempts(ipHash)) >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: 'Too many codes requested. Try again in a few minutes, or call us.' },
      { status: 429 }
    );
  }

  const sql = db();
  if (sql) {
    // The number is not stored, only the fact that somebody asked. This table
    // is an abuse counter, not a log of who is looking up their repairs.
    await quietly(async () => {
      await sql`
        insert into admin_audit (action, entity, ip_hash)
        values ('portal_code_requested', 'customer', ${ipHash})
      `;
    });
  }

  await requestCode(phone);

  // Deliberately unconditional. See above.
  return NextResponse.json({ sent: true });
}
