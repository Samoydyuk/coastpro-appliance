import { requireDb } from '@/lib/db';
import { TZ } from '@/lib/admin/range';
import type { DateRange } from '@/lib/admin/range';

/**
 * Every number the admin panel shows is computed here.
 *
 * Conventions that hold throughout:
 *  - Bots are excluded from anything a human is supposed to have done. They are
 *    counted only on the traffic-quality screen, which is where they belong.
 *  - Counts are cast to int in SQL. Postgres returns bigint as a string, and a
 *    string that looks like a number will silently concatenate instead of add.
 *  - Day buckets are cut in the shop's timezone, not UTC.
 */

/**
 * A customer: not a bot, and not us.
 *
 * `is_internal` was added after thirty days in which the console reported the
 * owner's own visits as an audience — 72 of 88 direct visits, at an engagement
 * rate no cold visitor produces, burying the sixteen real external ones.
 *
 * Kept as one constant so a screen cannot quietly forget half of it. The
 * traffic-quality screen is the one place both are counted deliberately, and it
 * spells out what it is counting.
 */
const HUMAN = `coalesce(is_bot, false) = false and coalesce(is_internal, false) = false and coalesce(is_internal, false) = false`;

export interface Totals {
  sessions: number;
  visitors: number;
  newVisitors: number;
  pageviews: number;
  engagedSessions: number;
  leads: number;
  qualityLeads: number;
  calls: number;
  answeredCalls: number;
  booked: number;
  won: number;
  revenueCents: number;
  spendCents: number;
}

async function totalsBetween(from: Date, to: Date): Promise<Totals> {
  const sql = requireDb();

  const [traffic] = (await sql`
    select
      count(*)::int                                             as sessions,
      count(distinct visitor_id)::int                           as visitors,
      count(*) filter (
        where engaged_seconds >= 15 or pageviews >= 2 or converted
      )::int                                                    as engaged_sessions,
      coalesce(sum(pageviews), 0)::int                          as pageviews
    from sessions
    where started_at >= ${from} and started_at < ${to}
      and ${sql.unsafe(HUMAN)}
  `) as unknown as Record<string, number>[];

  const [newVisitors] = (await sql`
    select count(*)::int as new_visitors
    from visitors
    where first_seen_at >= ${from} and first_seen_at < ${to}
      and coalesce(is_bot, false) = false and coalesce(is_internal, false) = false
  `) as unknown as { new_visitors: number }[];

  const [leads] = (await sql`
    select
      count(*)::int                                              as leads,
      count(*) filter (where is_duplicate = false
                         and status <> 'spam')::int              as quality_leads,
      count(*) filter (where booked_at is not null)::int         as booked,
      count(*) filter (where status = 'won')::int                as won,
      coalesce(sum(value_cents) filter (where status = 'won'), 0)::int as revenue_cents
    from leads
    where created_at >= ${from} and created_at < ${to}
  `) as unknown as Record<string, number>[];

  const [calls] = (await sql`
    select
      count(*)::int                                    as calls,
      count(*) filter (where answered)::int            as answered_calls
    from calls
    where started_at >= ${from} and started_at < ${to}
  `) as unknown as Record<string, number>[];

  const [spend] = (await sql`
    select coalesce(sum(cost_cents), 0)::int as spend_cents
    from ad_spend
    where day >= ${from} and day < ${to}
  `) as unknown as { spend_cents: number }[];

  return {
    sessions: traffic?.sessions ?? 0,
    visitors: traffic?.visitors ?? 0,
    newVisitors: newVisitors?.new_visitors ?? 0,
    pageviews: traffic?.pageviews ?? 0,
    engagedSessions: traffic?.engaged_sessions ?? 0,
    leads: leads?.leads ?? 0,
    qualityLeads: leads?.quality_leads ?? 0,
    calls: calls?.calls ?? 0,
    answeredCalls: calls?.answered_calls ?? 0,
    booked: leads?.booked ?? 0,
    won: leads?.won ?? 0,
    revenueCents: leads?.revenue_cents ?? 0,
    spendCents: spend?.spend_cents ?? 0,
  };
}

export async function getOverview(range: DateRange) {
  const [current, previous] = await Promise.all([
    totalsBetween(range.from, range.to),
    totalsBetween(range.previousFrom, range.previousTo),
  ]);
  return { current, previous };
}

