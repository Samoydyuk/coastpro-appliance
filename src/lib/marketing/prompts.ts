import type { MarketingJobRow } from '@/lib/marketing/queries';
import type { BrandVoice } from '@/lib/marketing/voice';

/**
 * Turning one repair into a brief.
 *
 * The rule this file exists to enforce: **the outline is built from the fields
 * that are actually present.** A job with no diagnosis does not get a "what we
 * found" section with the model's best guess in it — it gets an outline with no
 * such section. Telling a model "do not invent" and then handing it a heading
 * called "The fault" with nothing under it is an invitation, not an instruction.
 *
 * So the outline below is assembled in code, section by section, each one
 * conditional on the field it is written from. What the model is asked to do is
 * write; what it is asked not to do is supply facts, and the way it is stopped
 * is by never being asked for one.
 */

export const PROMPT_VERSION = '1';

export interface ChannelSpec {
  key: string;
  label: string;
  /** What the piece is for, in the model's terms. */
  brief: string;
  /** Keys the model must return. Anything else is dropped. */
  fields: Array<'title' | 'slug' | 'metaTitle' | 'metaDesc' | 'body'>;
  length: string;
}

export const CHANNELS: ChannelSpec[] = [
  {
    key: 'article',
    label: 'Article',
    brief:
      'A page on the shop\'s own website about this repair. Its reader arrived from a search ' +
      'for the same symptom and wants to know what the fault usually turns out to be, whether ' +
      'it is fixable, and roughly what happens next.',
    fields: ['title', 'slug', 'metaTitle', 'metaDesc', 'body'],
    length: '450–700 words of body, in markdown, with ## subheadings.',
  },
  {
    key: 'instagram',
    label: 'Instagram',
    brief:
      'A caption for a photo of this repair. Opens with the specific thing that was wrong, ' +
      'not with a question or a hook. Hashtags on their own last line, at most six, all of ' +
      'them either the appliance, the brand, the fault or the town.',
    fields: ['body'],
    length: '60–110 words plus the hashtag line.',
  },
  {
    key: 'facebook',
    label: 'Facebook',
    brief:
      'A post for the shop\'s page. Reads like the owner wrote it between jobs: what came in, ' +
      'what it turned out to be, what was done. No hashtags.',
    fields: ['body'],
    length: '80–150 words.',
  },
  {
    key: 'google_business',
    label: 'Google Business',
    brief:
      'A Google Business Profile update. Local and concrete — the town and the appliance in ' +
      'the first sentence, because that is what the listing is being read for.',
    fields: ['body'],
    length: 'Under 750 characters, and it must end with the call to action.',
  },
  {
    key: 'short',
    label: 'Short version',
    brief:
      'Two sentences that can sit under a photo anywhere: what was wrong, what was done. ' +
      'No call to action, no hashtags.',
    fields: ['body'],
    length: 'Two sentences.',
  },
];

export function channelSpec(key: string): ChannelSpec | undefined {
  return CHANNELS.find((c) => c.key === key);
}

/** The fields that survived the whitelist and the redactor, named plainly. */
function material(job: MarketingJobRow): string[] {
  const lines: string[] = [];

  if (job.appliance_type) lines.push(`Appliance: ${job.appliance_type}`);
  if (job.manufacturer) lines.push(`Brand: ${job.manufacturer}`);
  if (job.model) lines.push(`Model: ${job.model}`);
  if (job.error_codes.length) lines.push(`Error codes shown: ${job.error_codes.join(', ')}`);
  if (job.diagnosis) lines.push(`What the technician found: ${job.diagnosis}`);
  if (job.repair_performed) lines.push(`What the technician did: ${job.repair_performed}`);
  if (job.technician_notes) lines.push(`Technician's note for the website: ${job.technician_notes}`);
  if (job.replaced_parts.length) {
    lines.push(
      // Descriptions only. A part number in a public article is a shopping
      // list for somebody else's van — the owner's rule, and the surest way to
      // keep it is never to put the number in front of the model.
      `Parts replaced: ${job.replaced_parts
        .map((p) => p.description)
        .join('; ')}`
    );
  }
  if (job.city) lines.push(`Town: ${[job.city, job.state].filter(Boolean).join(', ')}`);

  return lines;
}

/**
 * The outline, built only from what is there.
 *
 * Each entry names the section and the field it is written from. A field that
 * is absent contributes no entry, which is the whole mechanism.
 */
function outline(job: MarketingJobRow): string[] {
  const sections: string[] = [];

  const symptom = job.error_codes.length
    ? `the symptom, including the code ${job.error_codes.join('/')}`
    : 'the symptom';
  sections.push(`Open with ${symptom} on a ${[job.manufacturer, job.appliance_type].filter(Boolean).join(' ') || 'appliance'}.`);

  if (job.diagnosis) sections.push('A section on what the fault turned out to be, from "what the technician found".');
  // The mockup the owner drew has this between the finding and the repair, and
  // it is the paragraph a reader actually wants: not what broke, but why that
  // produces the symptom they are living with. Rule 8 already allows general
  // mechanism, and this is where it belongs.
  if (job.diagnosis) {
    sections.push(
      'A section headed "Why It Happened": how that fault produces this symptom, in general ' +
        'terms. Nothing specific to this machine beyond what is above.'
    );
  }
  if (job.repair_performed) sections.push('A section on the repair itself, from "what the technician did".');
  if (job.replaced_parts.length) sections.push('Name the parts that were replaced, by what they are — never by part number.');
  if (job.technician_notes) sections.push("A short section built on the technician's note.");
  if (job.city) sections.push('One mention of the town, in passing. Not a paragraph about the area.');
  // Written as a list on purpose: the page renders this section as a ticked
  // checklist, and a reader deciding whether they have the same fault scans it
  // rather than reading it. Prose here loses the ticks and the scanning.
  sections.push(
    'A section headed "What to Expect": three or four bullet points, each one sign somebody ' +
      'with this fault would notice. Bullets only — no paragraph before or after them.'
  );
  sections.push('Close with the call to action, once.');

  return sections;
}

