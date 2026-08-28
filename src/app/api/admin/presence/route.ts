import { NextRequest, NextResponse } from 'next/server';
import { isDbConfigured, requireDb } from '@/lib/db';
import { presenceChannel, writePresenceRows } from '@/lib/presence/store';
import { importGoogleBusinessProfile } from '@/lib/presence/gbp';
import { importMeta } from '@/lib/presence/meta';
import { importSearchConsole } from '@/lib/presence/gsc';
import { requireAdmin } from '@/lib/admin-guard';
import {
  clearGoogleConnection,
  clearMetaConnection,
  clearSearchConsoleConnection,
} from '@/lib/presence/credentials';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Where the numbers that cannot be fetched are typed in.
 *
 * Yelp and Apple report only into their own dashboards, so somebody reads them
 * off a screen once a week and enters them here. That is not a shortcoming of
 * this console — it is what those platforms offer a single location — and the
 * screen says so rather than leaving the gap looking like a bug.
 *
 * Written as its own `manual_entry` source so a typed figure is never mistaken
 * for a fetched one. The same day sent twice overwrites, which is what you want
 * when the first entry had a digit wrong.
 *
 * POST also drives the two automated importers, so "refresh now" on the screen
 * does not have to wait for tomorrow's cron.
 */

const MAX_VALUE = 10_000_000;

function clamp(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(Math.round(n), MAX_VALUE);
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;


  let body: {
    action?: 'save' | 'refresh' | 'disconnect';
    day?: string;
    channel?: string;
    provider?: string;
    measures?: Record<string, unknown>;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 });
  }

  if (!isDbConfigured) {
    return NextResponse.json(
      { error: 'Database not connected yet — nothing to save into.' },
      { status: 503 }
    );
  }

  const sql = requireDb();

  // Forgetting an account is deliberately a separate action from replacing one.
  // Reconnecting overwrites; this is for handing the listing to somebody else.
  if (body.action === 'disconnect') {
    if (body.provider === 'google') await clearGoogleConnection();
    else if (body.provider === 'meta') await clearMetaConnection();
    else if (body.provider === 'search-console') await clearSearchConsoleConnection();
    else return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  // Pull whatever can be pulled, on demand.
  if (body.action === 'refresh') {
    try {
      const gbp = await importGoogleBusinessProfile(sql);
      const meta = await importMeta(sql);
      const search = await importSearchConsole(sql);
      return NextResponse.json({ ok: true, outcomes: [gbp, ...meta, search] });
    } catch (error) {
      console.error('Presence refresh failed:', error);
      return NextResponse.json({ error: 'Refresh failed' }, { status: 500 });
    }
  }

  const channel = presenceChannel(body.channel ?? '');
  if (!channel) {
    return NextResponse.json({ error: 'Unknown channel' }, { status: 400 });
  }
  if (channel.automated) {
    return NextResponse.json(
      { error: `${channel.name} is fetched automatically — entering it by hand would be overwritten on the next run.` },
      { status: 400 }
    );
  }

  const day = String(body.day ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return NextResponse.json({ error: 'Give the day as YYYY-MM-DD' }, { status: 400 });
  }
  // A dashboard cannot report tomorrow, so a future date is a typo.
  if (day > new Date().toISOString().slice(0, 10)) {
    return NextResponse.json({ error: 'That day has not happened yet' }, { status: 400 });
  }

  const measures = body.measures ?? {};
  const extra: Record<string, number> = {};
  let impressions = 0;
  let clicks = 0;

  for (const measure of channel.measures) {
    const value = clamp(measures[measure.key]);
    if (measure.key === 'impressions') impressions = value;
    else if (measure.key === 'clicks') clicks = value;
    else extra[measure.key] = value;
  }

  try {
    await writePresenceRows(sql, [
      {
        day,
        channel: channel.key,
        entityId: '',
        entityName: channel.name,
        impressions,
        clicks,
        extra,
        source: 'manual_entry',
      },
    ]);
    return NextResponse.json({ ok: true, day, channel: channel.key });
  } catch (error) {
    console.error('Presence save failed:', error);
    return NextResponse.json({ error: 'Could not save' }, { status: 500 });
  }
}
