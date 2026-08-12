# Marketing console — setup

Everything here lives inside the site itself. There is no third-party analytics
account to log into, and nothing that an ad blocker can switch off.

The console is at **coastpro.us/admin**.

---

## 1. Database — already done

The database is the **CoastPro Marketing** Postgres service in the Railway
project *Jobpocket.app*. PostgreSQL 18.4, in Railway's San Francisco region.
The eleven tables are created and the connection is live.

Two things about it are worth knowing, because they are easy to get wrong later.

**Use the public connection string, not the internal one.** Railway gives the
service two addresses:

| Variable | Host | Reachable from |
|---|---|---|
| `DATABASE_URL` | `postgres-wopj.railway.internal` | only inside Railway |
| `DATABASE_PUBLIC_URL` | `HOST.proxy.rlwy.net:PORT` | anywhere |

The site runs on Vercel, which is not inside Railway's network, so it needs the
public one. In Vercel it is stored under the name `DATABASE_URL` — that is what
the code reads.

**Vercel functions are pinned to San Francisco.** `vercel.json` sets
`"regions": ["sfo1"]`. Vercel's default is Washington DC, which would put a
coast-to-coast round trip on every query — measured at roughly 70ms each, on
admin pages that run four or five. Beside the database it is a couple of
milliseconds. It is also nearer the customers, who are all in Orange County.
**If that line is ever removed, the console gets noticeably slower.**

Re-running the schema after a change:

```bash
psql "$DATABASE_PUBLIC_URL" -f db/schema.sql
```

It is idempotent — safe to run as many times as you like.

### Is the database safe, exposed like that?

Enabling the TCP proxy put the Postgres port on the public internet. What
protects it:

- a 32-character random password, which is not guessable
- TLS 1.3 on every connection, verified in place — nothing crosses the wire in
  the clear
- no other service on that port, and no web interface at all

What it does not protect against is the password leaking. So: it lives only in
Railway and in Vercel's environment variables, never in the repository, and if
it is ever pasted somewhere public, rotate it in Railway and update Vercel.

---

## 2. Tag the ads (required before spending anything)

Untagged traffic still gets classified by where it came from, but only roughly.
Tagged traffic can be read down to the individual ad.

**Google Ads.** Leave auto-tagging on — it supplies the click identifier by
itself. For keyword and creative detail, set the account tracking template to:

```
{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_content={creative}&utm_term={keyword}
```

**Local Services Ads.** LSA has no click identifier at all, so the profile's
website link has to carry the tag itself:

```
https://coastpro.us/?utm_source=google&utm_medium=lsa
```

Most LSA business arrives by phone, so its tracking number (step 4) matters far
more than this.

**Meta.** In the ad's *URL parameters* field:

```
utm_source=facebook&utm_medium=paid-social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}
```

Without `utm_medium=paid-social`, paid Meta traffic is indistinguishable from an
ordinary post — `fbclid` appears on both.

**Yelp, Nextdoor, TikTok, Bing.** Any link works as long as it carries
`utm_source` and `utm_medium=cpc`.

---

## 3. Bookings (5 minutes)