export interface DayPoint {
  day: string;
  sessions: number;
  leads: number;
  calls: number;
  spendCents: number;
  revenueCents: number;
}

export async function getDailySeries(range: DateRange): Promise<DayPoint[]> {
  const sql = requireDb();
  const rows = (await sql`
    with days as (
      select generate_series(
        date_trunc('day', ${range.from}::timestamptz at time zone ${TZ}),
        date_trunc('day', ${range.to}::timestamptz at time zone ${TZ}),
        interval '1 day'
      )::date as day
    ),
    traffic as (
      select (started_at at time zone ${TZ})::date as day, count(*)::int as sessions
      from sessions
      where started_at >= ${range.from} and started_at < ${range.to}
        and coalesce(is_bot, false) = false and coalesce(is_internal, false) = false
      group by 1
    ),
    lead_rows as (
      select (created_at at time zone ${TZ})::date as day,
             count(*)::int as leads,
             coalesce(sum(value_cents) filter (where status = 'won'), 0)::int as revenue_cents
      from leads
      where created_at >= ${range.from} and created_at < ${range.to}
      group by 1
    ),
    call_rows as (
      select (started_at at time zone ${TZ})::date as day, count(*)::int as calls
      from calls
      where started_at >= ${range.from} and started_at < ${range.to}
      group by 1
    ),
    spend_rows as (
      select day, coalesce(sum(cost_cents), 0)::int as spend_cents
      from ad_spend
      where day >= ${range.from} and day < ${range.to}
      group by 1
    )
    select
      to_char(days.day, 'YYYY-MM-DD')            as day,
      coalesce(traffic.sessions, 0)              as sessions,
      coalesce(lead_rows.leads, 0)               as leads,
      coalesce(call_rows.calls, 0)               as calls,
      coalesce(spend_rows.spend_cents, 0)        as spend_cents,
      coalesce(lead_rows.revenue_cents, 0)       as revenue_cents
    from days
    left join traffic     on traffic.day     = days.day
    left join lead_rows   on lead_rows.day   = days.day
    left join call_rows   on call_rows.day   = days.day
    left join spend_rows  on spend_rows.day  = days.day
    order by days.day
  `) as unknown as Record<string, string | number>[];

  return rows.map((row) => ({
    day: String(row.day),
    sessions: Number(row.sessions),
    leads: Number(row.leads),
    calls: Number(row.calls),
    spendCents: Number(row.spend_cents),
    revenueCents: Number(row.revenue_cents),
  }));
}

export interface ChannelRow {
  channel: string;
  sessions: number;
  leads: number;
  calls: number;
  booked: number;
  won: number;
  revenueCents: number;
  spendCents: number;
  duplicates: number;
  spam: number;
}

/**
 * Per-channel performance, joining three sources that each know a different
 * part of the story: sessions know traffic, leads know intent, spend knows what
 * it cost. `full outer join` because a channel can legitimately appear in only
 * one of them — money spent with nothing to show for it is exactly the row
 * nobody should be able to hide from.
 */
