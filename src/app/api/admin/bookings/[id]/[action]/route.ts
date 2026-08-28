import { NextRequest } from 'next/server';
import { requireAdmin, adminJson } from '@/lib/admin-guard';
import { acceptRequest, declineRequest, OperationsApiError } from '@/lib/bookings/client';
import { markLeadForImmediatePoll } from '@/lib/bookings/queries';
import { syncJobPocketOutcomes } from '@/lib/jobpocket';
import { requireDb, quietly } from '@/lib/db';
import { clientIp, hashIp } from '@/lib/tracking';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Answering a booking request from the console.
 *
 * The decision is JobPocket's to record — this only relays it, and then nudges
 * the local lead to catch up so the console does not spend the rest of the day
 * disagreeing with the app about what just happened.
 */

const ACTIONS = new Set(['accept', 'decline']);

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; action: string } }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  if (!ACTIONS.has(params.action)) {
    return adminJson({ error: 'Unknown action' }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as { scheduledStart?: string } | null;

  try {
    const result =
      params.action === 'accept'
        ? await acceptRequest(params.id, {
            ...(body?.scheduledStart ? { scheduledStart: body.scheduledStart } : {}),
          })
        : await declineRequest(params.id);

    await writeAudit(request, params.id, params.action, result);

    if (params.action === 'accept') {
      /**
       * Bring the local lead up to date now rather than at tomorrow's cron.
       *
       * Deliberately through the sync rather than a direct `update`: the rules
       * about never lowering a status a person set, and never touching one
       * written off as lost, live in there. Writing 'booked' straight into the
       * row here would be the one place those rules did not apply.
       */
      await quietly(async () => {
        await markLeadForImmediatePoll(params.id);
        await syncJobPocketOutcomes(5);
      });
    }

    // Spread last: the upstream result already carries its own `ok`, and its
    // answer is the one that counts.
    return adminJson({ ...result });
  } catch (error) {
    if (error instanceof OperationsApiError) {
      // The message names what to do about it — a rotated key, a request that
      // somebody already answered on the phone — so it goes back verbatim.
      return adminJson({ error: error.message }, { status: error.status === 404 ? 404 : 502 });
    }
    console.error('[Bookings] Action failed:', error);
    return adminJson({ error: 'Could not send that to JobPocket.' }, { status: 500 });
  }
}

async function writeAudit(
  request: NextRequest,
  requestId: string,
  action: string,
  result: unknown
): Promise<void> {
  await quietly(async () => {
    const sql = requireDb();
    await sql`
      insert into admin_audit (action, entity, entity_id, detail, ip_hash)
      values (${`booking_${action}`}, 'booking_request', ${requestId},
              ${sql.json(result as Record<string, never>)},
              ${hashIp(clientIp(request.headers) ?? 'unknown')})
    `;
  });
}
