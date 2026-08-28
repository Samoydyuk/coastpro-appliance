import { NextRequest, NextResponse } from 'next/server';
import { requireDb } from '@/lib/db';
import { CHANNELS } from '@/lib/attribution';
import { toE164 } from '@/lib/tracking';
import { formatPhoneNumber } from '@/lib/utils';
import { requireAdmin } from '@/lib/admin-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** The tracking number pool used for dynamic number insertion. */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;


  try {
    const sql = requireDb();
    const body = (await request.json()) as {
      number?: string;
      channel?: string;
      campaign?: string;
      label?: string;
    };

    const e164 = toE164(body.number);
    if (!e164) {
      return NextResponse.json({ error: 'That does not look like a US phone number.' }, { status: 400 });
    }
    // `default` is allowed on top of the real channels: it is the number shown
    // to anyone whose channel has no number of its own.
    if (!body.channel || (body.channel !== 'default' && !CHANNELS.includes(body.channel as never))) {
      return NextResponse.json({ error: 'Unknown channel' }, { status: 400 });
    }

    await sql`
      insert into tracking_numbers (number_e164, display_number, channel, campaign, label)
      values (${e164}, ${formatPhoneNumber(e164.replace('+1', ''))}, ${body.channel},
              ${body.campaign || null}, ${body.label || null})
      on conflict (number_e164) do update set
        channel = excluded.channel,
        campaign = excluded.campaign,
        label = excluded.label,
        active = true
    `;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Number save failed:', error);
    return NextResponse.json({ error: 'Could not save the number.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;


  try {
    const sql = requireDb();
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    // Deactivated rather than deleted: past calls reference the number, and a
    // call log that cannot say which channel rang is worse than a stale row.
    await sql`update tracking_numbers set active = false where id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Could not remove the number.' }, { status: 500 });
  }
}
