-- CoastPro analytics + admin schema.
--
-- Run this once against the Railway Postgres service:
--   psql "$DATABASE_PUBLIC_URL" -f db/schema.sql
-- It is idempotent — re-running it is safe, and is how later columns get added.
--
-- Verified against the live database: PostgreSQL 18.4, reached over Railway's
-- TCP proxy with TLS 1.3.
--
-- Note on Row Level Security: an earlier draft enabled RLS on every table. That
-- made sense against Supabase, which publishes the whole database over a public
-- HTTP API and needs it locked down. Railway publishes nothing — the only way
-- in is the Postgres port, behind the password. RLS here would protect against
-- nobody, while quietly returning zero rows to any future non-superuser role,
-- which is the worst kind of bug: silent and plausible. It is deliberately not
-- enabled. If a limited role is ever added, grant it explicitly instead.

-- ---------------------------------------------------------------------------
-- Visitors — one row per browser, ever. Holds the first touch, which is the
-- attribution question nobody can answer after the fact: which ad originally
-- introduced this person to us, even if they converted weeks later from Google.
-- ---------------------------------------------------------------------------
create table if not exists visitors (
  id                text primary key,
  first_seen_at     timestamptz not null default now(),
  last_seen_at      timestamptz not null default now(),
  sessions_count    integer     not null default 1,

  -- First touch. Written once, never overwritten.
  ft_channel        text,
  ft_source         text,
  ft_medium         text,
  ft_campaign       text,
  ft_content        text,
  ft_term           text,
  ft_click_id       text,
  ft_click_id_type  text,
  ft_landing_path   text,
  ft_referrer       text,
  ft_at             timestamptz,

  is_bot            boolean     not null default false
);

-- ---------------------------------------------------------------------------
-- Sessions — one row per visit. Holds the last touch: the click that was
-- actually in play when this visit happened.
-- ---------------------------------------------------------------------------
create table if not exists sessions (
  id                text primary key,
  visitor_id        text not null,
  started_at        timestamptz not null default now(),
  last_seen_at      timestamptz not null default now(),

  channel           text,
  source            text,
  medium            text,
  campaign          text,
  content           text,
  term              text,
  click_id          text,
  click_id_type     text,

  -- Kept as their own columns too: the conversion APIs want the raw parameter
  -- back, and a single `click_id` column loses which platform it belonged to
  -- once a visit carries two of them.
  gclid             text,
  gbraid            text,
  wbraid            text,
  fbclid            text,
  msclkid           text,
  ttclid            text,
  li_fat_id         text,

  referrer          text,
  referrer_domain   text,
  landing_path      text,
  landing_query     text,

  device            text,
  os                text,
  browser           text,
  viewport_w        integer,
  screen_w          integer,
  language          text,

  country           text,
  region            text,
  city              text,
  postal_code       text,
  latitude          double precision,
  longitude         double precision,
  timezone          text,

  ip_hash           text,
  user_agent        text,

  is_bot            boolean default false,
  bot_reason        text,

  pageviews         integer default 0,
  event_count       integer default 0,
  engaged_seconds   integer default 0,
  max_scroll        integer default 0,
  converted         boolean default false
);

create index if not exists sessions_started_idx    on sessions (started_at desc);
create index if not exists sessions_visitor_idx    on sessions (visitor_id);
create index if not exists sessions_channel_idx    on sessions (channel, started_at desc);
create index if not exists sessions_campaign_idx   on sessions (campaign, started_at desc);
create index if not exists sessions_landing_idx    on sessions (landing_path, started_at desc);
create index if not exists sessions_live_idx       on sessions (last_seen_at desc);

-- ---------------------------------------------------------------------------
-- Events — the behavioural stream. This is what makes a lead card able to say
-- "read the dryer page for 3 minutes, opened the form, then called".
-- ---------------------------------------------------------------------------
create table if not exists events (
  id          bigserial primary key,
  session_id  text        not null,
  visitor_id  text        not null,
  ts          timestamptz not null default now(),
  type        text        not null,
  path        text,
  label       text,
  value       numeric,
  meta        jsonb
);

create index if not exists events_session_idx on events (session_id, ts);
create index if not exists events_type_ts_idx on events (type, ts desc);
create index if not exists events_ts_idx      on events (ts desc);
create index if not exists events_path_idx    on events (path, ts desc);

-- ---------------------------------------------------------------------------
-- Leads — every hand raised, with the attribution frozen onto it at the moment
-- it happened. Both touches are copied in rather than joined: campaigns get
-- renamed, sessions get pruned, and a lead's provenance has to survive that.
-- ---------------------------------------------------------------------------
create table if not exists leads (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  visitor_id        text,
  session_id        text,
  source_form       text not null,           -- contact | booking | calendly | call | manual

  name              text,
  email             text,
  phone             text,
  phone_e164        text,
  address           text,
  city              text,
  zip               text,
  appliance         text,
  problem           text,
  message           text,

  -- First touch
  ft_channel        text,
  ft_source         text,
  ft_medium         text,
  ft_campaign       text,
  ft_content        text,
  ft_term           text,
  ft_click_id       text,
  ft_click_id_type  text,
  ft_landing_path   text,

  -- Last touch
  lt_channel        text,
  lt_source         text,
  lt_medium         text,
  lt_campaign       text,
  lt_content        text,
  lt_term           text,
  lt_click_id       text,
  lt_click_id_type  text,
  lt_landing_path   text,
  lt_referrer       text,

  gclid             text,
  gbraid            text,
  wbraid            text,
  fbclid            text,
  msclkid           text,
  ttclid            text,

  device            text,
  geo_city          text,
  geo_region        text,

  status            text not null default 'new',   -- new | contacted | booked | won | lost | spam
  value_cents       integer,
  booked_at         timestamptz,
  won_at            timestamptz,
  lost_reason       text,
  notes             text,

  is_duplicate      boolean not null default false,
  duplicate_of      uuid,
  email_delivered   boolean,
  time_to_lead_sec  integer                    -- from session start to submit
);

