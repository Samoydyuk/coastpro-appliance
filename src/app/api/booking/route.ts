import { NextRequest, NextResponse } from 'next/server';
import { createLead } from '@/lib/jobpocket';
import { siteConfig } from '@/data/site-config';

export async function POST(request: NextRequest) {
  const data = await request.json().catch(() => null);

  // Name and phone are the only things we cannot work without: everything else
  // can be established on the confirmation call.
  if (!data?.name?.trim() || !data?.phone?.trim()) {
    return NextResponse.json({ error: 'Please give us a name and a phone number.' }, { status: 400 });
  }
  if (!data.externalId) {
    return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
  }

  const result = await createLead({
    name: String(data.name).trim(),
    phone: String(data.phone).trim(),
    email: data.email?.trim() || undefined,
    address: data.address?.trim() || undefined,
    serviceId: data.serviceId || undefined,
    serviceName: data.serviceName || undefined,
    brand: data.brand?.trim() || undefined,
    problem: data.problem?.trim() || undefined,
    windowStartISO: data.windowStartISO || undefined,
    windowEndISO: data.windowEndISO || undefined,
    externalId: String(data.externalId),
    landingUrl: request.headers.get('referer') || undefined,
  });

  if (result.ok) return NextResponse.json({ ok: true, duplicate: result.duplicate });

  // Say what to do instead rather than leaving someone staring at a red box.
  return NextResponse.json(
    { error: `We couldn't submit your request. Please call us at ${siteConfig.contact.phone}.` },
    { status: 502 }
  );
}
