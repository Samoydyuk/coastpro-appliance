import { NextRequest, NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'crypto';
import { requireDb } from '@/lib/db';
import { PRESENCE_CHANNEL_KEYS, upsertPlatformStats } from '@/lib/presence/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Where advertising statistics arrive.
 *
 * Built as a push endpoint rather than as a client that pulls from the ad
 * platforms, because pulling from Google Ads needs a developer token, a Cloud
 * project, an OAuth consent screen and an approval queue — while a Google Ads
 * Script running inside the account already has permission to read it, and can
 * post it here. The same door serves Meta and hand-uploaded CSVs.
 *
 * What lands here is what the platform says about itself. It is stored apart
 * from the first-party tables and never added to them: a platform's
 * "conversions" is its own attribution model's opinion, while a lead is
 * somebody who actually got in touch. Showing the two side by side is useful.
 * Summing them would be nonsense.
 */

const MAX_ROWS = 5_000;

/** Report grains we accept. Anything else is a typo or a new report nobody wired up. */
const LEVELS = new Set([
  'account',
  'campaign',
  'ad_group',
  'keyword',
  'search_term',
  'ad',
  'device',
  'geo',
  'hour',
  'day_of_week',
  'placement',
  'audience',
  // A whole listing or profile for a day. The unpaid surfaces have no campaign
  // to sit under, so this is the only grain they report at.
  'profile',
  'post',
]);

const CHANNELS = new Set([
  'google_ads',
  'google_lsa',
  'meta_ads',
  'bing_ads',
  'tiktok_ads',
  'yelp_ads',
  'nextdoor',
  // The unpaid side: map listings, directory pages and social profiles. Kept
  // apart from their advertising namesakes on purpose — `yelp_ads` is money
  // spent, `yelp_profile` is a page people found. Merging them would make the
  // free listing look like it had a budget.
  ...PRESENCE_CHANNEL_KEYS,
]);

const SOURCES = new Set([
  'google_ads_script',
  'meta_api',
  'manual_csv',
  'gbp_api',
  // Numbers copied out of a dashboard that has no API. Recorded as its own
  // source so the screen can say a figure was typed, not fetched.
  'manual_entry',
]);

interface IncomingRow {
  day?: string;
  channel?: string;
  level?: string;
  entityId?: string | number;
  entityName?: string;
  parentName?: string;
  segment?: string;
  impressions?: number;
  clicks?: number;
  costCents?: number;
  conversions?: number;
  conversionValueCents?: number;
  extra?: Record<string, unknown>;
}

function authorised(request: NextRequest): boolean {
  const expected = process.env.AD_STATS_INGEST_SECRET;
  if (!expected) return false;
  const provided =
    request.headers.get('x-coastpro-key') ?? request.nextUrl.searchParams.get('key') ?? '';
  // Hashed first so the comparison is over equal-length buffers whatever was
  // sent — comparing raw strings of different lengths returns early and leaks
  // the length.
  const a = createHash('sha256').update(provided).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

function text(value: unknown, max: number): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function whole(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

export async function POST(request: NextRequest) {
  if (!authorised(request)) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 401 });
  }

  let body: { source?: string; rows?: IncomingRow[]; dayFrom?: string; dayTo?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 });
  }

  const source = body.source ?? '';
  if (!SOURCES.has(source)) {
    return NextResponse.json({ error: `Unknown source: ${source}` }, { status: 400 });
  }

  const incoming = Array.isArray(body.rows) ? body.rows : [];
  if (incoming.length > MAX_ROWS) {
    return NextResponse.json(
      { error: `Too many rows in one batch (${incoming.length}); send at most ${MAX_ROWS}.` },
      { status: 413 }
    );
  }

  const sql = requireDb();
  const [run] = (await sql`
    insert into import_runs (source, day_from, day_to)
    values (${source}, ${body.dayFrom ?? null}, ${body.dayTo ?? null})
    returning id
  `) as unknown as { id: string }[];

  try {
    const rejected: string[] = [];
    const rows = incoming
      .map((row) => {
        const day = text(row.day, 10);
        const channel = text(row.channel, 40);
        const level = text(row.level, 30);

        if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) {
          rejected.push(`bad day: ${row.day}`);
          return null;
        }
        if (!channel || !CHANNELS.has(channel)) {
          rejected.push(`unknown channel: ${row.channel}`);
          return null;
        }
        if (!level || !LEVELS.has(level)) {
          rejected.push(`unknown level: ${row.level}`);
          return null;
        }

        return {
          day,
          channel,
          level,
          // Search terms and cities have no id of their own, so the value is
          // the identity. Capped because it sits in the primary key.
          entity_id: (text(row.entityId, 300) ?? '').slice(0, 300),
          entity_name: text(row.entityName, 300),
          parent_name: text(row.parentName, 300),
          segment: (text(row.segment, 120) ?? '').slice(0, 120),
          impressions: whole(row.impressions),
          clicks: whole(row.clicks),
          cost_cents: whole(row.costCents),
          conversions: Number.isFinite(Number(row.conversions)) ? Number(row.conversions) : 0,
          conversion_value_cents: whole(row.conversionValueCents),
          extra:
            row.extra && typeof row.extra === 'object'
              ? sql.json(row.extra as Record<string, never>)
              : null,
          source,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    if (rows.length) {
      // Re-sent days overwrite rather than accumulate: the importer deliberately
      // re-fetches a rolling window because the platforms restate recent figures
      // for a day or two after the fact.
      //
      // The insert itself lives in lib/presence/store so the scheduled
      // importers write through exactly the same conflict clause — that rule is
      // worth having in one place rather than in every caller that learned it.
      await upsertPlatformStats(sql, rows);

      // Campaign totals are mirrored into ad_spend, which is what every
      // existing screen already reads for cost per lead and return on spend.
      // Only the unsegmented campaign row, or the same money would be counted
      // once per device and again per city.
      //
      // Rebuilt from platform_stats for each day touched, rather than upserted
      // from what just arrived. ad_spend is keyed by campaign *name* while
      // platform_stats is keyed by the platform's campaign *id*, so renaming a
      // campaign in Google Ads leaves the old name behind as a second row and
      // silently doubles that day's spend. Rebuilding deletes whatever was
      // there and writes the current truth, which also makes the operation
      // independent of how the importer chose to batch.
      const touched = [
        ...new Set(
          rows
            .filter((row) => row.level === 'campaign' && row.segment === '')
            .map((row) => `${row.day}|${row.channel}`)
        ),
      ].map((key) => {
        const [day, channel] = key.split('|');
        return { day: day!, channel: channel! };
      });

      for (const { day, channel } of touched) {
        await sql`
          delete from ad_spend
          where day = ${day} and channel = ${channel} and source = ${source}
        `;
        await sql`
          insert into ad_spend (day, channel, campaign, cost_cents, clicks, impressions, source)
          select ps.day, ps.channel, coalesce(ps.entity_name, ps.entity_id),
                 ps.cost_cents, ps.clicks, ps.impressions, ps.source
          from platform_stats ps
          where ps.source = ${source} and ps.level = 'campaign' and ps.segment = ''
            and ps.day = ${day} and ps.channel = ${channel}
          on conflict (day, channel, campaign) do update set
            cost_cents  = excluded.cost_cents,
            clicks      = excluded.clicks,
            impressions = excluded.impressions,
            source      = excluded.source,
            updated_at  = now()
        `;
      }
    }

    const byLevel: Record<string, number> = {};
    rows.forEach((row) => {
      byLevel[row.level] = (byLevel[row.level] ?? 0) + 1;
    });

    await sql`
      update import_runs set
        finished_at = now(),
        status = 'ok',
        rows_written = ${rows.length},
        reports = ${sql.json({ byLevel, rejected: rejected.slice(0, 20), rejectedCount: rejected.length } as never)}
      where id = ${run!.id}
    `;

    return NextResponse.json({
      ok: true,
      written: rows.length,
      rejected: rejected.length,
      byLevel,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await sql`
      update import_runs set finished_at = now(), status = 'failed', error = ${message.slice(0, 900)}
      where id = ${run!.id}
    `;
    console.error('Ad stats ingest failed:', error);
    return NextResponse.json({ error: 'Could not store the statistics.' }, { status: 500 });
  }
}
