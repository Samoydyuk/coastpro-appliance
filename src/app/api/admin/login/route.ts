import { NextRequest, NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'crypto';
import { signAdminToken } from '@/lib/admin-token';
import { ADMIN_COOKIE, ADMIN_MAX_AGE } from '@/lib/cookies';
import { db, quietly } from '@/lib/db';
import { clientIp, hashIp } from '@/lib/tracking';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Admin sign-in.
 *
 * One shared password held in an environment variable. That is the right weight
 * for a panel with a single user: an accounts table would be more machinery to
 * maintain and one more thing that can be left in a bad state, without making
 * anything harder to break into.
 *
 * Attempts are throttled per address, and the comparison is constant-time —
 * without that, the response time leaks how much of the password was right.
 */

const attempts = new Map<string, { count: number; until: number }>();
const WINDOW_MS = 15 * 60_000;
const MAX_ATTEMPTS = 8;

function throttled(key: string): boolean {
  const entry = attempts.get(key);
  if (!entry) return false;
  if (Date.now() > entry.until) {
    attempts.delete(key);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

function recordFailure(key: string) {
  const entry = attempts.get(key);
  if (!entry || Date.now() > entry.until) {
    attempts.set(key, { count: 1, until: Date.now() + WINDOW_MS });
    return;
  }
  entry.count += 1;
}

function matches(provided: string, expected: string): boolean {
  // Hashed first so the comparison is over two equal-length buffers whatever
  // the inputs were — comparing raw strings of different lengths would return
  // early and leak the length.
  const a = createHash('sha256').update(provided).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      { error: 'ADMIN_PASSWORD is not configured on the server.' },
      { status: 500 }
    );
  }
  if (!process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET.length < 16) {
    return NextResponse.json(
      { error: 'ADMIN_SESSION_SECRET is missing or too short (needs 16+ characters).' },
      { status: 500 }
    );
  }

  const ip = clientIp(request.headers) ?? 'unknown';
  if (throttled(ip)) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again in fifteen minutes.' },
      { status: 429 }
    );
  }

  let password = '';
  try {
    ({ password } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  if (!password || !matches(String(password), expected)) {
    recordFailure(ip);
    const sql = db();
    if (sql) {
      await quietly(
        () => sql`
          insert into admin_audit (action, entity, detail, ip_hash)
          values ('login_failed', 'admin', ${sql.json({})}, ${hashIp(ip)})
        `
      );
    }
    return NextResponse.json({ error: 'Wrong password.' }, { status: 401 });
  }

  attempts.delete(ip);

  const token = await signAdminToken({
    sub: 'owner',
    exp: Math.floor(Date.now() / 1000) + ADMIN_MAX_AGE,
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, token, {
    maxAge: ADMIN_MAX_AGE,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  });

  const sql = db();
  if (sql) {
    await quietly(
      () => sql`
        insert into admin_audit (action, entity, ip_hash)
        values ('login', 'admin', ${hashIp(ip)})
      `
    );
  }

  return response;
}