export async function getChannels(range: DateRange, attribution: 'last' | 'first' = 'last') {
  const sql = requireDb();
  const channelColumn = attribution === 'first' ? sql`ft_channel` : sql`lt_channel`;

  const rows = (await sql`
    with traffic as (
      select coalesce(channel, 'unknown') as channel, count(*)::int as sessions
      from sessions
      where started_at >= ${range.from} and started_at < ${range.to}
        and coalesce(is_bot, false) = false and coalesce(is_internal, false) = false
      group by 1
    ),
    lead_rows as (
      select coalesce(${channelColumn}, 'unknown') as channel,
             count(*)::int as leads,
             count(*) filter (where is_duplicate)::int as duplicates,
             count(*) filter (where status = 'spam')::int as spam,
             count(*) filter (where booked_at is not null)::int as booked,
             count(*) filter (where status = 'won')::int as won,
             coalesce(sum(value_cents) filter (where status = 'won'), 0)::int as revenue_cents
      from leads
      where created_at >= ${range.from} and created_at < ${range.to}
      group by 1
    ),
    call_rows as (
      select coalesce(channel, 'unknown') as channel, count(*)::int as calls
      from calls
      where started_at >= ${range.from} and started_at < ${range.to}
      group by 1
    ),
    spend_rows as (
      select channel, coalesce(sum(cost_cents), 0)::int as spend_cents
      from ad_spend
      where day >= ${range.from} and day < ${range.to}
      group by 1
    ),
    keys as (
      select channel from traffic
      union select channel from lead_rows
      union select channel from call_rows
      union select channel from spend_rows
    )
    select
      keys.channel,
      coalesce(traffic.sessions, 0)          as sessions,
      coalesce(lead_rows.leads, 0)           as leads,
      coalesce(lead_rows.duplicates, 0)      as duplicates,
      coalesce(lead_rows.spam, 0)            as spam,
      coalesce(lead_rows.booked, 0)          as booked,
      coalesce(lead_rows.won, 0)             as won,
      coalesce(lead_rows.revenue_cents, 0)   as revenue_cents,
      coalesce(call_rows.calls, 0)           as calls,
      coalesce(spend_rows.spend_cents, 0)    as spend_cents
    from keys
    left join traffic    on traffic.channel    = keys.channel
    left join lead_rows  on lead_rows.channel  = keys.channel
    left join call_rows  on call_rows.channel  = keys.channel
    left join spend_rows on spend_rows.channel = keys.channel
    order by coalesce(spend_rows.spend_cents, 0) desc,
             coalesce(lead_rows.leads, 0) desc,
             coalesce(traffic.sessions, 0) desc
  `) as unknown as Record<string, string | number>[];

  return rows.map<ChannelRow>((row) => ({
    channel: String(row.channel),
    sessions: Number(row.sessions),
    leads: Number(row.leads),
    calls: Number(row.calls),
    booked: Number(row.booked),
    won: Number(row.won),
    revenueCents: Number(row.revenue_cents),
    spendCents: Number(row.spend_cents),
    duplicates: Number(row.duplicates),
    spam: Number(row.spam),
  }));
}

export interface CampaignRow extends ChannelRow {
  campaign: string;
  content: string | null;
  term: string | null;
}

export async function getCampaigns(range: DateRange, groupBy: 'campaign' | 'content' | 'term' = 'campaign') {
  const sql = requireDb();
  const dimension =
    groupBy === 'content' ? sql`lt_content` : groupBy === 'term' ? sql`lt_term` : sql`lt_campaign`;
  const sessionDimension =
    groupBy === 'content' ? sql`content` : groupBy === 'term' ? sql`term` : sql`campaign`;

  const rows = (await sql`
    with traffic as (
      select coalesce(channel, 'unknown') as channel,
             coalesce(${sessionDimension}, '(not set)') as label,
             count(*)::int as sessions
      from sessions
      where started_at >= ${range.from} and started_at < ${range.to}
        and coalesce(is_bot, false) = false and coalesce(is_internal, false) = false
      group by 1, 2
    ),
    lead_rows as (
      select coalesce(lt_channel, 'unknown') as channel,
             coalesce(${dimension}, '(not set)') as label,
             count(*)::int as leads,
             count(*) filter (where booked_at is not null)::int as booked,
             count(*) filter (where status = 'won')::int as won,
             coalesce(sum(value_cents) filter (where status = 'won'), 0)::int as revenue_cents
      from leads
      where created_at >= ${range.from} and created_at < ${range.to}
      group by 1, 2
    ),
    spend_rows as (
      select channel, coalesce(nullif(campaign, ''), '(not set)') as label,
             coalesce(sum(cost_cents), 0)::int as spend_cents
      from ad_spend
      where day >= ${range.from} and day < ${range.to}
      group by 1, 2
    ),
    keys as (
      select channel, label from traffic
      union select channel, label from lead_rows
      union select channel, label from spend_rows
    )
    select keys.channel, keys.label,
      coalesce(traffic.sessions, 0)        as sessions,
      coalesce(lead_rows.leads, 0)         as leads,
      coalesce(lead_rows.booked, 0)        as booked,
      coalesce(lead_rows.won, 0)           as won,
      coalesce(lead_rows.revenue_cents, 0) as revenue_cents,
      coalesce(spend_rows.spend_cents, 0)  as spend_cents
    from keys
    left join traffic    on traffic.channel = keys.channel and traffic.label = keys.label
    left join lead_rows  on lead_rows.channel = keys.channel and lead_rows.label = keys.label
    left join spend_rows on spend_rows.channel = keys.channel and spend_rows.label = keys.label
    order by coalesce(spend_rows.spend_cents, 0) desc, coalesce(lead_rows.leads, 0) desc
    limit 100
  `) as unknown as Record<string, string | number>[];

  return rows.map((row) => ({
    channel: String(row.channel),
    label: String(row.label),
    sessions: Number(row.sessions),
    leads: Number(row.leads),
    booked: Number(row.booked),
    won: Number(row.won),
    revenueCents: Number(row.revenue_cents),
    spendCents: Number(row.spend_cents),
  }));
}

