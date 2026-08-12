import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { db, quietly } from '@/lib/db';
import { markLeadBooked } from '@/lib/leads';
import { toE164 } from '@/lib/tracking';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Calendly's server-to-server notification — the authoritative record that an
 * appointment exists.
 *
 * Subscribe to `invitee.created` and `invitee.canceled` at
 * https://calendly.com/integrations/api_webhooks pointing at
 * https://coastpro.us/api/calendly/webhook, and put the signing key it gives
 * you in CALENDLY_WEBHOOK_SECRET.
 */

function verify(signatureHeader: string | null, body: string): boolean {
  const secret = process.env.CALENDLY_WEBHOOK_SECRET;
  // Unsigned is only tolerated when no key is configured yet, so bookings are
  // still recorded during setup. Once the key exists, the check is enforced.
  if (!secret) return true;
  if (!signatureHeader) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(',').map((piece) => piece.split('=').map((value) => value.trim()) as [string, string])
  );
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  // Reject anything older than five minutes: a captured request should not be
  // replayable tomorrow.
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;

  const expected = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  const raw = await request.text();

  if (!verify(request.headers.get('calendly-webhook-signature'), raw)) {
    return NextResponse.json({ error: 'Bad signature' }, { status: 401 });
  }

  let body: {
    event?: string;
    payload?: {
      email?: string;
      name?: string;
      text_reminder_number?: string;
      cancel_url?: string;
      questions_and_answers?: { question: string; answer: string }[];
      scheduled_event?: { start_time?: string; name?: string };
      tracking?: Record<string, string>;
    };
  };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Bad payload' }, { status: 400 });
  }

  const invitee = body.payload ?? {};
  // The booking form puts the phone number into a custom question, which is
  // where it has to be read back from — it is the only field that reliably
  // matches a lead we already have.
  const answeredPhone = invitee.questions_and_answers?.find((entry) =>
    /phone/i.test(entry.question)
  )?.answer;
  const phone = invitee.text_reminder_number || answeredPhone || null;

  const sql = db();

  if (body.event === 'invitee.created') {
    const leadId = await markLeadBooked({ email: invitee.email, phone });

    // Somebody who booked without ever touching our form — a direct Calendly
    // link, say — still deserves to exist as a lead.
    if (!leadId && sql) {
      await quietly(
        () => sql`
          insert into leads (source_form, name, email, phone, phone_e164, status, booked_at, lt_channel)
          values ('calendly', ${invitee.name ?? null}, ${invitee.email ?? null}, ${phone},
                  ${toE164(phone)}, 'booked', now(), ${invitee.tracking?.utm_source ?? 'direct'})
        `
      );
    }
  }

  if (body.event === 'invitee.canceled' && sql) {
    const phoneE164 = toE164(phone);
    await quietly(
      () => sql`
        update leads set
          status = case when status = 'booked' then 'contacted' else status end,
          booked_at = null,
          notes = coalesce(notes || E'\n', '') || 'Appointment cancelled in Calendly',
          updated_at = now()
        where created_at > now() - interval '90 days'
          and (
            (${phoneE164}::text is not null and phone_e164 = ${phoneE164})
            or (${invitee.email ?? null}::text is not null and lower(email) = lower(${invitee.email ?? null}))
          )
      `
    );
  }

  return NextResponse.json({ ok: true });
}
