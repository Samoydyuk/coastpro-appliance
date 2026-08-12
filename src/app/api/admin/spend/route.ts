import { NextRequest, NextResponse } from 'next/server';
import { requireDb } from '@/lib/db';
import { CHANNELS } from '@/lib/attribution';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const sql = requireDb();
    const body = (await request.json()) as {
      day?: string;
      channel?: string;
      campaign?: string;
      costCents?: number;
      clicks?: number | null;
      impressions?: number | null;
    };

    if (!body.day || !/^\d{4}-\d{2}-\d{2}$/.test(body.day)) {
      return NextResponse.json({ error: 'A day is required' }, { status: 400 });
    }
    if (!body.channel || !CHANNELS.includes(body.channel as never)) {
      return NextResponse.json({ error: 'Unknown channel' }, { status: 400 });
    }
    if (!Number.isFinite(body.costCents) || (body.costCents as number) < 0) {
      return NextResponse.json({ error: 'Cost looks wrong' }, { status: 400 });
    }

    await sql`
      insert into ad_spend (day, channel, campaign, cost_cents, clicks, impressions, source)
      values (${body.day}, ${body.channel}, ${body.campaign ?? ''}, ${body.costCents as number},
              ${body.clicks ?? null}, ${body.impressions ?? null}, 'manual')
      on conflict (day, channel, campaign) do update set
        cost_cents  = excluded.cost_cents,
        clicks      = excluded.clicks,
        impressions = excluded.impressions,
        updated_at  = now()
    `;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Spend save failed:', error);
    return NextResponse.json({ error: 'Could not save the spend.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sql = requireDb();
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    await sql`delete from ad_spend where id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Could not delete.' }, { status: 500 });
  }
}
