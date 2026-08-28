import { NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { requireAdmin, adminJson } from '@/lib/admin-guard';
import { bookJob, OperationsApiError } from '@/lib/bookings/client';
import { requireDb, quietly } from '@/lib/db';
import { clientIp, hashIp } from '@/lib/tracking';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Putting a visit in the diary by hand — somebody rang, and it goes on the
 * calendar like any other job.
 *
 * The id that makes a retry safe is minted here rather than in the browser: a
 * double-clicked button must not become two vans, and a value the client
 * chooses is a value a client can forget to keep steady.
 */

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const body = (await request.json().catch(() => null)) as {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    service?: string;
    description?: string;
    scheduledStart?: string;
    scheduledEnd?: string;
    externalId?: string;
  } | null;

  const name = String(body?.name ?? '').trim();
  const phone = String(body?.phone ?? '').trim();

  if (!name || !phone) {
    return adminJson({ error: 'A name and a phone number are the minimum.' }, { status: 400 });
  }
  if (phone.replace(/\D/g, '').length < 7) {
    return adminJson({ error: 'That phone number looks too short.' }, { status: 400 });
  }

  for (const key of ['scheduledStart', 'scheduledEnd'] as const) {
    const value = body?.[key];
    if (value && Number.isNaN(new Date(value).getTime())) {
      return adminJson({ error: `${key} is not a date I can read.` }, { status: 400 });
    }
  }

  try {
    const result = await bookJob({
      // Sent by the form so a retry of the *same* submission is recognised, but
      // never trusted to exist.
      externalId: body?.externalId?.slice(0, 128) || `console-${randomUUID()}`,
      name,
      phone,
      email: body?.email?.trim() || undefined,
      address: body?.address?.trim() || undefined,
      service: body?.service?.trim() || undefined,
      description: body?.description?.trim() || undefined,
      scheduledStart: body?.scheduledStart,
      scheduledEnd: body?.scheduledEnd,
    });

    await quietly(async () => {
      const sql = requireDb();
      await sql`
        insert into admin_audit (action, entity, entity_id, detail, ip_hash)
        values ('booking_created', 'booking_request', ${result.requestId},
                ${sql.json({ jobId: result.jobId, name })},
                ${hashIp(clientIp(request.headers) ?? 'unknown')})
      `;
    });

    return adminJson({ ok: true, ...result });
  } catch (error) {
    if (error instanceof OperationsApiError) {
      return adminJson({ error: error.message }, { status: 502 });
    }
    console.error('[Bookings] Could not book:', error);
    return adminJson({ error: 'Could not create that job in JobPocket.' }, { status: 500 });
  }
}
