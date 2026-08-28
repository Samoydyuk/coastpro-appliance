import { operationsConfig, OperationsApiError } from '@/lib/bookings/client';

/**
 * Talking to JobPocket about the phone.
 *
 * Shares the operations key with the booking screens — it is the same console
 * acting for the same owner — but lives apart because telephony is a different
 * subject, and the thing this file must never do is different too: the SIP
 * password stays on the server, and only a token that dies of its own accord
 * ever reaches a page.
 */

const REQUEST_TIMEOUT_MS = 10_000;

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const config = await operationsConfig();
  if (!config) {
    throw new OperationsApiError(
      'No bookings key yet. Paste one in Settings before answering calls here.',
      0,
      'not_configured'
    );
  }

  let response: Response;
  try {
    response = await fetch(`${config.baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new OperationsApiError(`Could not reach JobPocket: ${message}`, 0, 'unreachable');
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new OperationsApiError(
      body?.error ?? `JobPocket answered ${response.status}.`,
      response.status,
      response.status === 401 || response.status === 403 ? 'rejected' : 'unreachable'
    );
  }

  return (await response.json()) as T;
}

export interface DispatchSeat {
  seat: { id: string; name: string } | null;
  /** Whether calls actually reach the desk — not the same as the seat existing. */
  ringing: boolean;
  strategy: string | null;
}

export async function getSeat(): Promise<DispatchSeat> {
  return call('/v1/dispatch/seat');
}

export async function createSeat(): Promise<{ seat: { id: string; name: string }; created: boolean }> {
  return call('/v1/dispatch/seat', { method: 'POST', body: '{}' });
}

export async function setSeatRinging(ringing: boolean): Promise<{ ok: true; ringing: boolean }> {
  return call('/v1/dispatch/seat/ringing', { method: 'PUT', body: JSON.stringify({ ringing }) });
}

export interface DispatchSession {
  token: string;
  expiresInSec: number;
  lineE164: string | null;
  callerIdName: string;
  teamMemberId: string;
}

export async function startSession(teamMemberId: string): Promise<DispatchSession> {
  return call('/v1/dispatch/session', { method: 'POST', body: JSON.stringify({ teamMemberId }) });
}

export async function presence(
  kind: 'registered' | 'heartbeat' | 'offline',
  teamMemberId: string
): Promise<void> {
  await call(`/v1/dispatch/${kind}`, { method: 'POST', body: JSON.stringify({ teamMemberId }) });
}

export interface CallerContext {
  callId: string;
  fromDisplay: string;
  lineLabel: string;
  match: string;
  client: { id: string; name: string; address: string | null; initials: string } | null;
  activeJob: { id: string; jobNumber: string | null; type: string | null } | null;
  lastJob: { id: string; jobNumber: string | null; completedAt: string | null } | null;
}

export async function getCaller(from: string): Promise<{ context: CallerContext | null }> {
  return call(`/v1/dispatch/caller?from=${encodeURIComponent(from)}`);
}

export async function startOutbound(input: {
  teamMemberId: string;
  toE164: string;
  clientId?: string;
}): Promise<{ callId: string }> {
  return call('/v1/dispatch/calls', { method: 'POST', body: JSON.stringify(input) });
}

export async function endOutbound(
  callId: string,
  body: { answered: boolean; durationSec: number }
): Promise<void> {
  await call(`/v1/dispatch/calls/${encodeURIComponent(callId)}/ended`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
