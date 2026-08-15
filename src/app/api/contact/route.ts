import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { siteConfig } from '@/data/site-config';
import { recordLead } from '@/lib/leads';
import { pushLeadNow } from '@/lib/jobpocket';
import { db, quietly } from '@/lib/db';

// Node, explicitly: this route uses fetch with an abort signal and Node's
// crypto downstream, and Edge changes the semantics of both.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Address the notification is sent from. Resend only accepts a domain you have
 * verified in their dashboard, so this is configurable rather than hard-coded.
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

/**
 * Whether the notification email actually left the building. Worth storing:
 * when a lead is never called back, this is the difference between "nobody saw
 * it" and "somebody saw it and dropped it".
 */
async function markDelivered(leadId: string | null, delivered: boolean) {
  if (!leadId) return;
  const sql = db();
  if (!sql) return;
  await quietly(
    () => sql`update leads set email_delivered = ${delivered}, updated_at = now() where id = ${leadId}`
  );
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { name, email, phone, service, message } = data;

    // Email is optional here, as it is on the booking form: the phone is how
    // this shop answers, and a required address is a field people abandon the
    // form on rather than fill in.
    if (!name || !phone || !service || !message) {
      return NextResponse.json({ error: 'Name, phone, service and message are required' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Recorded before the email is attempted. The database copy is the one that
    // survives a full inbox, a spam filter or a Resend outage, and it is the
    // only copy carrying the attribution.
    const leadId = await recordLead(request, {
      sourceForm: 'contact',
      name,
      // Empty string rather than absent is how a blank optional field arrives
      // from a form, and it would be stored as one — a lead that looks like it
      // has an address until somebody tries to use it.
      email: email?.trim() || null,
      phone,
      appliance: service,
      message,
    });

    const apiKey = process.env.RESEND_API_KEY;

    // Two independent ways to reach a human, tried at the same time rather than
    // one after the other — the visitor waits for the slower, not for both.
    const [jobPocket, emailed] = await Promise.all([
      pushLeadNow(leadId),
      (async () => {
        if (!apiKey) {
          console.error(
            'Contact form: RESEND_API_KEY is not set — no email could be sent.',
            { name, email, phone, service, at: new Date().toISOString() }
          );
          return false;
        }
        const resend = new Resend(apiKey);
        const { error } = await resend.emails.send({
          from: FROM,
          to: [TO],
          // Only when there is one. An empty replyTo is a malformed header,
          // and Resend rejects the whole message rather than ignoring it —
          // which would lose the enquiry over an optional field.
          ...(email ? { replyTo: email } : {}),
          subject: `New service request: ${service} — ${name}`,
          html: `
            <h2>New contact form submission</h2>
            <p><strong>Name:</strong> ${escapeHtml(name)}</p>
            <p><strong>Email:</strong> ${email ? escapeHtml(email) : 'not given'}</p>
            <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
            <p><strong>Service:</strong> ${escapeHtml(service)}</p>
            <p><strong>Message:</strong></p>
            <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
            <hr>
            <p style="color:#666;font-size:12px">Sent from ${siteConfig.seo.siteUrl} at ${new Date().toISOString()}</p>
          `,
        });
        if (error) console.error('Contact form: Resend rejected the message', error);
        return !error;
      })(),
    ]);

    await markDelivered(leadId, emailed);

    // A lead that reached JobPocket has made somebody's phone buzz. A lead only
    // queued for retry has not — so it does not count as delivered, however
    // safely it is stored. Telling somebody their message went through when
    // nobody has seen it is how six months of enquiries were lost here.
    const reachedSomebody =
      emailed || jobPocket.kind === 'created' || jobPocket.kind === 'duplicate';

    if (!reachedSomebody) {
      return NextResponse.json(
        {
          error: `Our contact form is temporarily unavailable. Please call us at ${siteConfig.contact.phone}.`,
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ message: 'Message sent successfully' }, { status: 200 });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: `Something went wrong. Please call us at ${siteConfig.contact.phone}.` },
      { status: 500 }
    );
  }
}
