import { db, quietly } from '@/lib/db';
import { toE164, SESSION_COOKIE, VISITOR_COOKIE } from '@/lib/tracking';

/**
 * Recording a lead.
 *
 * The important part is not the contact details — those already go out by email
 * — it is freezing the attribution onto the row at the moment the person raised
 * their hand. Campaigns get renamed, sessions get pruned and ad accounts get
 * restructured; a lead has to be able to say which ad paid for it a year later
 * without depending on any of that still existing.
 */

export interface LeadInput {
  sourceForm: 'contact' | 'booking' | 'calendly' | 'call' | 'manual';
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  zip?: string | null;
  appliance?: string | null;
  brand?: string | null;
  problem?: string | null;
  message?: string | null;
  /** JobPocket's own name for the service booked, when the form knows it. */
  serviceName?: string | null;
  /** The arrival window the visitor picked, ISO-8601. */
  preferredStart?: string | null;
  preferredEnd?: string | null;
  status?: string;
}

interface SessionRow {
  channel: string | null;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  content: string | null;
  term: string | null;
  click_id: string | null;
  click_id_type: string | null;
  landing_path: string | null;
  referrer: string | null;
  gclid: string | null;
  gbraid: string | null;
  wbraid: string | null;
  fbclid: string | null;
  msclkid: string | null;
  ttclid: string | null;
  device: string | null;
  city: string | null;
  region: string | null;
  started_at: Date;
}

interface VisitorRow {
  ft_channel: string | null;
  ft_source: string | null;
  ft_medium: string | null;
  ft_campaign: string | null;
  ft_content: string | null;
  ft_term: string | null;
  ft_click_id: string | null;
  ft_click_id_type: string | null;
  ft_landing_path: string | null;
}

function readCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]!) : null;
}

/**
 * Writes the lead and returns its id, or null if there is no database. Never
 * throws: a failure to record must not stop the notification email, which is
 * what actually gets the customer called back.
 */
