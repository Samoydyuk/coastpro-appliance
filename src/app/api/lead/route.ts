import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { siteConfig } from '@/data/site-config';
import { recordLead } from '@/lib/leads';
import { pushLeadNow } from '@/lib/jobpocket';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The first step of the booking flow.
 *
 * Until now this data went nowhere: a visitor typed their name, address and
 * broken appliance, then met the scheduler — and if they did not pick a time,
 * everything they had typed was thrown away. Those are the warmest leads on the
 * site and they were being discarded silently.
 *
 * Now the details are recorded and emailed the moment step one is completed, so
 * somebody can call a half-finished booking back.
 */

const FROM = process.env.CONTACT_FROM_EMAIL || 'CoastPro Website <onboarding@resend.dev>';
const TO = process.env.CONTACT_TO_EMAIL || siteConfig.contact.email;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { name, email, phone, address, city, zip, appliance, problem } = data ?? {};

    if (!name || !phone || !email) {
      return NextResponse.json({ error: 'Name, phone and email are required' }, { status: 400 });
    }

    const leadId = await recordLead(request, {
      sourceForm: 'booking',
      name,
      email,
      phone,
      address,
      city,
      zip,
      appliance,
      problem,
    });

    // Straight to the owner's phone. Awaited, but on a tight budget inside
    // pushLeadNow — a promise left running after the response is not guaranteed
    // to finish on this platform, and the queue is what makes that safe.
    await pushLeadNow(leadId);

    // Best effort. The visitor is on their way to the scheduler and must not be
    // held up, or shown an error, because a notification failed.
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      const resend = new Resend(apiKey);
      resend.emails
        .send({
          from: FROM,
          to: [TO],
          replyTo: email,
          subject: `Booking started: ${appliance || 'appliance'} — ${name}`,
          html: `
            <h2>Someone started a booking</h2>
            <p>They have filled in their details and are choosing a time. If no
            appointment shows up in the calendar shortly, this is worth a call.</p>
            <p><strong>Name:</strong> ${escapeHtml(String(name))}</p>
            <p><strong>Phone:</strong> ${escapeHtml(String(phone))}</p>
            <p><strong>Email:</strong> ${escapeHtml(String(email))}</p>
            <p><strong>Address:</strong> ${escapeHtml(
              [address, city, zip].filter(Boolean).join(', ')
            )}</p>
            <p><strong>Appliance:</strong> ${escapeHtml(String(appliance ?? '—'))}</p>
            <p><strong>Problem:</strong> ${escapeHtml(String(problem ?? '—'))}</p>
          `,
        })
        .catch((error) => console.error('Booking lead email failed:', error));
    }

    return NextResponse.json({ ok: true, leadId }, { status: 200 });
  } catch (error) {
    console.error('Booking lead error:', error);
    // Answer 200 regardless: this endpoint exists to capture data, and a
    // failure here must not block the visitor from reaching the scheduler.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