At [calendly.com/integrations/api_webhooks](https://calendly.com/integrations/api_webhooks),
subscribe `invitee.created` and `invitee.canceled` pointing at:

```
https://coastpro.us/api/calendly/webhook
```

Put the signing key it gives you in `CALENDLY_WEBHOOK_SECRET`.

Bookings are already caught in the browser without this. The webhook is what
makes a *cancellation* visible, and what catches bookings made from a Calendly
link that never touched the site.

---

## 4. Call tracking (the big one)

Most people with a broken fridge phone rather than fill in a form. Without this,
those calls are invisible and every phone-heavy channel looks like it produces
nothing.

1. In Telnyx, buy one local 949 number **per channel** you are advertising on.
   Start with: Google Ads, Local Services Ads, Meta, Yelp.
2. Set each number to forward to **(949) 749-0006**, so calls connect exactly as
   they do today.
3. Point each number's voice webhook at:
   ```
   https://coastpro.us/api/telnyx/webhook
   ```
4. Copy the account's **public key** from the Telnyx portal into
   `TELNYX_PUBLIC_KEY`.
5. In the console: **Settings → Tracking numbers**, add each number and say which
   channel it belongs to.

From then on, a visitor arriving from Google Ads sees the Google Ads number, a
visitor from Yelp sees the Yelp number, and the call log knows which ad paid for
each ring — plus whether it was answered and how long it lasted.

If a channel has no number, its visitors keep seeing the main line. No call can
ever be lost because a row is missing here.

---

## 5. Reporting outcomes back to the ad platforms

This is what changes how the advertising performs, rather than just describing
it. Left alone, Google and Meta optimise towards form submissions, because that
is all they can see — and will happily buy a hundred tyre-kickers over ten real
jobs.

**Google Ads.** Create a conversion action: *Goals → Conversions → New →
Import → from clicks*, call it "Won job", value = use the value from the upload.
Then set:

- `GOOGLE_ADS_DEVELOPER_TOKEN` — from the manager account's API Center
- `GOOGLE_ADS_CUSTOMER_ID` — the advertising account, digits only
- `GOOGLE_ADS_LOGIN_CUSTOMER_ID` — the manager account, if there is one
- `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, `GOOGLE_ADS_REFRESH_TOKEN`
  — an OAuth client with the `adwords` scope
- `GOOGLE_ADS_CONVERSION_ACTION_ID` — the numeric id from the conversion action's URL

**Meta.** Events Manager → the pixel → Settings → *Generate access token*.
Set `META_PIXEL_ID` and `META_CAPI_TOKEN`.

Once these exist, marking a lead **won** in the console — with the invoice value
— uploads that outcome against the exact click that produced it, immediately.

Anything the platforms reject is retried by a scheduled job and shown on the
lead's own card, so nothing fails silently. That job runs **once a day**: the
Vercel account is on the Hobby plan, which triggers cron jobs daily no matter
what schedule is written. It is only a safety net — the real upload happens the
moment you mark the job won — but if the plan is ever upgraded, change the
schedule in `vercel.json` to hourly and it will start honouring it.

Hobby also caps the account at **two** cron jobs in total. Worth remembering
before adding a third.

---

## How the numbers are defined

Worth knowing before arguing with them.

- **Visit** — one session. It ends after 30 minutes of inactivity, the same rule
  the ad platforms use.
- **Bot** — matched a crawler pattern in the user agent. Excluded from every
  screen except *Quality*, which is where you can see what was thrown away.
- **Request** — a form lead plus an answered call. Cost per request divides spend
  by both, because judging a phone-heavy channel on form fills alone makes it
  look several times worse than it is.
- **Duplicate** — the same phone number inside 30 days. Recorded, flagged, and
  left out of lead counts.
- **Answered call under 30 seconds** — counted separately. A four-second call is
  a misdial, not a customer.
- **Bounce** — one page, under ten seconds, nothing clicked.
- **Engaged** — 15 seconds or more, or a second page.
- **Revenue** — the sum of values on leads marked *won*, dated to when the lead
  arrived rather than when the invoice was paid. Recent days therefore look
  thinner than they will turn out to be.
- **First click vs last click** — the *Channels* screen switches between them.
  Last click credits whatever was in play when they got in touch; first click
  credits whatever introduced them, which is usually an ad even when the
  converting visit came from searching the business name.
- **Every day boundary and hour-of-day chart** is cut in California time, not UTC.

## What is deliberately not here

- **No cross-device identity.** Someone who browses on a phone and books on a
  laptop is two visitors until they hand over a phone number that matches.
- **No session replay.** The event timeline on a lead's card says what they did,
  not what they saw.
- **The console is light-mode only.** It renders on one surface, and the chart
  colours are validated against that surface specifically.
