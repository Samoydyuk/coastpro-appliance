import { NextRequest, NextResponse } from 'next/server';
import { createPublicKey, verify as verifySignature, timingSafeEqual } from 'crypto';
import { db, quietly } from '@/lib/db';
import { toE164 } from '@/lib/tracking';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Inbound call reporting from Telnyx.
 *
 * Each tracking number in the pool is forwarded to the real business line in
 * the Telnyx portal, so calls connect exactly as they do today — this endpoint
 * only listens. What it produces is the thing no click-based tool can give a
 * home service business: which ad the phone call came from, whether it was
 * answered, and how long it lasted.
 *
 * A ninety-second answered call is a real customer. A four-second one is a
 * misdial. Counting them the same would flatter every channel equally.
 */

/** Telnyx signs with Ed25519 over `timestamp|body`. */
function verifyTelnyx(request: NextRequest, raw: string): boolean {
  const publicKey = process.env.TELNYX_PUBLIC_KEY;
  const sharedToken = process.env.TELNYX_WEBHOOK_TOKEN;

  // A token in the URL is the fallback for setups where the public key has not
  // been copied across yet. One of the two must be configured.
  if (!publicKey) {
    if (!sharedToken) return true;
    const provided = request.nextUrl.searchParams.get('token') ?? '';
    const a = Buffer.from(provided);
    const b = Buffer.from(sharedToken);
    return a.length === b.length && timingSafeEqual(a, b);
  }

  const signature = request.headers.get('telnyx-signature-ed25519');
  const timestamp = request.headers.get('telnyx-timestamp');
  if (!signature || !timestamp) return false;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;

  try {
    // Telnyx publishes the raw 32-byte key in base64; Node wants it wrapped in
    // the DER header that says "this is an Ed25519 public key".
    const der = Buffer.concat([
      Buffer.from('302a300506032b6570032100', 'hex'),
      Buffer.from(publicKey, 'base64'),
    ]);
    const key = createPublicKey({ key: der, format: 'der', type: 'spki' });
    return verifySignature(
      null,
      Buffer.from(`${timestamp}|${raw}`),
      key,
      Buffer.from(signature, 'base64')
    );
  } catch {
    return false;
  }
}

interface TelnyxEvent {
  data?: {
    event_type?: string;
    payload?: {
      call_session_id?: string;
      call_control_id?: string;
      from?: string;
      to?: string;
      direction?: string;
      start_time?: string;
      hangup_cause?: string;
      recording_urls?: { mp3?: string };
      public_recording_urls?: { mp3?: string };
    };
  };
}

export async function POST(request: NextRequest) {
  const raw = await request.text();

  if (!verifyTelnyx(request, raw)) {
    return NextResponse.json({ error: 'Bad signature' }, { status: 401 });
  }

  const sql = db();
  if (!sql) return NextResponse.json({ ok: true });

  let body: TelnyxEvent;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Bad payload' }, { status: 400 });
  }

  const eventType = body.data?.event_type;
  const payload = body.data?.payload ?? {};
  const callId = payload.call_session_id ?? payload.call_control_id;
  if (!callId) return NextResponse.json({ ok: true });

  const trackingNumber = toE164(payload.to) ?? payload.to ?? null;
  const caller = toE164(payload.from) ?? payload.from ?? null;

  await quietly(async () => {
    if (eventType === 'call.initiated') {
      // Inbound only — an outbound leg would otherwise be logged as a lead.
      if (payload.direction && payload.direction !== 'incoming') return;

      const [numberRow] = (await sql`
        select channel, campaign from tracking_numbers where number_e164 = ${trackingNumber}
      `) as unknown as { channel: string; campaign: string | null }[];

      // Tie the call to the browsing session that was looking at this number.
      // A visit still open on the site, shown this channel's number, in the
      // last half hour, is the same person often enough to be worth the link —
      // and it is what makes "what did they read before calling" possible.
      const [session] = (await sql`
        select id, visitor_id from sessions
        where channel = ${numberRow?.channel ?? null}
          and last_seen_at > now() - interval '30 minutes'
          and coalesce(is_bot, false) = false
        order by last_seen_at desc
        limit 1
      `) as unknown as { id: string; visitor_id: string }[];

      const [previous] = (await sql`
        select id from calls where caller_number = ${caller} limit 1
      `) as unknown as { id: string }[];

      await sql`
        insert into calls (
          provider_call_id, tracking_number, caller_number, destination,
          channel, campaign, visitor_id, session_id, started_at, is_first_time, raw
        ) values (
          ${callId}, ${trackingNumber}, ${caller}, ${payload.to ?? null},
          ${numberRow?.channel ?? 'unknown'}, ${numberRow?.campaign ?? null},
          ${session?.visitor_id ?? null}, ${session?.id ?? null},
          ${payload.start_time ? new Date(payload.start_time) : new Date()},
          ${!previous}, ${sql.json(body as never)}
        )
        on conflict (provider_call_id) do nothing
      `;
      return;
    }

    if (eventType === 'call.answered') {
      await sql`
        update calls set answered = true, answered_at = now()
        where provider_call_id = ${callId}
      `;
      return;
    }

    if (eventType === 'call.hangup') {
      await sql`
        update calls set
          ended_at = now(),
          hangup_cause = ${payload.hangup_cause ?? null},
          duration_seconds = greatest(0, extract(epoch from (now() - coalesce(answered_at, started_at)))::int)
        where provider_call_id = ${callId}
      `;

      // An answered call of real length is a lead in every sense that matters,
      // so it becomes one — otherwise the cost-per-lead of a phone-heavy
      // channel like Local Services Ads looks catastrophic and is not.
      await sql`
        insert into leads (
          visitor_id, session_id, source_form, phone, phone_e164,
          lt_channel, lt_campaign, status, created_at
        )
        select c.visitor_id, c.session_id, 'call', c.caller_number, c.caller_number,
               c.channel, c.campaign, 'contacted', c.started_at
        from calls c
        where c.provider_call_id = ${callId}
          and c.answered = true
          and c.duration_seconds >= 30
          and c.lead_id is null
          and not exists (
            select 1 from leads l
            where l.phone_e164 = c.caller_number
              and l.created_at > now() - interval '30 days'
          )
        returning id
      `;

      await sql`
        update calls c set lead_id = l.id
        from leads l
        where c.provider_call_id = ${callId}
          and l.phone_e164 = c.caller_number
          and l.created_at > now() - interval '30 days'
          and c.lead_id is null
      `;

      return;
    }

    if (eventType === 'call.recording.saved') {
      const url = payload.public_recording_urls?.mp3 ?? payload.recording_urls?.mp3 ?? null;
      if (url) {
        await sql`update calls set recording_url = ${url} where provider_call_id = ${callId}`;
      }
    }
  });

  return NextResponse.json({ ok: true });
}
