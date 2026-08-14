-- CoastPro analytics + admin schema.
--
-- Run this once against the Railway Postgres service:
--   psql "$DATABASE_PUBLIC_URL" -f db/schema.sql
--
-- It is idempotent — re-running it is safe. But be precise about what that
-- buys: `create table if not exists` creates a *missing* table and does
-- nothing at all to one that already exists. Adding a column to a live table
-- therefore takes an explicit `alter table … add column if not exists`, at the
-- bottom of this file, as well as the column in the `create table` block for
-- fresh installs. Both, every time.
--
-- Getting that wrong is invisible: the file runs clean, the deploy succeeds,
-- and every write to the missing column fails inside `quietly()` while the
-- console looks perfectly healthy. An earlier revision of this header claimed
-- re-running was how columns got added, which was simply untrue.
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
  brand             text,
  problem           text,
  message           text,
  service_name      text,           -- JobPocket's own name for the job booked
  preferred_start   timestamptz,     -- the arrival window the visitor chose
  preferred_end     timestamptz,

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
  time_to_lead_sec  integer,                   -- from session start to submit

  -- ---------------------------------------------------------------------
  -- JobPocket: getting the lead onto the owner's phone, and the job's
  -- outcome back. Mirrored in the `alter table` block below — see the header.
  -- ---------------------------------------------------------------------
  jp_push_state      text not null default 'pending',  -- pending|sending|sent|skipped|failed
  jp_push_attempts   integer not null default 0,
  jp_push_claimed_at timestamptz,
  jp_pushed_at       timestamptz,
  jp_last_error      text,

  jp_request_id      text,
  jp_status_token    text,
  jp_request_status  text,
  jp_job_id          text,
  jp_job_status      text,
  jp_payment_status  text,
  -- Deliberately not `value_cents`. That column is what was uploaded to Google
  -- Ads under this lead's id, and a figure already sent to a third party must
  -- never be quietly rewritten — the new one goes beside it.
  jp_total_cents     integer,
  jp_responded_at    timestamptz,
  jp_paid_at         timestamptz,

  jp_state           text,      -- derived: pending|accepted|working|invoiced|paid|…
  -- What the sync last acted on. The reason this exists rather than comparing
  -- states: a human who deliberately demotes a lead must not be overruled by
  -- the next poll seeing the same unchanged state and promoting it again.
  jp_applied_state   text,
  jp_poll_state      text not null default 'idle',     -- idle|open|settled|gone
  jp_poll_failures   integer not null default 0,
  jp_next_poll_at    timestamptz,
  jp_synced_at       timestamptz,

  jp_conflict        text,      -- e.g. paid_after_lost, declined_after_booked
  jp_conflict_at     timestamptz
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
-- Platform statistics — what the ad platforms report about themselves.
--
-- Deliberately one wide table rather than one per report. The reports differ
-- only in what a row is *about* — a campaign, a keyword, a search term, a city,
-- an hour — and every one of them carries the same handful of measures. Ten
-- near-identical tables would mean ten near-identical queries and a migration
-- every time a new breakdown is added.
--
-- This is kept strictly apart from the first-party tables, and must never be
-- silently added to them. A platform's "conversions" is its own attribution
-- model guessing; `leads` is a person who actually got in touch. Showing them
-- side by side is the point. Adding them together would be a lie.
-- ---------------------------------------------------------------------------
create table if not exists platform_stats (
  day                    date   not null,
  channel                text   not null,   -- google_ads | google_lsa | meta_ads | bing_ads …
  level                  text   not null,   -- account | campaign | ad_group | keyword | search_term | ad | device | geo | hour
  -- The platform's own id where there is one. For rows that are not about an
  -- object — a search term, a city, an hour — this holds the value itself.
  entity_id              text   not null default '',
  entity_name            text,
  parent_name            text,              -- campaign name, for rows below it
  -- A second dimension when the report is segmented: device, placement, match
  -- type. Empty string rather than null so it can sit in the primary key.
  segment                text   not null default '',

  impressions            bigint not null default 0,
  clicks                 bigint not null default 0,
  cost_cents             bigint not null default 0,
  -- Fractional on purpose: platforms report conversions in fractions when they
  -- model or attribute partially.
  conversions            numeric(12, 2) not null default 0,
  conversion_value_cents bigint not null default 0,
  -- Everything else the platform sends — impression share, quality score,
  -- frequency, reach, call counts. Kept as-is rather than as columns, because
  -- the interesting fields differ per platform and per report.
  extra                  jsonb,

  source                 text   not null,   -- google_ads_script | meta_api | manual_csv
  updated_at             timestamptz not null default now(),

  primary key (day, channel, level, entity_id, segment)
);

