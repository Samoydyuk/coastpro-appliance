import { NextResponse } from 'next/server';
import { CUSTOMER_COOKIE } from '@/lib/cookies';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Sign out of the customer area. A shared phone deserves an easy way out. */
export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(CUSTOMER_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return response;
}