export interface FunnelStage {
  key: string;
  label: string;
  value: number;
  note: string;
}

/**
 * The funnel, measured in sessions rather than events, so a visitor who clicks
 * the phone number four times counts once.
 */
export async function getFunnel(range: DateRange): Promise<FunnelStage[]> {
  const sql = requireDb();

  const [row] = (await sql`
    with visits as (
      select id, engaged_seconds, pageviews, converted
      from sessions
      where started_at >= ${range.from} and started_at < ${range.to}
        and coalesce(is_bot, false) = false and coalesce(is_internal, false) = false
    ),
    acts as (
      select session_id,
             bool_or(type = 'form_start')     as started_form,
             bool_or(type = 'click_phone')    as clicked_phone,
             bool_or(type = 'form_submit')    as submitted,
             bool_or(type = 'calendly_view')  as saw_calendar
      from events
      where ts >= ${range.from} and ts < ${range.to}
      group by session_id
    )
    select
      count(*)::int                                                            as visits,
      count(*) filter (where v.engaged_seconds >= 15 or v.pageviews >= 2)::int as engaged,
      count(*) filter (where a.started_form or a.clicked_phone)::int           as intent,
      count(*) filter (where a.saw_calendar)::int                              as reached_calendar,
      count(*) filter (where a.submitted or a.clicked_phone)::int              as asked
    from visits v
    left join acts a on a.session_id = v.id
  `) as unknown as Record<string, number>[];

  const [outcomes] = (await sql`
    select
      count(*) filter (where booked_at is not null)::int as booked,
      count(*) filter (where status = 'won')::int        as won
    from leads
    where created_at >= ${range.from} and created_at < ${range.to}
  `) as unknown as Record<string, number>[];

  return [
    { key: 'visits', label: 'Visits', value: row?.visits ?? 0, note: 'Real people, bots removed' },
    { key: 'engaged', label: 'Engaged', value: row?.engaged ?? 0, note: '15s+ on site, or a second page' },
    { key: 'intent', label: 'Showed intent', value: row?.intent ?? 0, note: 'Started a form or tapped the number' },
    { key: 'asked', label: 'Asked for service', value: row?.asked ?? 0, note: 'Submitted a form or called' },
    { key: 'booked', label: 'Booked a visit', value: outcomes?.booked ?? 0, note: 'Appointment on the calendar' },
    { key: 'won', label: 'Paid job', value: outcomes?.won ?? 0, note: 'Marked won in the lead inbox' },
  ];
}

/**
 * What went wrong on the way through the funnel: which field people stopped on,
 * what the form complained about, and where they clicked something that was not
 * clickable.
 */
export async function getFunnelDetail(range: DateRange) {
  const sql = requireDb();

  const lastField = (await sql`
    with touched as (
      select distinct on (session_id) session_id, label, ts
      from events
      where ts >= ${range.from} and ts < ${range.to} and type = 'form_field'
      order by session_id, ts desc
    )
    select t.label, count(*)::int as abandoned
    from touched t
    where not exists (
      select 1 from events e
      where e.session_id = t.session_id and e.type = 'form_submit' and e.ts >= t.ts
    )
    group by 1 order by abandoned desc limit 15
  `) as unknown as { label: string; abandoned: number }[];

  const errors = (await sql`
    select coalesce(label, 'unknown') as label, count(*)::int as total
    from events
    where ts >= ${range.from} and ts < ${range.to} and type = 'form_error'
    group by 1 order by total desc limit 15
  `) as unknown as { label: string; total: number }[];

  const friction = (await sql`
    select type, coalesce(path, '(unknown)') as path, count(*)::int as total
    from events
    where ts >= ${range.from} and ts < ${range.to} and type in ('rage_click', 'js_error')
    group by 1, 2 order by total desc limit 15
  `) as unknown as { type: string; path: string; total: number }[];

  const [speed] = (await sql`
    select
      round(percentile_cont(0.5) within group (order by time_to_lead_sec))::int as median_seconds,
      count(*)::int as measured
    from leads
    where created_at >= ${range.from} and created_at < ${range.to}
      and time_to_lead_sec is not null
  `) as unknown as { median_seconds: number | null; measured: number }[];

  return {
    lastField: lastField.map((row) => ({ label: row.label, abandoned: Number(row.abandoned) })),
    errors: errors.map((row) => ({ label: row.label, total: Number(row.total) })),
    friction: friction.map((row) => ({ type: row.type, path: row.path, total: Number(row.total) })),
    medianTimeToLead: speed?.median_seconds ?? null,
    measuredLeads: speed?.measured ?? 0,
  };
}