/** What is missing, stated so it is a boundary rather than a gap to fill. */
function absent(job: MarketingJobRow): string[] {
  const missing: string[] = [];
  if (!job.diagnosis) missing.push('what the fault turned out to be');
  if (!job.repair_performed) missing.push('what was actually done');
  if (!job.replaced_parts.length) missing.push('which parts were replaced');
  if (!job.error_codes.length) missing.push('any error code');
  if (!job.model) missing.push('the model number');
  if (!job.manufacturer) missing.push('the brand');
  if (!job.city) missing.push('the town');
  return missing;
}

export function buildPrompt(
  job: MarketingJobRow,
  spec: ChannelSpec,
  voice: BrandVoice,
  /** The photographs chosen for this piece, in the order they will appear. */
  photos: Array<{ category: string | null; caption: string | null }> = [],
  /// How many of them are attached to the message as images. The rest, if any,
  /// were too large or failed to load and can only be described from the job.
  attached = 0
): string {
  const missing = absent(job);

  return [
    `Write one piece of content for ${voice.businessName}, an appliance repair shop working in ${voice.serviceArea}.`,
    '',
    `## What this piece is`,
    spec.brief,
    `Length: ${spec.length}`,
    '',
    '## The job, and the only facts about it that exist',
    ...material(job).map((line) => `- ${line}`),
    '',
    '## How it should sound',
    voice.tone,
    `Call to action, when one is called for: ${voice.callToAction}`,
    '',
    '## Structure',
    ...outline(job).map((line) => `- ${line}`),
    '',
    ...(photos.length
      ? [
          '## The photographs',
          attached > 0
            ? `The ${attached === photos.length ? '' : 'first '}${attached} photograph${attached === 1 ? '' : 's'} above ${attached === 1 ? 'is' : 'are'} the ones that will appear with the piece, in that order.`
            : 'These will appear with the piece, in this order.',
          'Write one description per photograph for photoAlts.',
          attached > 0
            ? 'Describe only what you can actually see in the frame. If a photograph shows frost, say frost; do not name a part that is not visible, and do not describe the repair the article is about unless the picture shows it. A wrong description is published as fact and read by people who cannot see the image.'
            : 'Say what is in the frame from what is known below — never invent detail.',
          ...photos.map((photo, index) => {
            const what = [photo.category, photo.caption].filter(Boolean).join(' — ');
            return `${index + 1}. ${what || (index < attached ? 'see the photograph above' : 'a photograph from the job')}`;
          }),
          '',
        ]
      : []),
    '## Rules, in order of importance',
    '1. Every fact about this repair must come from the list above. If something is not there,',
    '   it is not known, and it must not appear — not as a guess, not as a hedge, not as a',
    '   "typically" or "in most cases" sentence standing in for it.',
    missing.length
      ? `   Not known for this job, and therefore not to be written about: ${missing.join('; ')}.`
      : '   Every field is present for this job.',
    '2. Where the text above says [removed], personal detail was deliberately taken out. Do not',
    '   refer to it, work around it, or guess what it was. Write as if that clause is not there.',
    '3. Facts about the business may only be the following, verbatim in substance:',
    ...voice.facts.map((fact) => `   - ${fact}`),
    '4. A part is named by what it is — "the evaporator fan motor", "the defrost heater" — and ' +
      'never by its number. Not in the text, not in a heading, not in a list. The machine\'s own ' +
      'model may be written; its parts may not be numbered (owner\'s rule).',
    '5. Never write any of these:',
    ...voice.forbidden.map((rule) => `   - ${rule}`),
    '6. No customer is ever mentioned, described, quoted or alluded to. The subject is the',
    '   appliance and the fault, not the household.',
    '7. The headline obeys rule 1 like every other sentence. A fault that is not in the list',
    '   above must not appear in it, as a question or otherwise — "Not heating?" on a job that',
    '   never mentioned heat is an invented fact with a question mark on it.',
    '8. General knowledge about how this kind of appliance works is allowed and useful, as long',
    '   as it is clearly general and is not presented as something found on this job.',
    '',
    '## Output',
    // The technician writes for themselves, in whatever language is quickest —
    // the note this is built from may well be in Ukrainian. That must change
    // nothing about what comes out.
    'The material above may be in any language. Write in American English regardless.',
    'Reply with JSON only — no preamble, no code fence — with exactly these keys:',
    ...spec.fields.map((field) => `- ${field}: ${FIELD_HELP[field]}`),
  ].join('\n');
}

const FIELD_HELP: Record<string, string> = {
  // 45, not 60: the site appends " | CoastPro" to every title, and a result
  // is cut at about sixty characters. Sixty here means seventy-one there, and
  // the eleven characters that fall off the end are the ones the model chose
  // to finish on.
  title:
    'the headline, under 45 characters. Name the appliance, and the fault ONLY if the ' +
    'material above says what the fault was. With no diagnosis, the headline is about what ' +
    'the piece is actually about — never a symptom nobody reported.',
  slug: 'url slug, lowercase, hyphenated, under 60 characters',
  metaTitle: 'search title, under 45 characters',
  metaDesc: 'search description, 140–160 characters, no quotation marks',
  body: 'the text itself',
};
