import { NextRequest, NextResponse } from 'next/server';
import { recordLead } from '@/lib/leads';
import { pushLeadNow } from '@/lib/jobpocket';
import { siteConfig } from '@/data/site-config';

// Reads cookies and writes to Postgres, neither of which belongs on Edge.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * A booking becomes two things, in this order and no other.
 *
 * First a row here, carrying the attribution that only this request knows —
 * which ad was clicked, which session, which landing page. That has to be
 * written before anything is sent, because the row's id is the key JobPocket
 * dedupes on: it is what makes a retry safe rather than a second van.
 *
 * Then one push to JobPocket, through the same queue the contact form uses.
 * There is deliberately only one sending path in this codebase — a second one
 * would eventually mean one enquiry arriving twice.
 */
export async function POST(request: NextRequest) {
  const data = await request.json().catch(() => null);

  // Name and phone are the only things we cannot work without: everything else
  // can be established on the confirmation call.
  if (!data?.name?.trim() || !data?.phone?.trim()) {
    return NextResponse.json(
      { error: 'Please give us a name and a phone number.' },
      { status: 400 }
    );
  }

  const leadId = await recordLead(request, {
    sourceForm: 'booking',
    name: String(data.name).trim(),
    phone: String(data.phone).trim(),
    email: data.email?.trim() || null,
    address: data.address?.trim() || null,
    brand: data.brand?.trim() || null,
    problem: data.problem?.trim() || null,
    serviceName: data.serviceName || null,
    preferredStart: data.windowStartISO || null,
    preferredEnd: data.windowEndISO || null,
  });

  const outcome = await pushLeadNow(leadId);
  const delivered = outcome.kind === 'created' || outcome.kind === 'duplicate';

  if (delivered) {
    return NextResponse.json({ ok: true, duplicate: outcome.kind === 'duplicate' });
  }

  /**
   * The row is saved either way, so nothing is lost and the retry will carry
   * it. But saved is not the same as delivered: the retry runs on a schedule
   * measured in hours, and until it does, no phone has rung. Somebody who is
   * told "we'll confirm your window" and then hears nothing all day is worse
   * off than somebody who was asked to call.
   */
  console.error('Booking was captured but not delivered to JobPocket', {
    leadId,
    outcome: outcome.kind,
    at: new Date().toISOString(),
  });

  return NextResponse.json(
    {
      error: `We couldn't submit your request just now. Please call us at ${siteConfig.contact.phone} — we have your details and will call back either way.`,
    },
    { status: 503 }
  );
}