export async function getPages(range: DateRange) {
  const sql = requireDb();

  const landing = (await sql`
    select
      coalesce(landing_path, '/')                                        as path,
      count(*)::int                                                      as sessions,
      count(*) filter (where converted)::int                             as conversions,
      count(*) filter (where pageviews <= 1 and engaged_seconds < 10)::int as bounces,
      coalesce(round(avg(engaged_seconds)), 0)::int                      as avg_seconds,
      coalesce(round(avg(max_scroll)), 0)::int                           as avg_scroll
    from sessions
    where started_at >= ${range.from} and started_at < ${range.to}
      and coalesce(is_bot, false) = false and coalesce(is_internal, false) = false
    group by 1
    order by sessions desc
    limit 50
  `) as unknown as Record<string, number | string>[];

  const viewed = (await sql`
    select
      coalesce(e.path, '/')                    as path,
      count(*)::int                            as views,
      count(distinct e.session_id)::int        as sessions
    from events e
    join sessions s on s.id = e.session_id and coalesce(s.is_bot, false) = false and coalesce(s.is_internal, false) = false
    where e.ts >= ${range.from} and e.ts < ${range.to} and e.type = 'pageview'
    group by 1
    order by views desc
    limit 50
  `) as unknown as Record<string, number | string>[];

  return {
    landing: landing.map((row) => ({
      path: String(row.path),
      sessions: Number(row.sessions),
      conversions: Number(row.conversions),
      bounces: Number(row.bounces),
      avgSeconds: Number(row.avg_seconds),
      avgScroll: Number(row.avg_scroll),
    })),
    viewed: viewed.map((row) => ({
      path: String(row.path),
      views: Number(row.views),
      sessions: Number(row.sessions),
    })),
  };
}

export async function getGeo(range: DateRange) {
  const sql = requireDb();

  const cities = (await sql`
    select
      coalesce(nullif(s.city, ''), 'Unknown') as city,
      coalesce(s.region, '')                  as region,
      count(*)::int                           as sessions,
      count(*) filter (where s.converted)::int as conversions
    from sessions s
    where s.started_at >= ${range.from} and s.started_at < ${range.to}
      and coalesce(s.is_bot, false) = false and coalesce(s.is_internal, false) = false
    group by 1, 2
    order by sessions desc
    limit 40
  `) as unknown as Record<string, number | string>[];

  const zips = (await sql`
    select
      coalesce(nullif(zip, ''), 'Not given')                  as zip,
      coalesce(nullif(city, ''), '')                          as city,
      count(*)::int                                           as leads,
      count(*) filter (where status = 'won')::int             as won,
      coalesce(sum(value_cents) filter (where status = 'won'), 0)::int as revenue_cents
    from leads
    where created_at >= ${range.from} and created_at < ${range.to}
    group by 1, 2
    order by leads desc
    limit 40
  `) as unknown as Record<string, number | string>[];

  // The same visits again, but keyed by where they actually were rather than
  // by what the town is called. Two rows for one town — the edge sometimes
  // resolves a neighbouring suburb — would be two dots a millimetre apart, so
  // they are grouped by name and given the coordinates of the largest.
  const points = (await sql`
    select
      coalesce(nullif(s.city, ''), 'Unknown')  as city,
      coalesce(s.region, '')                   as region,
      coalesce(s.country, '')                  as country,
      avg(s.latitude)::float                   as lat,
      avg(s.longitude)::float                  as lng,
      count(*)::int                            as sessions,
      count(*) filter (where s.converted)::int as conversions
    from sessions s
    where s.started_at >= ${range.from} and s.started_at < ${range.to}
      and coalesce(s.is_bot, false) = false and coalesce(s.is_internal, false) = false
      and s.latitude is not null and s.longitude is not null
    group by 1, 2, 3
    order by sessions desc
    limit 300
  `) as unknown as Record<string, number | string>[];

  return {
    cities: cities.map((row) => ({
      city: String(row.city),
      region: String(row.region),
      sessions: Number(row.sessions),
      conversions: Number(row.conversions),
    })),
    points: points.map((row) => ({
      city: String(row.city),
      region: String(row.region),
      country: String(row.country),
      lat: Number(row.lat),
      lng: Number(row.lng),
      sessions: Number(row.sessions),
      conversions: Number(row.conversions),
    })),
    zips: zips.map((row) => ({
      zip: String(row.zip),
      city: String(row.city),
      leads: Number(row.leads),
      won: Number(row.won),
      revenueCents: Number(row.revenue_cents),
    })),
  };
}

