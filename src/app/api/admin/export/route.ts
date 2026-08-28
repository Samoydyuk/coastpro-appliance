import { NextRequest, NextResponse } from 'next/server';
import { parseRange } from '@/lib/admin/range';
import { getCalls, getChannels, getLeads, getSpend } from '@/lib/admin/queries';
import { toCsv } from '@/lib/admin/format';
import { channelLabel } from '@/lib/attribution';
import { requireAdmin } from '@/lib/admin-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * CSV export. Everything the console shows should be able to leave it — a
 * dashboard that traps its own numbers is a dashboard nobody checks against
 * their accounts.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;


  const params = request.nextUrl.searchParams;
  const range = parseRange({
    range: params.get('range') ?? undefined,
    from: params.get('from') ?? undefined,
    to: params.get('to') ?? undefined,
  });
  const type = params.get('type') ?? 'leads';

  try {
    let rows: Record<string, unknown>[] = [];
    let filename = `coastpro-${type}-${range.key}.csv`;

    if (type === 'leads') {
      const { rows: leads } = await getLeads(range, {
        status: params.get('status') ?? undefined,
        channel: params.get('channel') ?? undefined,
        search: params.get('q') ?? undefined,
        limit: 5000,
      });
      rows = leads.map((entry) => {
        const lead = entry as Record<string, unknown>;
        return {
          created_at: lead.created_at,
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          city: lead.city,
          zip: lead.zip,
          appliance: lead.appliance,
          source_form: lead.source_form,
          status: lead.status,
          value_usd: lead.value_cents ? Number(lead.value_cents) / 100 : '',
          first_touch_channel: channelLabel(lead.ft_channel as string),
          last_touch_channel: channelLabel(lead.lt_channel as string),
          campaign: lead.lt_campaign,
          keyword: lead.lt_term,
          landing_page: lead.lt_landing_path,
          device: lead.device,
          duplicate: lead.is_duplicate,
          seconds_to_decide: lead.time_to_lead_sec,
          problem: lead.problem ?? lead.message,
        };
      });
    } else if (type === 'channels') {
      const channels = await getChannels(range);
      rows = channels.map((row) => ({
        channel: channelLabel(row.channel),
        visits: row.sessions,
        leads: row.leads,
        calls: row.calls,
        booked: row.booked,
        won: row.won,
        spend_usd: row.spendCents / 100,
        revenue_usd: row.revenueCents / 100,
        cost_per_request:
          row.leads + row.calls ? (row.spendCents / 100 / (row.leads + row.calls)).toFixed(2) : '',
        roas: row.spendCents ? (row.revenueCents / row.spendCents).toFixed(2) : '',
      }));
    } else if (type === 'calls') {
      const calls = await getCalls(range);
      rows = calls.map((entry) => {
        const call = entry as Record<string, unknown>;
        return {
          started_at: call.started_at,
          from: call.caller_number,
          rang: call.tracking_number,
          channel: channelLabel(call.channel as string),
          answered: call.answered,
          seconds: call.duration_seconds,
          first_time: call.is_first_time,
          town: call.city,
        };
      });
    } else if (type === 'spend') {
      const spend = await getSpend(range);
      rows = spend.map((entry) => {
        const row = entry as Record<string, unknown>;
        return {
          day: row.day,
          channel: channelLabel(row.channel as string),
          campaign: row.campaign,
          cost_usd: Number(row.cost_cents ?? 0) / 100,
          clicks: row.clicks,
          impressions: row.impressions,
        };
      });
    } else {
      return NextResponse.json({ error: 'Unknown export type' }, { status: 400 });
    }

    filename = `coastpro-${type}-${new Date().toISOString().slice(0, 10)}.csv`;

    // The BOM is there so Excel opens it as UTF-8 instead of mangling every
    // accented town name.
    return new NextResponse(`﻿${toCsv(rows)}`, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export failed:', error);
    return NextResponse.json({ error: 'Could not build the export.' }, { status: 500 });
  }
}
