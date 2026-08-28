import { NextRequest, NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'crypto';
import { signAdminToken } from '@/lib/admin-token';
import { ADMIN_COOKIE, ADMIN_MAX_AGE } from '@/lib/cookies';
import { db, quietly } from '@/lib/db';
import { clientIp, hashIp } from '@/lib/tracking';
import { verifyTotp } from '@/lib/totp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Admin sign-in.
 *
 * One shared password in an environment variable, plus a code from an
 * authenticator app. That is the right weight for a panel with a single user:
 * an accounts table would be more machinery to keep correct without making
 * anything harder to break into — but a password alone is not enough once the
 * panel shows customers' names, addresses and the week's schedule.
 *
 * The password comparison is constant-time; without that the response time
 * leaks how much of it was right.
 */

const WINDOW_MS = 15 * 60_000;
const MAX_ATTEMPTS = 8;

/**
 * How many times this address has got it wrong lately.
 *
 * This used to be a `Map` in module scope, which read like a throttle and was
 * not one: every serverless instance had its own, they are created and discarded
 * constantly, and a deploy wiped them all. Eight attempts per instance is not a
 * limit anybody has to work around. The audit table already records each failure
 * with a hashed address, so counting rows there is both the honest number and
 * one fewer thing to keep.
 */
async function recentFailures(ipHash: string | null): Promise<number> {
  const sql = db();
  // No address to count against — the same position the old code was in, and
  // the password and the code are still both required.
  if (!sql || !ipHash) return 0;

  const counted = await quietly(async () => {
    const [row] = (await sql`
      select count(*)::int as n
      from admin_audit
      where action = 'login_failed'
        and ip_hash = ${ipHash}
        and ts > now() - interval '15 minutes'
    `) as unknown as { n: number }[];
    return row?.n ?? 0;
  });

  // Fails open. A database outage already takes the console down; refusing to
  // let the owner in as well would turn one problem into two, and the password
  // and the code both still have to be right.
  return counted ?? 0;
}

function matches(provided: string, expected: string): boolean {
  // Hashed first so the comparison is over two equal-length buffers whatever
  // the inputs were — comparing raw strings of different lengths would return
  // early and leak the length.
  const a = createHash('sha256').update(provided).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

/** The last time-step already spent, so a code cannot be used twice. */
async function lastTotpCounter(): Promise<number | null> {
  const sql = db();
  if (!sql) return null;

  const value = await quietly(async () => {
    const [row] = (await sql`
      select value from settings where key = 'admin_totp_last_counter'
    `) as unknown as { value: { counter?: number } }[];
    return row?.value?.counter ?? null;
  });

  return value ?? null;
}

async function rememberTotpCounter(counter: number): Promise<void> {
  const sql = db();
  if (!sql) return;

  await quietly(
    () => sql`
      insert into settings (key, value)
      values ('admin_totp_last_counter', ${sql.json({ counter })})
      on conflict (key) do update set value = excluded.value, updated_at = now()
    `
  );
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
  const ipHash = hashIp(ip);

  if ((await recentFailures(ipHash)) >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again in fifteen minutes.' },
      { status: 429 }
    );
  }

  let password = '';
  let code = '';
  try {
    const body = await request.json();
    password = String(body?.password ?? '');
    code = String(body?.code ?? '');
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  const fail = async (message: string, detail: Record<string, string>) => {
    const sql = db();
    if (sql) {
      await quietly(
        () => sql`
          insert into admin_audit (action, entity, detail, ip_hash)
          values ('login_failed', 'admin', ${sql.json(detail)}, ${ipHash})
        `
      );
    }
    return NextResponse.json({ error: message }, { status: 401 });
  };

  if (!password || !matches(password, expected)) {
    return fail('Wrong password.', { reason: 'password' });
  }

  /**
   * The second factor.
   *
   * When no secret is configured the password alone still gets you in, and the
   * settings screen says so in as many words. That is deliberate: making the
   * code mandatory the moment this deploys would lock the owner out of their own
   * console until an environment variable caught up. Set ADMIN_TOTP_SECRET and
   * it becomes required on the very next request, with no further deploy.
   */
  const totpSecret = process.env.ADMIN_TOTP_SECRET;
  let spentCounter: number | null = null;

  if (totpSecret) {
    if (!code) {
      return fail('Enter the code from your authenticator app.', { reason: 'code_missing' });
    }

    const counter = verifyTotp(code, totpSecret, {
      minCounter: await lastTotpCounter(),
      // One step either side, so a phone clock that is half a minute out still
      // works. Wider than that and a shoulder-surfed code stays useful too long.
      window: 1,
    });

    if (counter === null) {
      // Says nothing about which half was wrong: the password was already
      // correct at this point, and confirming that to a guesser is a gift.
      return fail('That code is wrong or already used.', { reason: 'code' });
    }
    spentCounter = counter;
  }

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

  if (spentCounter !== null) await rememberTotpCounter(spentCounter);

  const sql = db();
  if (sql) {
    await quietly(
      () => sql`
        insert into admin_audit (action, entity, detail, ip_hash)
        values ('login', 'admin', ${sql.json({ secondFactor: Boolean(totpSecret) })}, ${ipHash})
      `
    );
  }

  return response;
}