/**
 * When people ask for service, by weekday and hour. Ad platforms let you bid
 * differently by hour, and this is the only evidence for how to set that.
 */
export async function getHourHeatmap(range: DateRange) {
  const sql = requireDb();
  const rows = (await sql`
    select
      extract(dow  from moment at time zone ${TZ})::int as dow,
      extract(hour from moment at time zone ${TZ})::int as hour,
      count(*)::int                                     as total
    from (
      select created_at as moment from leads
      where created_at >= ${range.from} and created_at < ${range.to}
      union all
      select started_at as moment from calls
      where started_at >= ${range.from} and started_at < ${range.to}
    ) all_requests
    group by 1, 2
  `) as unknown as { dow: number; hour: number; total: number }[];

  return rows.map((row) => ({ dow: Number(row.dow), hour: Number(row.hour), total: Number(row.total) }));
}

export async function getDevices(range: DateRange) {
  const sql = requireDb();
  const rows = (await sql`
    select
      coalesce(device, 'unknown')              as device,
      coalesce(browser, 'unknown')             as browser,
      count(*)::int                            as sessions,
      count(*) filter (where converted)::int   as conversions
    from sessions
    where started_at >= ${range.from} and started_at < ${range.to}
      and coalesce(is_bot, false) = false and coalesce(is_internal, false) = false
    group by 1, 2
    order by sessions desc
    limit 30
  `) as unknown as Record<string, number | string>[];

  return rows.map((row) => ({
    device: String(row.device),
    browser: String(row.browser),
    sessions: Number(row.sessions),
    conversions: Number(row.conversions),
  }));
}

export async function getQuality(range: DateRange) {
  const sql = requireDb();

  const [sessions] = (await sql`
    select
      count(*)::int                                  as total,
      count(*) filter (where is_bot)::int            as bots,
      count(*) filter (where is_internal)::int       as internal,
      count(*) filter (where coalesce(is_bot, false) = false
                         and pageviews <= 1
                         and engaged_seconds < 5)::int as bounced_instantly
    from sessions
    where started_at >= ${range.from} and started_at < ${range.to}
  `) as unknown as Record<string, number>[];

  const botReasons = (await sql`
    select coalesce(bot_reason, 'unknown') as reason, count(*)::int as total
    from sessions
    where started_at >= ${range.from} and started_at < ${range.to} and is_bot
    group by 1 order by total desc limit 15
  `) as unknown as { reason: string; total: number }[];

  const leadQuality = (await sql`
    select
      coalesce(lt_channel, 'unknown')                          as channel,
      count(*)::int                                            as leads,
      count(*) filter (where is_duplicate)::int                as duplicates,
      count(*) filter (where status = 'spam')::int             as spam,
      count(*) filter (where status = 'lost')::int             as lost,
      count(*) filter (where email_delivered = false)::int     as undelivered
    from leads
    where created_at >= ${range.from} and created_at < ${range.to}
    group by 1 order by leads desc
  `) as unknown as Record<string, number | string>[];

  const shortCalls = (await sql`
    select
      coalesce(channel, 'unknown')                               as channel,
      count(*)::int                                              as calls,
      count(*) filter (where not answered)::int                   as missed,
      count(*) filter (where answered and duration_seconds < 30)::int as too_short
    from calls
    where started_at >= ${range.from} and started_at < ${range.to}
    group by 1 order by calls desc
  `) as unknown as Record<string, number | string>[];

  return {
    sessions: {
      total: sessions?.total ?? 0,
      bots: sessions?.bots ?? 0,
      bouncedInstantly: sessions?.bounced_instantly ?? 0,
      internal: sessions.internal,
    },
    botReasons: botReasons.map((row) => ({ reason: row.reason, total: Number(row.total) })),
    leadQuality: leadQuality.map((row) => ({
      channel: String(row.channel),
      leads: Number(row.leads),
      duplicates: Number(row.duplicates),
      spam: Number(row.spam),
      lost: Number(row.lost),
      undelivered: Number(row.undelivered),
    })),
    calls: shortCalls.map((row) => ({
      channel: String(row.channel),
      calls: Number(row.calls),
      missed: Number(row.missed),
      tooShort: Number(row.too_short),
    })),
  };
}

