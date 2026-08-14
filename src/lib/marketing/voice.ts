import { requireDb } from '@/lib/db';
import { siteConfig } from '@/data/site-config';

/**
 * How the shop sounds, and which facts about it may be stated.
 *
 * Two separate things, and keeping them separate is the useful part. The voice
 * is taste and can be argued about. `facts` is the list of business claims the
 * model is allowed to make — the service-call minimum, the arrival window, the
 * warranty — and it exists because everything else the model might assert about
 * the business would be invented. A number that appears in a draft and is not
 * on this list, and not in the job's own data, is flagged before a person
 * reads past it.
 *
 * Defaults come from the site's own config, so the copy and the pages it links
 * to cannot drift apart without somebody deciding they should.
 */

export interface BrandVoice {
  businessName: string;
  serviceArea: string;
  /** Free text: how it should read. Goes into the prompt as-is. */
  tone: string;
  /** Claims that must never appear, whatever the model thinks. */
  forbidden: string[];
  /** Business facts the model may state. Everything else is invention. */
  facts: string[];
  callToAction: string;
}

export const DEFAULT_VOICE: BrandVoice = {
  businessName: siteConfig.name,
  serviceArea: 'Orange County, California',
  tone: [
    'Plain, specific and unexcited — a working technician explaining what happened,',
    'not a brochure. Short sentences. No superlatives, no "nightmare"/"disaster"',
    'openings, no stock phrases like "in today\'s fast-paced world". American English.',
    'Assume the reader has the same appliance and the same fault, and is trying to',
    'work out whether it is worth calling someone.',
  ].join(' '),
  forbidden: [
    'part numbers of any kind — name the part by what it is ("the drain pump"), never by its number',
    'guaranteed results or promises about how long a repair will last',
    'claims about being the cheapest, the best, or number one',
    'invented customer quotes, testimonials or review scores',
    'any named customer, street or neighbourhood',
    'prices for parts or for this particular repair',
  ],
  facts: [
    `Service call minimum $${siteConfig.serviceCall.minimum}, which covers the visit, a full diagnosis and ${siteConfig.serviceCall.includes}.`,
    `If the customer approves a larger repair, the service call is credited against it as labor rather than charged separately — they pay the quoted price for the repair, not the repair plus a visit.`,
    `Arrival is a ${siteConfig.appointment.arrivalWindow} window, and the technician calls at least ${siteConfig.appointment.noticeMinutes} minutes before arriving.`,
    `${siteConfig.trustSignals.warrantyDays}-day warranty on repairs.`,
    `Bigger jobs are quoted for approval before any work starts.`,
    `Phone ${siteConfig.contact.phone}.`,
  ],
  callToAction: `Call ${siteConfig.contact.phone} or book online.`,
};

export async function getVoice(): Promise<BrandVoice> {
  const sql = requireDb();
  const [row] = (await sql`
    select value from settings where key = 'marketing_voice'
  `) as unknown as { value: Partial<BrandVoice> }[];

  // Field by field rather than a whole-object fallback: a half-filled row
  // should not silently drop the defaults for everything it does not mention.
  return {
    businessName: row?.value?.businessName || DEFAULT_VOICE.businessName,
    serviceArea: row?.value?.serviceArea || DEFAULT_VOICE.serviceArea,
    tone: row?.value?.tone || DEFAULT_VOICE.tone,
    forbidden: row?.value?.forbidden?.length ? row.value.forbidden : DEFAULT_VOICE.forbidden,
    facts: row?.value?.facts?.length ? row.value.facts : DEFAULT_VOICE.facts,
    callToAction: row?.value?.callToAction || DEFAULT_VOICE.callToAction,
  };
}

export async function saveVoice(voice: BrandVoice): Promise<void> {
  const sql = requireDb();
  await sql`
    insert into settings (key, value, updated_at)
    values ('marketing_voice', ${sql.json(voice as never)}, now())
    on conflict (key) do update set value = excluded.value, updated_at = now()
  `;
}
