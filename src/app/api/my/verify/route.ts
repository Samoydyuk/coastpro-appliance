import { NextRequest, NextResponse } from 'next/server';
import { verifyCode } from '@/lib/customer/client';
import { signCustomerToken, toE164 } from '@/lib/customer-session';
import { CUSTOMER_COOKIE, CUSTOMER_MAX_AGE } from '@/lib/cookies';
import { clientIp, hashIp } from '@/lib/tracking';
import { db, quietly } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Twilio allows five tries per code; this is the ceiling on trying new ones. */
const MAX_ATTEMPTS = 10;
const WINDOW_MINUTES = 15;

async function recentFailures(ipHash: string | null): Promise<number> {
  const sql = db();
  if (!sql || !ipHash) return 0;
  const rows = await quietly(async () => {
    return (await sql`
      select count(*)::int as n
      from admin_audit
      where action = 'portal_code_failed'
        and ip_hash = ${ipHash}
        and ts > now() - interval '${sql.unsafe(String(WINDOW_MINUTES))} minutes'
    `) as unknown as { n: number }[];
  });
  return rows?.[0]?.n ?? 0;
}

/**
 * Check the code, and on success sign the number into a cookie of our own.
 *
 * JobPocket returns a portal token here and `verifyCode` throws it away — see
 * the note in lib/customer/client.ts. What we keep is the single fact the code
 * established: this browser proved this number. Everything the customer area
 * shows is fetched server-side using that fact plus the operations key, so the
 * cookie on its own opens nothing.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const phone = toE164(body?.phone);
  const code = typeof body?.code === 'string' ? body.code.trim() : '';

  if (!phone || !/^\d{4,10}$/.test(code)) {
    return NextResponse.json({ error: 'Enter the code we sent you.' }, { status: 400 });
  }

  const ipHash = hashIp(clientIp(request.headers) ?? 'unknown');
  if ((await recentFailures(ipHash)) >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again in a few minutes, or call us.' },
      { status: 429 }
    );
  }

  const ok = await verifyCode(phone, code);
  const sql = db();

  if (!ok) {
    if (sql) {
      await quietly(async () => {
        await sql`
          insert into admin_audit (action, entity, ip_hash)
          values ('portal_code_failed', 'customer', ${ipHash})
        `;
      });
    }
    // One message for a wrong code and for an expired one: which of the two it
    // was is information about somebody else's session.
    return NextResponse.json({ error: 'That code is not right. Try again.' }, { status: 401 });
  }

  const token = await signCustomerToken({
    phone,
    exp: Math.floor(Date.now() / 1000) + CUSTOMER_MAX_AGE,
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: CUSTOMER_MAX_AGE,
  });
  return response;
}