/** 75th percentile per metric — the figure Google itself scores a page on. */
export async function getVitals(range: DateRange) {
  const sql = requireDb();

  const overall = (await sql`
    select metric,
           round(percentile_cont(0.75) within group (order by value)::numeric, 3) as p75,
           count(*)::int as samples,
           count(*) filter (where rating = 'good')::int as good
    from web_vitals
    where ts >= ${range.from} and ts < ${range.to}
    group by 1
  `) as unknown as { metric: string; p75: string; samples: number; good: number }[];

  const byPage = (await sql`
    select path, metric,
           round(percentile_cont(0.75) within group (order by value)::numeric, 3) as p75,
           count(*)::int as samples
    from web_vitals
    where ts >= ${range.from} and ts < ${range.to} and metric in ('LCP', 'INP', 'CLS')
    group by 1, 2
    having count(*) >= 3
    order by path
    limit 90
  `) as unknown as { path: string; metric: string; p75: string; samples: number }[];

  return {
    overall: overall.map((row) => ({
      metric: row.metric,
      p75: Number(row.p75),
      samples: Number(row.samples),
      good: Number(row.good),
    })),
    byPage: byPage.map((row) => ({
      path: row.path,
      metric: row.metric,
      p75: Number(row.p75),
      samples: Number(row.samples),
    })),
  };
}

export async function getLive() {
  const sql = requireDb();

  const sessions = (await sql`
    select s.id, s.visitor_id, s.channel, s.campaign, s.city, s.region, s.device,
           s.landing_path, s.pageviews, s.started_at, s.last_seen_at, s.converted,
           (select e.path from events e
             where e.session_id = s.id and e.type = 'pageview'
             order by e.ts desc limit 1) as current_path
    from sessions s
    where s.last_seen_at > now() - interval '5 minutes'
      and coalesce(s.is_bot, false) = false and coalesce(s.is_internal, false) = false
    order by s.last_seen_at desc
    limit 50
  `) as unknown as Record<string, unknown>[];

  const recent = (await sql`
    select e.type, e.label, e.path, e.ts, s.channel, s.city
    from events e
    join sessions s on s.id = e.session_id
    where e.ts > now() - interval '60 minutes'
      and coalesce(s.is_bot, false) = false and coalesce(s.is_internal, false) = false
      and e.type in ('click_phone', 'form_submit', 'form_start', 'calendly_booked', 'rage_click', 'js_error')
    order by e.ts desc
    limit 30
  `) as unknown as Record<string, unknown>[];

  const [today] = (await sql`
    select
      (select count(*)::int from sessions
        where started_at >= date_trunc('day', now() at time zone ${TZ}) at time zone ${TZ}
          and coalesce(is_bot, false) = false and coalesce(is_internal, false) = false)                        as sessions,
      (select count(*)::int from leads
        where created_at >= date_trunc('day', now() at time zone ${TZ}) at time zone ${TZ}) as leads,
      (select count(*)::int from calls
        where started_at >= date_trunc('day', now() at time zone ${TZ}) at time zone ${TZ}) as calls
  `) as unknown as Record<string, number>[];

  return { sessions, recent, today: today ?? { sessions: 0, leads: 0, calls: 0 } };
}