create index if not exists platform_stats_day_idx     on platform_stats (day desc);
create index if not exists platform_stats_channel_idx on platform_stats (channel, level, day desc);
create index if not exists platform_stats_level_idx   on platform_stats (level, day desc);

-- ---------------------------------------------------------------------------
-- Import runs — when each importer last ran, what it fetched and what broke.
-- Without this, a scheduled job that quietly stopped three weeks ago looks
-- exactly like a period with no advertising.
-- ---------------------------------------------------------------------------
create table if not exists import_runs (
  id          bigserial primary key,
  source      text not null,
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  status      text not null default 'running',   -- running | ok | failed
  day_from    date,
  day_to      date,
  rows_written integer not null default 0,
  reports     jsonb,
  error       text
);

create index if not exists import_runs_source_idx on import_runs (source, started_at desc);

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
-- Marketing jobs — a local copy of the safe dataset JobPocket hands over.
--
-- Note what is *not* here: no name, no phone, no email, no street, no
-- coordinates, no serial number, no money. The Marketing API never sends them,
-- and this table has nowhere to put them, so a change on the other side cannot
-- quietly start storing a customer's address on a marketing server. City and
-- state are the whole location, because a local article needs a town and
-- nothing finer.
--
-- It is a cache, not a source: `job_id` is JobPocket's, the row is replaced on
-- every refresh, and losing the table costs one re-fetch. What must survive is
-- the writing, which lives in marketing_content and keys on the same id.
-- ---------------------------------------------------------------------------
create table if not exists marketing_job (
  job_id           text primary key,
  fetched_at       timestamptz not null default now(),

  status           text,
  completed_at     timestamptz,
  job_created_at   timestamptz,
  job_updated_at   timestamptz,

  appliance_type   text,
  manufacturer     text,
  model            text,

  diagnosis        text,
  repair_performed text,
  technician_notes text,
  error_codes      text[]      not null default '{}',
  replaced_parts   jsonb       not null default '[]',

  city             text,
  state            text,

  -- What the redactor took out of the free text on the way here. Labels only,
  -- never values — it is shown in the console so the owner can see the
  -- redaction working rather than take it on trust.
  redacted         text[]      not null default '{}',
  photo_count      integer     not null default 0,

  -- Still on the list JobPocket hands over. A job the owner takes back off it
  -- stops arriving, and this goes false rather than the row being deleted:
  -- anything already written about the job has to survive, and "was released,
  -- then withdrawn" is a different fact from "never existed". The console hides
  -- a withdrawn job unless something has been written about it.
  released         boolean     not null default true
);

create index if not exists marketing_job_completed_idx on marketing_job (completed_at desc);
create index if not exists marketing_job_city_idx on marketing_job (city);
create index if not exists marketing_job_type_idx on marketing_job (appliance_type);

-- ---------------------------------------------------------------------------
-- Marketing photos — which pictures came with a job, and which ones a person
-- picked for a piece.
--
-- `url` is a path on this site, not on JobPocket: the image is proxied so the
-- key stays server-side and so the EXIF is stripped on the way through. The
-- selection and the order are the human's, and are the reason this table
-- outlives a refresh of marketing_job.
-- ---------------------------------------------------------------------------
create table if not exists marketing_photo (
  photo_id     text primary key,
  job_id       text not null references marketing_job (job_id) on delete cascade,
  caption      text,
  category     text,

  selected     boolean not null default false,
  sort_order   integer not null default 0,
  alt_text     text
);

create index if not exists marketing_photo_job_idx on marketing_photo (job_id, sort_order);

