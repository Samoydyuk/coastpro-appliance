import { createHash } from 'crypto';
import { db } from '@/lib/db';

/**
 * Reporting won jobs back to the ad platforms.
 *
 * This is the piece that changes what the advertising does. Left alone, Google
 * and Meta optimise towards the only thing they can see — form submissions —
 * and will happily buy a hundred tyre-kickers over ten real jobs, because a
 * hundred is a bigger number. Sending the outcome back, with the value of the
 * job attached to the click that produced it, moves the bidding onto revenue.
 *
 * Both integrations are plain HTTPS calls. The official SDKs are large, and
 * neither of these endpoints is complicated enough to justify one.
 */

interface LeadRow {
  id: string;
  created_at: Date;
  status: string;
  value_cents: number | null;
  email: string | null;
  phone_e164: string | null;
  name: string | null;
  city: string | null;
  zip: string | null;
  gclid: string | null;
  gbraid: string | null;
  wbraid: string | null;
  fbclid: string | null;
  lt_landing_path: string | null;
}

function sha256(value: string): string {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

// ---------------------------------------------------------------------------
// Google Ads — offline conversion import, keyed on the click id
// ---------------------------------------------------------------------------

async function googleAccessToken(): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID ?? '',
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET ?? '',
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN ?? '',
      grant_type: 'refresh_token',
    }),
  });
  const body = (await response.json()) as { access_token?: string; error_description?: string };
  if (!response.ok || !body.access_token) {
    throw new Error(`Google token exchange failed: ${body.error_description ?? response.status}`);
  }
  return body.access_token;
}

/** Google wants `2026-08-12 14:03:00+00:00`, and rejects anything else. */
function googleTimestamp(date: Date): string {
  return `${date.toISOString().slice(0, 19).replace('T', ' ')}+00:00`;
}

export function googleAdsConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_ADS_DEVELOPER_TOKEN &&
      process.env.GOOGLE_ADS_CUSTOMER_ID &&
      process.env.GOOGLE_ADS_REFRESH_TOKEN &&
      process.env.GOOGLE_ADS_CONVERSION_ACTION_ID
  );
}

async function sendToGoogleAds(lead: LeadRow) {
  if (!googleAdsConfigured()) throw new Error('Google Ads is not configured.');

  const customerId = (process.env.GOOGLE_ADS_CUSTOMER_ID ?? '').replace(/\D/g, '');
  const loginCustomerId = (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID ?? '').replace(/\D/g, '');
  const actionId = (process.env.GOOGLE_ADS_CONVERSION_ACTION_ID ?? '').replace(/\D/g, '');

  const conversion: Record<string, unknown> = {
    conversionAction: `customers/${customerId}/conversionActions/${actionId}`,
    conversionDateTime: googleTimestamp(new Date(lead.created_at)),
    conversionValue: (lead.value_cents ?? 0) / 100,
    currencyCode: 'USD',
    orderId: lead.id,
  };

  // Only one identifier may be sent, and the newer ones take priority: gbraid
  // and wbraid are what iOS traffic arrives with when gclid is unavailable.
  if (lead.gclid) conversion.gclid = lead.gclid;
  else if (lead.gbraid) conversion.gbraid = lead.gbraid;
  else if (lead.wbraid) conversion.wbraid = lead.wbraid;

  // Enhanced conversions: hashed contact details let Google match a click even
  // when the identifier has expired or was stripped.
  const identifiers: Record<string, string>[] = [];
  if (lead.email) identifiers.push({ hashedEmail: sha256(lead.email) });
  if (lead.phone_e164) identifiers.push({ hashedPhoneNumber: sha256(lead.phone_e164) });
  if (identifiers.length) conversion.userIdentifiers = identifiers;

  const token = await googleAccessToken();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? '',
    'Content-Type': 'application/json',
  };
  if (loginCustomerId) headers['login-customer-id'] = loginCustomerId;

  const response = await fetch(
    `https://googleads.googleapis.com/v18/customers/${customerId}:uploadClickConversions`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ conversions: [conversion], partialFailure: true }),
    }
  );

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Google Ads rejected the upload: ${JSON.stringify(body).slice(0, 400)}`);
  }
  // partialFailure means a 200 can still contain a rejection, so the error
  // field has to be read rather than trusting the status code.
  const partial = (body as { partialFailureError?: { message?: string } }).partialFailureError;
  if (partial?.message) throw new Error(`Google Ads partial failure: ${partial.message}`);

  return body as Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Meta — Conversions API
// ---------------------------------------------------------------------------

export function metaConfigured(): boolean {
  return Boolean(process.env.META_PIXEL_ID && process.env.META_CAPI_TOKEN);
}

async function sendToMeta(lead: LeadRow, eventName: string) {
  if (!metaConfigured()) throw new Error('Meta is not configured.');

  const userData: Record<string, unknown> = {};
  if (lead.email) userData.em = [sha256(lead.email)];
  if (lead.phone_e164) userData.ph = [sha256(lead.phone_e164.replace(/\D/g, ''))];
  if (lead.name) {
    const [first, ...rest] = lead.name.trim().split(/\s+/);
    if (first) userData.fn = [sha256(first)];
    if (rest.length) userData.ln = [sha256(rest.join(' '))];
  }
  if (lead.city) userData.ct = [sha256(lead.city.replace(/\s/g, ''))];
  if (lead.zip) userData.zp = [sha256(lead.zip)];
  if (lead.fbclid) {
    // Meta's click cookie format. Rebuilt from the identifier we stored,
    // stamped with when we first saw it.
    userData.fbc = `fb.1.${new Date(lead.created_at).getTime()}.${lead.fbclid}`;
  }

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(new Date(lead.created_at).getTime() / 1000),
        event_id: `${lead.id}-${eventName}`,
        action_source: 'website',
        event_source_url: `https://coastpro.us${lead.lt_landing_path ?? '/'}`,
        user_data: userData,
        custom_data: {
          value: (lead.value_cents ?? 0) / 100,
          currency: 'USD',
        },
      },
    ],
  };

  const response = await fetch(
    `https://graph.facebook.com/v21.0/${process.env.META_PIXEL_ID}/events?access_token=${process.env.META_CAPI_TOKEN}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Meta rejected the event: ${JSON.stringify(body).slice(0, 400)}`);
  }
  return body as Record<string, unknown>;
}