export interface LeadFilters {
  status?: string;
  channel?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export async function getLeads(range: DateRange, filters: LeadFilters = {}) {
  const sql = requireDb();
  const limit = Math.min(filters.limit ?? 50, 500);
  const offset = filters.offset ?? 0;
  const search = filters.search?.trim() ? `%${filters.search.trim()}%` : null;

  const rows = (await sql`
    select id, created_at, name, email, phone, city, zip, appliance, source_form,
           lt_channel, lt_campaign, lt_term, lt_landing_path, ft_channel,
           status, value_cents, booked_at,
           is_duplicate, email_delivered, device, time_to_lead_sec, problem, message
    from leads
    where created_at >= ${range.from} and created_at < ${range.to}
      and (${filters.status ?? null}::text is null or status = ${filters.status ?? null})
      and (${filters.channel ?? null}::text is null or lt_channel = ${filters.channel ?? null})
      and (
        ${search}::text is null
        or name ilike ${search} or email ilike ${search}
        or phone ilike ${search} or city ilike ${search} or zip ilike ${search}
      )
    order by created_at desc
    limit ${limit} offset ${offset}
  `) as unknown as Record<string, unknown>[];

  const [totals] = (await sql`
    select count(*)::int as total
    from leads
    where created_at >= ${range.from} and created_at < ${range.to}
      and (${filters.status ?? null}::text is null or status = ${filters.status ?? null})
      and (${filters.channel ?? null}::text is null or lt_channel = ${filters.channel ?? null})
      and (
        ${search}::text is null
        or name ilike ${search} or email ilike ${search}
        or phone ilike ${search} or city ilike ${search} or zip ilike ${search}
      )
  `) as unknown as { total: number }[];

  return { rows, total: totals?.total ?? 0 };
}

export async function getLead(id: string) {
  const sql = requireDb();
  const [lead] = (await sql`select * from leads where id = ${id}`) as unknown as Record<string, unknown>[];
  if (!lead) return null;

  // The behavioural trail. This is what turns a name and a number into "read
  // the dryer repair page twice, checked the service area, then called".
  const timeline = lead.session_id
    ? ((await sql`
        select type, path, label, value, ts, meta
        from events
        where session_id = ${lead.session_id as string}
        order by ts asc
        limit 300
      `) as unknown as Record<string, unknown>[])
    : [];

  const visits = lead.visitor_id
    ? ((await sql`
        select id, started_at, channel, campaign, landing_path, pageviews, engaged_seconds, converted
        from sessions
        where visitor_id = ${lead.visitor_id as string}
        order by started_at desc
        limit 20
      `) as unknown as Record<string, unknown>[])
    : [];

  const calls = (await sql`
    select id, started_at, duration_seconds, answered, channel, recording_url, caller_number
    from calls
    where lead_id = ${id}
       or (caller_number = ${(lead.phone_e164 as string) ?? null} and started_at > ${lead.created_at as Date} - interval '7 days')
    order by started_at desc
    limit 20
  `) as unknown as Record<string, unknown>[];

  const exports = (await sql`
    select platform, event_name, status, attempts, last_error, sent_at
    from conversion_exports where lead_id = ${id}
  `) as unknown as Record<string, unknown>[];

  return { lead, timeline, visits, calls, exports };
}

export async function getCalls(range: DateRange) {
  const sql = requireDb();
  const rows = (await sql`
    select c.id, c.started_at, c.caller_number, c.tracking_number, c.channel, c.campaign,
           c.answered, c.duration_seconds, c.is_first_time, c.recording_url, c.lead_id,
           s.city, s.landing_path
    from calls c
    left join sessions s on s.id = c.session_id
    where c.started_at >= ${range.from} and c.started_at < ${range.to}
    order by c.started_at desc
    limit 300
  `) as unknown as Record<string, unknown>[];
  return rows;
}

export async function getSpend(range: DateRange) {
  const sql = requireDb();
  const rows = (await sql`
    select id, day, channel, campaign, cost_cents, clicks, impressions, source
    from ad_spend
    where day >= ${range.from} and day < ${range.to}
    order by day desc, channel
    limit 500
  `) as unknown as Record<string, unknown>[];
  return rows;
}

export async function getTrackingNumbers() {
  const sql = requireDb();
  return (await sql`
    select id, number_e164, display_number, channel, campaign, label, active, created_at
    from tracking_numbers order by channel
  `) as unknown as Record<string, unknown>[];
}
