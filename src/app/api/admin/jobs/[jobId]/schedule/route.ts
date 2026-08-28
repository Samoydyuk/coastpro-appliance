import { NextRequest } from 'next/server';
import { requireAdmin, adminJson } from '@/lib/admin-guard';
import { rescheduleJob, OperationsApiError } from '@/lib/bookings/client';
import { requireDb, quietly } from '@/lib/db';
import { clientIp, hashIp } from '@/lib/tracking';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Moving a visit.
 *
 * The only thing this console writes on a job. Status, stock and money stay in
 * the app, where finishing a job closes a time entry and can turn it
 * free-and-paid — a browser doing part of that would be doing it differently.
 */
export async function POST(request: NextRequest, { params }: { params: { jobId: string } }) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const body = (await request.json().catch(() => null)) as {
    scheduledAt?: string;
    estimatedDuration?: number | null;
  } | null;

  const when = body?.scheduledAt;
  if (!when || Number.isNaN(new Date(when).getTime())) {
    return adminJson({ error: 'A time is required.' }, { status: 400 });
  }

  try {
    const result = await rescheduleJob(params.jobId, {
      scheduledAt: new Date(when).toISOString(),
      ...(typeof body?.estimatedDuration === 'number'
        ? { estimatedDuration: body.estimatedDuration }
        : {}),
    });

    await quietly(async () => {
      const sql = requireDb();
      await sql`
        insert into admin_audit (action, entity, entity_id, detail, ip_hash)
        values ('job_rescheduled', 'job', ${params.jobId},
                ${sql.json({ scheduledAt: new Date(when).toISOString() })},
                ${hashIp(clientIp(request.headers) ?? 'unknown')})
      `;
    });

    return adminJson(result);
  } catch (error) {
    if (error instanceof OperationsApiError) {
      // 409 is JobPocket saying the job is finished or called off — a sentence
      // the person reading it can act on, so it goes back verbatim.
      return adminJson({ error: error.message }, { status: error.status === 409 ? 409 : 502 });
    }
    console.error('[Jobs] Reschedule failed:', error);
    return adminJson({ error: 'Could not move that visit.' }, { status: 500 });
  }
}
