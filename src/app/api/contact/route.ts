import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { siteConfig } from '@/data/site-config';

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

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { name, email, phone, service, message } = data;

    if (!name || !email || !phone || !service || !message) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;

    // Without a key nothing can be delivered. Fail loudly: telling the visitor
    // the message went through when it did not is how leads get lost.
    if (!apiKey) {
      console.error(
        'Contact form: RESEND_API_KEY is not set — submission could not be delivered.',
        { name, email, phone, service, at: new Date().toISOString() }
      );
      return NextResponse.json(
        {
          error: `Our contact form is temporarily unavailable. Please call us at ${siteConfig.contact.phone}.`,
        },
        { status: 503 }
      );
    }

    const resend = new Resend(apiKey);

    const { error } = await resend.emails.send({
      from: FROM,
      to: [TO],
      replyTo: email,
      subject: `New service request: ${service} — ${name}`,
      html: `
        <h2>New contact form submission</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
        <p><strong>Service:</strong> ${escapeHtml(service)}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
        <hr>
        <p style="color:#666;font-size:12px">Sent from ${siteConfig.seo.siteUrl} at ${new Date().toISOString()}</p>
      `,
    });

    if (error) {
      console.error('Contact form: Resend rejected the message', error);
      return NextResponse.json(
        {
          error: `We couldn't send your message. Please call us at ${siteConfig.contact.phone}.`,
        },
        { status: 502 }
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
