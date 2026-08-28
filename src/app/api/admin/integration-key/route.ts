import { NextRequest } from 'next/server';
import { requireAdmin, adminJson } from '@/lib/admin-guard';
import { requireDb, quietly } from '@/lib/db';
import { sealSecret, maskKey, secretsConfigured } from '@/lib/secrets';
import { clientIp, hashIp } from '@/lib/tracking';
import { forgetJobPocketConfig } from '@/lib/jobpocket';
import { forgetMarketingConfig } from '@/lib/marketing/client';
import { forgetOperationsConfig } from '@/lib/bookings/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Saving a JobPocket plugin key.
 *
 * Until now these rows could only be written with `psql`, which is not a thing
 * the owner of a repair business should have to do to reconnect their own site
 * — and it meant that rotating a key, the one operation that has to be fast,
 * was the slowest one available.
 *
 * The value is sealed before it is stored, so the row is useless without the
 * environment's encryption key, and it is never read back to the browser.
 */

const SCOPES = {
  website: { row: 'jobpocket', label: 'Website leads', forget: forgetJobPocketConfig },
  marketing: { row: 'jobpocket_marketing', label: 'Marketing', forget: forgetMarketingConfig },
  operations: { row: 'jobpocket_operations', label: 'Bookings and calendar', forget: forgetOperationsConfig },
} as const;

type Scope = keyof typeof SCOPES;

const KEY_SHAPE = /^jpk_[0-9a-f]{16}\.[A-Za-z0-9_-]{20,}$/;

/**
 * Ask JobPocket whether it recognises the key, without creating anything.
 *
 * The integration middleware authenticates before any handler parses a body, so
 * an empty POST to the lead endpoint separates the two answers cleanly: 401 or
 * 403 means the key is wrong, revoked or switched off, and 400 means it got
 * through and the *body* was the problem — which is exactly what we sent. No
 * lead is created either way.
 */
async function keyIsLive(apiKey: string, baseUrl: string): Promise<{ ok: boolean; reason?: string }> {
  try {
    const response = await fetch(`${baseUrl}/v1/leads`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: '{}',
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });

    if (response.status === 400) return { ok: true };
    if (response.status === 401) return { ok: false, reason: 'JobPocket does not recognise that key.' };
    if (response.status === 403) {
      return { ok: false, reason: 'That key exists but the integration is switched off in JobPocket.' };
    }
    return { ok: false, reason: `JobPocket answered ${response.status}.` };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, reason: `Could not reach JobPocket: ${message}` };
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  if (!secretsConfigured()) {
    return adminJson(
      {
        error:
          'SETTINGS_ENCRYPTION_KEY is not set, so a key cannot be stored safely. ' +
          'Generate one with `openssl rand -base64 32` and add it to the project.',
      },
      { status: 500 }
    );
  }

  const body = (await request.json().catch(() => null)) as {
    scope?: string;
    key?: string;
  } | null;

  const scope = body?.scope as Scope | undefined;
  if (!scope || !(scope in SCOPES)) {
    return adminJson({ error: 'Unknown key type.' }, { status: 400 });
  }

  const key = String(body?.key ?? '').trim();
  if (!KEY_SHAPE.test(key)) {
    return adminJson(
      { error: 'That does not look like a JobPocket key. They start with jpk_ and contain a dot.' },
      { status: 400 }
    );
  }

  const baseUrl = process.env.JOBPOCKET_API_BASE || 'https://portal.jobpocket.app';

  // Checked before it is stored, so a mistyped key is rejected here rather than
  // surfacing later as an empty screen with no explanation.
  const live = await keyIsLive(key, baseUrl);
  if (!live.ok) return adminJson({ error: live.reason }, { status: 400 });

  const sql = requireDb();
  const row = SCOPES[scope].row;

  await sql`
    insert into settings (key, value)
    values (${row}, ${sql.json({ apiKey: sealSecret(key), enabled: true })})
    on conflict (key) do update set value = excluded.value, updated_at = now()
  `;

  SCOPES[scope].forget();

  await quietly(
    () => sql`
      insert into admin_audit (action, entity, entity_id, detail, ip_hash)
      values ('integration_key_saved', 'settings', ${row},
              ${sql.json({ scope, masked: maskKey(key) })},
              ${hashIp(clientIp(request.headers) ?? 'unknown')})
    `
  );

  // Only ever the masked form goes back — the browser has no reason to hold it.
  return adminJson({ ok: true, masked: maskKey(key), label: SCOPES[scope].label });
}