export async function recordLead(request: Request, input: LeadInput): Promise<string | null> {
  const sql = db();
  if (!sql) return null;

  return quietly(async () => {
    const cookieHeader = request.headers.get('cookie');
    const visitorId = readCookie(cookieHeader, VISITOR_COOKIE);
    const sessionId = readCookie(cookieHeader, SESSION_COOKIE);

    const [session] = sessionId
      ? ((await sql`
          select channel, source, medium, campaign, content, term, click_id, click_id_type,
                 landing_path, referrer, gclid, gbraid, wbraid, fbclid, msclkid, ttclid,
                 device, city, region, started_at
          from sessions where id = ${sessionId}
        `) as unknown as SessionRow[])
      : [];

    const [visitor] = visitorId
      ? ((await sql`
          select ft_channel, ft_source, ft_medium, ft_campaign, ft_content, ft_term,
                 ft_click_id, ft_click_id_type, ft_landing_path
          from visitors where id = ${visitorId}
        `) as unknown as VisitorRow[])
      : [];

    const phoneE164 = toE164(input.phone);

    // A repeat submission from the same person inside a month is almost always
    // the same job — someone impatient, or a form retried after an error. It is
    // still stored, but flagged, so it does not inflate the channel's lead
    // count or its cost per lead.
    const [existing] = phoneE164
      ? ((await sql`
          select id from leads
          where phone_e164 = ${phoneE164}
            and created_at > now() - interval '30 days'
          order by created_at asc limit 1
        `) as unknown as { id: string }[])
      : [];

    const timeToLead = session?.started_at
      ? Math.max(0, Math.round((Date.now() - new Date(session.started_at).getTime()) / 1000))
      : null;

    const [lead] = (await sql`
      insert into leads (
        visitor_id, session_id, source_form,
        name, email, phone, phone_e164, address, city, zip, appliance, brand, problem, message,
        service_name, preferred_start, preferred_end,
        ft_channel, ft_source, ft_medium, ft_campaign, ft_content, ft_term,
        ft_click_id, ft_click_id_type, ft_landing_path,
        lt_channel, lt_source, lt_medium, lt_campaign, lt_content, lt_term,
        lt_click_id, lt_click_id_type, lt_landing_path, lt_referrer,
        gclid, gbraid, wbraid, fbclid, msclkid, ttclid,
        device, geo_city, geo_region,
        status, is_duplicate, duplicate_of, time_to_lead_sec
      ) values (
        ${visitorId}, ${sessionId}, ${input.sourceForm},
        ${input.name ?? null}, ${input.email ?? null}, ${input.phone ?? null}, ${phoneE164},
        ${input.address ?? null}, ${input.city ?? null}, ${input.zip ?? null},
        ${input.appliance ?? null}, ${input.brand ?? null},
        ${input.problem ?? null}, ${input.message ?? null},
        ${input.serviceName ?? null},
        ${input.preferredStart ?? null}::timestamptz, ${input.preferredEnd ?? null}::timestamptz,
        ${visitor?.ft_channel ?? session?.channel ?? null}, ${visitor?.ft_source ?? null},
        ${visitor?.ft_medium ?? null}, ${visitor?.ft_campaign ?? null},
        ${visitor?.ft_content ?? null}, ${visitor?.ft_term ?? null},
        ${visitor?.ft_click_id ?? null}, ${visitor?.ft_click_id_type ?? null},
        ${visitor?.ft_landing_path ?? null},
        ${session?.channel ?? null}, ${session?.source ?? null}, ${session?.medium ?? null},
        ${session?.campaign ?? null}, ${session?.content ?? null}, ${session?.term ?? null},
        ${session?.click_id ?? null}, ${session?.click_id_type ?? null},
        ${session?.landing_path ?? null}, ${session?.referrer ?? null},
        ${session?.gclid ?? null}, ${session?.gbraid ?? null}, ${session?.wbraid ?? null},
        ${session?.fbclid ?? null}, ${session?.msclkid ?? null}, ${session?.ttclid ?? null},
        ${session?.device ?? null}, ${session?.city ?? null}, ${session?.region ?? null},
        ${input.status ?? 'new'}, ${Boolean(existing)}, ${existing?.id ?? null}, ${timeToLead}
      )
      returning id
    `) as unknown as { id: string }[];

    if (sessionId) {
      await sql`update sessions set converted = true where id = ${sessionId}`;
    }

    // Queue the push back to the ad platforms. Doing it here rather than at
    // send time means a lead is never silently left out because a background
    // job was added later.
    await queueConversionExports(lead!.id, session, input.sourceForm);

    return lead!.id;
  });
}

async function queueConversionExports(
  leadId: string,
  session: SessionRow | undefined,
  sourceForm: string
) {
  const sql = db();
  if (!sql) return;

  const platforms: { platform: string; eventName: string }[] = [];
  if (session?.gclid || session?.gbraid || session?.wbraid) {
    platforms.push({ platform: 'google_ads', eventName: 'lead' });
  }
  if (session?.fbclid) {
    platforms.push({ platform: 'meta', eventName: 'Lead' });
  }
  if (!platforms.length) return;

  for (const entry of platforms) {
    await sql`
      insert into conversion_exports (lead_id, platform, event_name, status, request)
      values (${leadId}, ${entry.platform}, ${entry.eventName}, 'pending', ${sql.json({ sourceForm })})
      on conflict (lead_id, platform, event_name) do nothing
    `;
  }
}

/** Marks a lead as booked once the scheduler confirms an appointment. */
export async function markLeadBooked(match: { email?: string | null; phone?: string | null }) {
  const sql = db();
  if (!sql) return null;

  return quietly(async () => {
    const phoneE164 = toE164(match.phone);
    const rows = (await sql`
      update leads set
        status = case when status in ('new', 'contacted') then 'booked' else status end,
        booked_at = coalesce(booked_at, now()),
        updated_at = now()
      where created_at > now() - interval '30 days'
        and (
          (${phoneE164}::text is not null and phone_e164 = ${phoneE164})
          or (${match.email ?? null}::text is not null and lower(email) = lower(${match.email ?? null}))
        )
      returning id
    `) as unknown as { id: string }[];
    return rows[0]?.id ?? null;
  });
}
