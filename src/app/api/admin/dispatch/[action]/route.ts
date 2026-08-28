import { NextRequest } from 'next/server';
import { requireAdmin, adminJson } from '@/lib/admin-guard';
import { OperationsApiError } from '@/lib/bookings/client';
import {
  startSession,
  presence,
  getSeat,
  createSeat,
  setSeatRinging,
  getCaller,
  startOutbound,
  endOutbound,
} from '@/lib/dispatch/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Everything the call bar needs, proxied.
 *
 * The browser never talks to JobPocket directly — the key stays on this
 * server. It does talk to Telnyx directly, over the token this route hands
 * back, which is the whole point: media has to go somewhere, and it must not
 * go through us.
 */

async function handle(request: NextRequest, action: string) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  switch (action) {
    case 'seat':
      return adminJson(await createSeat());

    case 'ringing':
      return adminJson(await setSeatRinging(Boolean(body.ringing)));

    case 'session':
      return adminJson(await startSession(String(body.teamMemberId ?? '')));

    case 'registered':
    case 'heartbeat':
    case 'offline':
      await presence(action, String(body.teamMemberId ?? ''));
      return adminJson({ ok: true });

    case 'outbound':
      return adminJson(
        await startOutbound({
          teamMemberId: String(body.teamMemberId ?? ''),
          toE164: String(body.toE164 ?? ''),
          ...(body.clientId ? { clientId: String(body.clientId) } : {}),
        })
      );

    case 'ended':
      await endOutbound(String(body.callId ?? ''), {
        answered: Boolean(body.answered),
        durationSec: Number(body.durationSec ?? 0),
      });
      return adminJson({ ok: true });

    default:
      return adminJson({ error: 'Unknown action' }, { status: 400 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { action: string } }) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  try {
    return await handle(request, params.action);
  } catch (error) {
    if (error instanceof OperationsApiError) {
      return adminJson({ error: error.message }, { status: error.status || 502 });
    }
    console.error('[Dispatch] Failed:', error);
    return adminJson({ error: 'Could not reach the phone system.' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: { action: string } }) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  try {
    if (params.action === 'seat') return adminJson(await getSeat());
    if (params.action === 'caller') {
      const from = request.nextUrl.searchParams.get('from') ?? '';
      return adminJson(await getCaller(from));
    }
    return adminJson({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    if (error instanceof OperationsApiError) {
      return adminJson({ error: error.message }, { status: error.status || 502 });
    }
    console.error('[Dispatch] Failed:', error);
    return adminJson({ error: 'Could not reach the phone system.' }, { status: 500 });
  }
}