-- ---------------------------------------------------------------------------
-- Marketing content — one row per job per channel.
--
-- Two bodies, deliberately: what the model wrote and what the person made of
-- it. Keeping them apart is what lets a regeneration be offered without
-- destroying an edit, and what makes "did a human touch this" answerable.
--
-- The model and prompt version are recorded because in six months the only way
-- to explain why a piece reads the way it does is to know what produced it.
-- ---------------------------------------------------------------------------
create table if not exists marketing_content (
  id             uuid primary key default gen_random_uuid(),
  job_id         text not null references marketing_job (job_id) on delete cascade,
  channel        text not null,

  status         text not null default 'draft',

  title          text,
  slug           text,
  meta_title     text,
  meta_desc      text,
  generated_body text,
  edited_body    text,

  model          text,
  prompt_version text,
  approved_by    text,
  approved_at    timestamptz,

  -- What the draft-checker found: an invented part number, a price nobody
  -- agreed to, a superlative. Stored rather than recomputed so the warning is
  -- attached to the version it was raised against.
  flags          jsonb not null default '[]',

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  unique (job_id, channel)
);

create index if not exists marketing_content_status_idx on marketing_content (status, updated_at desc);
create unique index if not exists marketing_content_slug_idx on marketing_content (slug)
  where slug is not null;

-- ---------------------------------------------------------------------------
-- Marketing publications — where a piece actually went, and when.
--
-- Separate from the content's status because publishing is an event with a
-- destination, and a piece can go out to more than one place. An unpublish is
-- a row with `unpublished_at` set, not a delete: the question later is always
-- "what was live in March", and a deleted row cannot answer it.
-- ---------------------------------------------------------------------------
create table if not exists marketing_publication (
  id             uuid primary key default gen_random_uuid(),
  content_id     uuid not null references marketing_content (id) on delete cascade,
  destination    text not null,
  url            text,
  published_at   timestamptz not null default now(),
  unpublished_at timestamptz
);

create index if not exists marketing_publication_content_idx
  on marketing_publication (content_id, published_at desc);

-- ---------------------------------------------------------------------------
-- Columns added to tables that already exist.
--
-- `create table if not exists` above does nothing to a live table, so anything
-- added after the first deploy has to be repeated here. See the header.
-- ---------------------------------------------------------------------------
alter table marketing_job add column if not exists released boolean not null default true;
alter table marketing_content add column if not exists flags jsonb not null default '[]';

-- The booking form carries more than the contact form does.
alter table leads add column if not exists brand             text;
alter table leads add column if not exists service_name      text;
alter table leads add column if not exists preferred_start   timestamptz;
alter table leads add column if not exists preferred_end     timestamptz;

alter table leads add column if not exists jp_push_state      text not null default 'pending';
alter table leads add column if not exists jp_push_attempts   integer not null default 0;
alter table leads add column if not exists jp_push_claimed_at timestamptz;
alter table leads add column if not exists jp_pushed_at       timestamptz;
alter table leads add column if not exists jp_last_error      text;
alter table leads add column if not exists jp_request_id      text;
alter table leads add column if not exists jp_status_token    text;
alter table leads add column if not exists jp_request_status  text;
alter table leads add column if not exists jp_job_id          text;
alter table leads add column if not exists jp_job_status      text;
alter table leads add column if not exists jp_payment_status  text;
alter table leads add column if not exists jp_total_cents     integer;
alter table leads add column if not exists jp_responded_at    timestamptz;
alter table leads add column if not exists jp_paid_at         timestamptz;
alter table leads add column if not exists jp_state           text;
alter table leads add column if not exists jp_applied_state   text;
alter table leads add column if not exists jp_poll_state      text not null default 'idle';
alter table leads add column if not exists jp_poll_failures   integer not null default 0;
alter table leads add column if not exists jp_next_poll_at    timestamptz;
alter table leads add column if not exists jp_synced_at       timestamptz;
alter table leads add column if not exists jp_conflict        text;
alter table leads add column if not exists jp_conflict_at     timestamptz;

-- Partial indexes: the queue and the poller each look at a small slice.
create index if not exists leads_jp_push_idx on leads (created_at)
  where jp_push_state in ('pending', 'sending', 'failed');
create index if not exists leads_jp_poll_idx on leads (jp_next_poll_at)
  where jp_poll_state in ('open');
-- A tripwire, not an optimisation: two of our leads must never claim the same
-- JobPocket request. If this ever fires, we generated one id twice.
create unique index if not exists leads_jp_request_idx on leads (jp_request_id)
  where jp_request_id is not null;

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
    'ad_spend','conversion_exports','web_vitals','settings','admin_audit',
    'platform_stats','import_runs',
    'marketing_job','marketing_photo','marketing_content','marketing_publication'
  ] loop
    execute format('alter table %I disable row level security', t);
  end loop;
end $$;