// ---------------------------------------------------------------------------

/**
 * Works through everything queued. Called after a lead is marked won and from
 * the cron endpoint, so a platform being briefly unreachable only delays the
 * report rather than losing it.
 */
export async function flushConversionQueue(limit = 25) {
  const sql = db();
  if (!sql) return { sent: 0, failed: 0, skipped: 0 };

  // Columns are listed rather than using `l.*`: both tables have an `id`, and
  // whichever came last would silently win, sending the wrong row to be marked
  // as delivered.
  const pending = (await sql`
    select
      ce.id as export_id, ce.platform, ce.event_name, ce.attempts,
      l.id, l.created_at, l.status, l.value_cents, l.email, l.phone_e164, l.name,
      l.city, l.zip, l.gclid, l.gbraid, l.wbraid, l.fbclid, l.lt_landing_path
    from conversion_exports ce
    join leads l on l.id = ce.lead_id
    where ce.status = 'pending' and ce.attempts < 5
    order by ce.created_at
    limit ${limit}
  `) as unknown as (LeadRow & {
    export_id: string;
    platform: string;
    event_name: string;
    attempts: number;
  })[];

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const row of pending) {
    const exportId = row.export_id;
    const configured =
      row.platform === 'google_ads' ? googleAdsConfigured() : row.platform === 'meta' ? metaConfigured() : false;

    if (!configured) {
      skipped += 1;
      await sql`
        update conversion_exports
        set status = 'skipped', last_error = 'Platform credentials are not configured'
        where id = ${exportId}
      `;
      continue;
    }

    try {
      const response =
        row.platform === 'google_ads'
          ? await sendToGoogleAds(row)
          : await sendToMeta(row, row.event_name);

      await sql`
        update conversion_exports
        set status = 'sent', sent_at = now(), attempts = attempts + 1,
            response = ${sql.json(response as Record<string, never>)}, last_error = null
        where id = ${exportId}
      `;
      sent += 1;
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      await sql`
        update conversion_exports
        set attempts = attempts + 1,
            last_error = ${message.slice(0, 800)},
            status = case when attempts + 1 >= 5 then 'failed' else 'pending' end
        where id = ${exportId}
      `;
    }
  }

  return { sent, failed, skipped };
}

/**
 * Queue the outcome of a won job. Separate from the lead-time queue entry: that
 * one reports "a lead happened", this one reports what it turned out to be
 * worth, which is the signal the bidding actually needs.
 */
export async function queueWonConversion(leadId: string) {
  const sql = db();
  if (!sql) return;

  const [lead] = (await sql`
    select id, gclid, gbraid, wbraid, fbclid, value_cents from leads where id = ${leadId}
  `) as unknown as {
    id: string;
    gclid: string | null;
    gbraid: string | null;
    wbraid: string | null;
    fbclid: string | null;
    value_cents: number | null;
  }[];
  if (!lead) return;

  if (lead.gclid || lead.gbraid || lead.wbraid) {
    await sql`
      insert into conversion_exports (lead_id, platform, event_name, status, value_cents)
      values (${leadId}, 'google_ads', 'won', 'pending', ${lead.value_cents})
      on conflict (lead_id, platform, event_name)
      do update set status = 'pending', attempts = 0, value_cents = ${lead.value_cents}
    `;
  }
  if (lead.fbclid) {
    await sql`
      insert into conversion_exports (lead_id, platform, event_name, status, value_cents)
      values (${leadId}, 'meta', 'Purchase', 'pending', ${lead.value_cents})
      on conflict (lead_id, platform, event_name)
      do update set status = 'pending', attempts = 0, value_cents = ${lead.value_cents}
    `;
  }
}
