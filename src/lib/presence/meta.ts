import { writePresenceRows, lookbackWindow, type PresenceRow } from './store';
import type { ImportOutcome } from './gbp';
import type postgres from 'postgres';

/**
 * Instagram and Facebook, through the Graph API.
 *
 * One importer for both because they come from the same token and the same
 * call shape: a Page access token reaches the Page's insights, and the
 * Instagram professional account linked to that Page hangs off it.
 *
 * WHAT META CHANGES UNDER YOU. Insight metric names are deprecated on a
 * schedule and removed on another — `page_views_total` and several Instagram
 * lifetime metrics have already been through it. So every metric is read
 * defensively: a name that has gone returns nothing and lands as zero, rather
 * than taking the whole import down with it. When a column here goes flat and
 * stays flat, suspect the metric name before suspecting the business.
 *
 * The token is the other moving part. A long-lived Page token lasts about
 * sixty days unless it is refreshed; when it lapses the importer reports it
 * plainly instead of quietly recording zeroes, because a dead token and a
 * quiet month look identical in a chart.
 */

const GRAPH = 'https://graph.facebook.com/v21.0';

/** Daily, additive, and still current. Reach is people; impressions are views. */
const IG_DAY_METRICS = ['impressions', 'reach', 'profile_views', 'website_clicks'] as const;
const FB_DAY_METRICS = ['page_impressions', 'page_impressions_unique', 'page_views_total'] as const;

interface InsightValue {
  value?: number | Record<string, number>;
  end_time?: string;
}

interface InsightEntry {
  name?: string;
  values?: InsightValue[];
}

export function metaConfigured(): boolean {
  return Boolean(
    process.env.META_PAGE_TOKEN &&
      (process.env.META_PAGE_ID || process.env.META_IG_USER_ID)
  );
}

/** `end_time` is an ISO instant at the *end* of the day it describes. */
function dayFromEndTime(endTime: string | undefined): string | null {
  if (!endTime) return null;
  const date = new Date(endTime);
  if (Number.isNaN(date.getTime())) return null;
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function numeric(value: InsightValue['value']): number {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object') {
    return Object.values(value).reduce((sum, n) => sum + (Number(n) || 0), 0);
  }
  return 0;
}

/** Fold a Graph insights payload into `{ day: { metric: number } }`. */
function foldInsights(data: InsightEntry[]): Map<string, Record<string, number>> {
  const byDay = new Map<string, Record<string, number>>();
  for (const entry of data) {
    const name = entry.name;
    if (!name) continue;
    for (const point of entry.values ?? []) {
      const day = dayFromEndTime(point.end_time);
      if (!day) continue;
      const row = byDay.get(day) ?? {};
      row[name] = numeric(point.value);
      byDay.set(day, row);
    }
  }
  return byDay;
}

async function graphInsights(
  node: string,
  metrics: readonly string[],
  since: string,
  until: string,
  token: string
): Promise<InsightEntry[]> {
  const params = new URLSearchParams({
    metric: metrics.join(','),
    period: 'day',
    since,
    until,
    access_token: token,
  });
  const response = await fetch(`${GRAPH}/${node}/insights?${params}`);
  const body = (await response.json()) as {
    data?: InsightEntry[];
    error?: { message?: string; code?: number };
  };

  if (!response.ok) {
    // 190 is the whole family of token problems — expired, revoked, changed
    // password. Worth naming, because the fix is a person re-authorising and
    // no amount of retrying will do it.
    if (body.error?.code === 190) {
      throw new Error(`Meta token rejected (${body.error.message ?? 'code 190'}) — it needs re-issuing.`);
    }
    throw new Error(`Graph API ${response.status}: ${body.error?.message ?? 'unknown error'}`);
  }

  return body.data ?? [];
}

/** Followers are a running total, so they come from the node, not the series. */
async function followerCount(node: string, field: string, token: string): Promise<number | null> {
  try {
    const response = await fetch(`${GRAPH}/${node}?fields=${field}&access_token=${token}`);
    if (!response.ok) return null;
    const body = (await response.json()) as Record<string, unknown>;
    const value = Number(body[field]);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

export async function importMeta(sql: postgres.Sql, days?: number): Promise<ImportOutcome[]> {
  if (!metaConfigured()) {
    return [
      {
        ok: true,
        channel: 'instagram',
        rows: 0,
        skipped: 'No Meta credentials set — add META_PAGE_TOKEN plus META_IG_USER_ID and/or META_PAGE_ID.',
      },
    ];
  }

  const token = process.env.META_PAGE_TOKEN ?? '';
  const { from, to } = lookbackWindow(days);
  const outcomes: ImportOutcome[] = [];

  // Instagram
  const igUser = process.env.META_IG_USER_ID;
  if (igUser) {
    try {
      const data = await graphInsights(igUser, IG_DAY_METRICS, from, to, token);
      const followers = await followerCount(igUser, 'followers_count', token);
      const byDay = foldInsights(data);

      const rows: PresenceRow[] = [...byDay].map(([day, m]) => ({
        day,
        channel: 'instagram',
        entityId: igUser,
        entityName: 'Instagram',
        impressions: m.impressions ?? 0,
        clicks: m.website_clicks ?? 0,
        extra: {
          reach: m.reach ?? 0,
          profileViews: m.profile_views ?? 0,
          // Today's total stamped on every day in the window would be a lie on
          // all but one of them, so it is only written on the most recent day.
          followers: day === to && followers !== null ? followers : null,
        },
        source: 'meta_api',
      }));

      outcomes.push({
        ok: true,
        channel: 'instagram',
        rows: await writePresenceRows(sql, rows),
      });
    } catch (error) {
      outcomes.push({
        ok: false,
        channel: 'instagram',
        rows: 0,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Facebook Page
  const pageId = process.env.META_PAGE_ID;
  if (pageId) {
    try {
      const data = await graphInsights(pageId, FB_DAY_METRICS, from, to, token);
      const followers = await followerCount(pageId, 'followers_count', token);
      const byDay = foldInsights(data);

      const rows: PresenceRow[] = [...byDay].map(([day, m]) => ({
        day,
        channel: 'facebook',
        entityId: pageId,
        entityName: 'Facebook',
        impressions: m.page_impressions ?? 0,
        // The Page has no website-click metric of its own that survived the
        // deprecations; left at zero rather than filled with something close.
        clicks: 0,
        extra: {
          reach: m.page_impressions_unique ?? 0,
          profileViews: m.page_views_total ?? 0,
          followers: day === to && followers !== null ? followers : null,
        },
        source: 'meta_api',
      }));

      outcomes.push({
        ok: true,
        channel: 'facebook',
        rows: await writePresenceRows(sql, rows),
      });
    } catch (error) {
      outcomes.push({
        ok: false,
        channel: 'facebook',
        rows: 0,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return outcomes;
}
