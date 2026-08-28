import { NextRequest } from 'next/server';
import { requireAdmin, adminJson } from '@/lib/admin-guard';
import { assignJob, OperationsApiError } from '@/lib/bookings/client';
import { requireDb, quietly } from '@/lib/db';
import { clientIp, hashIp } from '@/lib/tracking';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Deciding who is going. Sends the same notification the app does. */
export async function POST(request: NextRequest, { params }: { params: { jobId: string } }) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const body = (await request.json().catch(() => null)) as { teamMemberIds?: unknown } | null;
  const ids = Array.isArray(body?.teamMemberIds)
    ? body.teamMemberIds.filter((id): id is string => typeof id === 'string')
    : null;

  if (ids === null) {
    return adminJson({ error: 'Send a list of team members.' }, { status: 400 });
  }

  try {
    const result = await assignJob(params.jobId, ids);

    await quietly(async () => {
      const sql = requireDb();
      await sql`
        insert into admin_audit (action, entity, entity_id, detail, ip_hash)
        values ('job_assigned', 'job', ${params.jobId},
                ${sql.json({ teamMemberIds: ids })},
                ${hashIp(clientIp(request.headers) ?? 'unknown')})
      `;
    });

    return adminJson(result);
  } catch (error) {
    if (error instanceof OperationsApiError) {
      return adminJson({ error: error.message }, { status: error.status === 400 ? 400 : 502 });
    }
    console.error('[Jobs] Assign failed:', error);
    return adminJson({ error: 'Could not change who is going.' }, { status: 500 });
  }
}