create index if not exists leads_created_idx  on leads (created_at desc);
create index if not exists leads_status_idx   on leads (status, created_at desc);
create index if not exists leads_channel_idx  on leads (lt_channel, created_at desc);
create index if not exists leads_visitor_idx  on leads (visitor_id);
create index if not exists leads_phone_idx    on leads (phone_e164);

-- ---------------------------------------------------------------------------
-- Tracking numbers — the pool used for dynamic number insertion. A visitor
-- arriving from a given channel is shown that channel's number, so an inbound
-- call identifies its own source before anyone says hello.
-- ---------------------------------------------------------------------------
create table if not exists tracking_numbers (
  id             uuid primary key default gen_random_uuid(),
  number_e164    text not null unique,
  display_number text not null,
  channel        text not null,
  campaign       text,
  label          text,
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Calls — inbound calls as reported by the telephony webhook, matched back to
-- the browsing session that was looking at that number.
-- ---------------------------------------------------------------------------
create table if not exists calls (
  id                uuid primary key default gen_random_uuid(),
  provider          text not null default 'telnyx',
  provider_call_id  text unique,
  tracking_number   text,
  caller_number     text,
  destination       text,

  channel           text,
  campaign          text,

  visitor_id        text,
  session_id        text,
  lead_id           uuid,

  started_at        timestamptz not null default now(),
  answered_at       timestamptz,
  ended_at          timestamptz,
  duration_seconds  integer,
  answered          boolean not null default false,
  hangup_cause      text,
  is_first_time     boolean not null default true,
  recording_url     text,
  raw               jsonb
);

create index if not exists calls_started_idx on calls (started_at desc);
create index if not exists calls_channel_idx on calls (channel, started_at desc);
create index if not exists calls_caller_idx  on calls (caller_number);

-- ---------------------------------------------------------------------------
-- Ad spend — one row per day per campaign. Without it every cost-per-lead
-- number on the dashboard is a blank, so it is editable by hand as well as
-- importable.
-- ---------------------------------------------------------------------------
create table if not exists ad_spend (
  id          uuid primary key default gen_random_uuid(),
  day         date    not null,
  channel     text    not null,
  campaign    text    not null default '',
  cost_cents  integer not null default 0,
  clicks      integer,
  impressions integer,
  source      text    not null default 'manual',
  updated_at  timestamptz not null default now(),
  unique (day, channel, campaign)
);

create index if not exists ad_spend_day_idx on ad_spend (day desc);

-- ---------------------------------------------------------------------------
-- Conversion exports — the audit trail for what was pushed back to Google Ads
-- and Meta, so a failed upload is visible rather than silently missing.
-- ---------------------------------------------------------------------------
create table if not exists conversion_exports (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null,
  platform    text not null,               -- google_ads | meta
  event_name  text not null,
  status      text not null default 'pending',  -- pending | sent | failed | skipped
  attempts    integer not null default 0,
  value_cents integer,
  last_error  text,
  request     jsonb,
  response    jsonb,
  created_at  timestamptz not null default now(),
  sent_at     timestamptz,
  unique (lead_id, platform, event_name)
);

create index if not exists conversion_exports_status_idx on conversion_exports (status, created_at);

-- ---------------------------------------------------------------------------
-- Web vitals — page speed as experienced by real visitors. Slow landing pages
-- raise the price of every ad click, so this belongs next to the spend.
-- ---------------------------------------------------------------------------
create table if not exists web_vitals (
  id         bigserial primary key,
  session_id text,
  path       text,
  metric     text not null,
  value      numeric not null,
  rating     text,
  device     text,
  ts         timestamptz not null default now()
);

create index if not exists web_vitals_metric_idx on web_vitals (metric, ts desc);
create index if not exists web_vitals_path_idx   on web_vitals (path, ts desc);

-- ---------------------------------------------------------------------------
-- Settings — small key/value store for things the admin edits at runtime.
-- ---------------------------------------------------------------------------
create table if not exists settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Admin audit — who changed what in the panel.
-- ---------------------------------------------------------------------------
create table if not exists admin_audit (
  id         bigserial primary key,
  ts         timestamptz not null default now(),
  action     text not null,
  entity     text,
  entity_id  text,
  detail     jsonb,
  ip_hash    text
);

create index if not exists admin_audit_ts_idx on admin_audit (ts desc);

-- ---------------------------------------------------------------------------
-- Undo the Row Level Security an earlier revision switched on. Harmless while
-- connecting as the owner, which bypasses it — and a trap the first time
-- anything connects as a narrower role. See the note at the top of this file.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'visitors','sessions','events','leads','tracking_numbers','calls',
    'ad_spend','conversion_exports','web_vitals','settings','admin_audit'
  ] loop
    execute format('alter table %I disable row level security', t);
  end loop;
end $$;
