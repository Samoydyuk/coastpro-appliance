import { NextRequest, NextResponse } from 'next/server';
import { requireDb } from '@/lib/db';
import { flushConversionQueue, queueWonConversion } from '@/lib/conversions';
import { clientIp, hashIp } from '@/lib/tracking';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STATUSES = ['new', 'contacted', 'booked', 'won', 'lost', 'spam'];

/**
 * Updating a lead's outcome. The only write path in the console, and the only
 * place a human judgement enters the data.
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sql = requireDb();
    const body = (await request.json()) as {
      status?: string;
      valueCents?: number | null;
      notes?: string | null;
      lostReason?: string | null;
    };

    if (body.status && !STATUSES.includes(body.status)) {
      return NextResponse.json({ error: 'Unknown status' }, { status: 400 });
    }
    if (
      body.valueCents !== undefined &&
      body.valueCents !== null &&
      (!Number.isFinite(body.valueCents) || body.valueCents < 0 || body.valueCents > 100_000_00)
    ) {
      return NextResponse.json({ error: 'Value looks wrong' }, { status: 400 });
    }

    // Every placeholder carries an explicit cast. A bare null parameter has no
    // type Postgres can infer inside a CASE, and the whole statement is
    // rejected with "could not determine data type" rather than doing something
    // subtly wrong — which at least fails loudly, but only once.
    const status = body.status ?? null;
    const setsValue = body.valueCents !== undefined;
    const setsNotes = body.notes !== undefined;

    const [updated] = (await sql`
      update leads set
        status      = coalesce(${status}::text, status),
        value_cents = case when ${setsValue}::boolean
                           then ${body.valueCents ?? null}::int
                           else value_cents end,
        notes       = case when ${setsNotes}::boolean
                           then ${body.notes ?? null}::text
                           else notes end,
        lost_reason = coalesce(${body.lostReason ?? null}::text, lost_reason),
        won_at      = case
                        when ${status}::text = 'won'   then coalesce(won_at, now())
                        when ${status}::text is not null then null
                        else won_at
                      end,
        booked_at   = case
                        when ${status}::text = 'booked' then coalesce(booked_at, now())
                        else booked_at
                      end,
        updated_at  = now()
      where id = ${params.id}::uuid
      returning id, status, value_cents
    `) as unknown as { id: string; status: string; value_cents: number | null }[];

    if (!updated) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    await sql`
      insert into admin_audit (action, entity, entity_id, detail, ip_hash)
      values ('lead_update', 'lead', ${params.id},
              ${sql.json(body as Record<string, never>)},
              ${hashIp(clientIp(request.headers))})
    `;

    // A won job is the signal the ad platforms are missing. Queued and pushed
    // straight away — waiting for a nightly job would mean the bidding learns a
    // day late, every day.
    if (updated.status === 'won') {
      await queueWonConversion(params.id);
      flushConversionQueue(5).catch((error) =>
        console.error('Conversion flush failed:', error)
      );
    }

    return NextResponse.json({ ok: true, lead: updated });
  } catch (error) {
    console.error('Lead update failed:', error);
    return NextResponse.json({ error: 'Could not save the change.' }, { status: 500 });
  }
}
