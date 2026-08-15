import { requireDb } from '@/lib/db';
import { getMarketingJob } from '@/lib/marketing/queries';
import { getVoice } from '@/lib/marketing/voice';
import { assertClean } from '@/lib/marketing/sanitize';
import { checkClaims, type Flag } from '@/lib/marketing/claims';
import { buildPrompt, channelSpec, PROMPT_VERSION } from '@/lib/marketing/prompts';

/**
 * Writing a draft from one repair.
 *
 * The order of operations is the design:
 *
 *   1. read the job from the local copy of the safe dataset;
 *   2. run the sanitiser and **refuse outright** if it finds anything — the
 *      data is already redacted, so a hit is a broken redactor, and the wrong
 *      response to a broken redactor is to send the text anyway;
 *   3. build a prompt whose outline contains only the sections the present
 *      fields support;
 *   4. read the draft back against those same fields and flag anything that
 *      could not have come from them;
 *   5. store it as a draft. Nothing publishes, nothing goes out, nobody is
 *      notified. A person reads it next.
 *
 * No streaming and no cleverness about latency: this is a person clicking a
 * button once and waiting twenty seconds for something they will then spend
 * five minutes editing.
 */

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-5';
/**
 * An article with its meta fields runs well past a thousand words. At two
 * thousand tokens the reply was being cut off, which is one of the two ways
 * "the model did not reply with JSON" happens.
 */
const MAX_TOKENS = 4000;
const TIMEOUT_MS = 90_000;

export class GenerationError extends Error {}

export interface Draft {
  channel: string;
  title: string | null;
  slug: string | null;
  metaTitle: string | null;
  metaDesc: string | null;
  body: string;
  flags: Flag[];
  model: string;
}

/**
 * What the reply has to look like, as a tool the model is made to call.
 *
 * Asking for JSON in words is a request; a tool with a schema is a shape the
 * answer has to fit. This model refuses an assistant prefill — the other way of
 * forcing it — and refusing outright is better than the failure it replaces:
 * a model handed a note in Ukrainian answered in prose, and there was no JSON
 * to find at all.
 */
function draftTool(fields: readonly string[], photoCount: number) {
  const properties: Record<string, unknown> = {};
  for (const field of fields) {
    properties[field] = { type: 'string', description: FIELD_DESCRIPTIONS[field] ?? field };
  }
  const required = [...fields];
  if (photoCount > 0) {
    // Every picture needs a line describing it — for the reader who cannot see
    // it and for the search engine that cannot either. The photographs are
    // attached to the message, so this is written from the picture rather than
    // from the job sheet.
    properties.photoAlts = {
      type: 'array',
      description:
        `One short description per photograph, ${photoCount} in all, in the order shown. ` +
        'Say what is visible in that frame — "lint packed around the dryer blower housing", ' +
        '"frost across the freezer floor" — never the repair in general and never a part ' +
        'you cannot see. No customer, no room, no address.',
      items: { type: 'string' },
    };
    required.push('photoAlts');
  }
  return {
    name: 'draft',
    description: 'Return the finished piece.',
    input_schema: { type: 'object' as const, properties, required },
  };
}

const FIELD_DESCRIPTIONS: Record<string, string> = {
  title: 'The headline, under 60 characters.',
  slug: 'URL slug, lowercase and hyphenated, under 60 characters.',
  metaTitle: 'Search title, under 60 characters.',
  metaDesc: 'Search description, 140–160 characters, no quotation marks.',
  body: 'The text itself, in American English.',
};

/** The SDK is one fetch call; a dependency for it would be the larger cost. */
/**
 * The photographs themselves, small enough to send.
 *
 * A phone camera file is three or four megabytes and the API takes base64, so
 * anything not resized would triple in transit for no gain — a description
 * needs to recognise a part, not read a serial number. Nothing here resizes,
 * though: the project has nine dependencies and none of them decode JPEG. The
 * cap is a refusal instead, and a photograph too large to send simply does not
 * get described rather than getting described wrongly.
 */
const MAX_PHOTO_BYTES = 3_500_000;

async function loadPhotos(photoIds: string[]): Promise<PhotoImage[]> {
  const { fetchMarketingPhoto } = await import('@/lib/marketing/client');
  const out: PhotoImage[] = [];

  for (const photoId of photoIds) {
    try {
      const res = await fetchMarketingPhoto(photoId);
      if (!res) continue;
      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length === 0 || buffer.length > MAX_PHOTO_BYTES) continue;
      const type = res.headers.get('content-type') ?? 'image/jpeg';
      if (!type.startsWith('image/')) continue;
      out.push({ media_type: type.split(';')[0], data: buffer.toString('base64') });
    } catch {
      // A photograph that will not load is one the piece describes from the
      // job sheet instead. Never a reason to fail the whole draft.
    }
  }
  return out;
}

/**
 * Re-describe the photographs on a job, and nothing else.
 *
 * Every article published before the model was shown its own pictures carries
 * invented descriptions — a frosted freezer floor captioned "evaporator fan
 * motor being installed" (owner report). Regenerating the whole piece would
 * also rewrite body text that has already been read and approved, so this
 * touches alt text alone.
 */
export async function describePhotos(jobId: string): Promise<{ described: number }> {
  const detail = await getMarketingJob(jobId);
  if (!detail) throw new GenerationError('That job is not in the marketing table.');

  const chosen = detail.photos
    .filter((photo) => photo.selected)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  if (chosen.length === 0) return { described: 0 };

  const images = await loadPhotos(chosen.map((photo) => photo.photo_id));
  if (images.length === 0) {
    throw new GenerationError('None of the photographs could be loaded, so none were described.');
  }

  const prompt = [
    'Write one short description per photograph, in order, for the photoAlts list.',
    '',
    'Describe only what is actually in the frame. Name the part if it is identifiable;',
    'say "frost across the freezer floor" if that is what it is. Do not describe the repair,',
    'do not name a component that is not visible, and do not guess. These are read aloud to',
    'people who cannot see the picture and are indexed as fact.',
    '',
    'No customer, no room, no address, no part numbers.',
  ].join('\n');

  const reply = await ask(prompt, [], images.length, images);
  const parsed = parse(reply);
  const alts = Array.isArray(parsed.photoAlts)
    ? (parsed.photoAlts as unknown[]).map((alt) => str(alt))
    : [];

  const sql = requireDb();
  let described = 0;
  await Promise.all(
    chosen.slice(0, images.length).map((photo, index) => {
      const alt = alts[index];
      if (!alt) return null;
      described += 1;
      return sql`
        update marketing_photo set alt_text = ${alt}
        where job_id = ${jobId} and photo_id = ${photo.photo_id}
      `;
    }).filter(Boolean) as Promise<unknown>[]
  );

  return { described };
}

interface PhotoImage {
  media_type: string;
  data: string;
}

async function ask(
  prompt: string,
  fields: readonly string[],
  photoCount = 0,
  images: PhotoImage[] = []
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new GenerationError(
      'No ANTHROPIC_API_KEY is set, so nothing can be written. Everything else on this ' +
        'page works without it — the material is here to be read and used by hand.'
    );
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [
        {
          role: 'user',
          // The photographs go in the same turn, in the order they will appear,
          // each announced by its number. The model used to be told "you have
          // not seen them" and asked to describe them anyway — which produced
          // "evaporator fan motor being installed" under a picture of a frosted
          // freezer floor, published on the public site (owner report).
          content: [
            ...images.flatMap((image, index) => ([
              { type: 'text', text: `Photograph ${index + 1}:` },
              { type: 'image', source: { type: 'base64', media_type: image.media_type, data: image.data } },
            ])),
            { type: 'text', text: prompt },
          ],
        },
      ],
      tools: [draftTool(fields, photoCount)],
      // Not "you may use this tool" — this tool, this turn.
      tool_choice: { type: 'tool', name: 'draft' },
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new GenerationError(
      `The model refused the request (${response.status}). ${detail.slice(0, 200)}`
    );
  }

  const data = (await response.json()) as {
    content?: Array<{ type: string; text?: string; input?: unknown }>;
  };
  const blocks = data.content ?? [];

  // The tool call is the answer. Its arguments are already an object — there
  // is nothing left to parse and nothing left to go wrong.
  const call = blocks.find((block) => block.type === 'tool_use' && block.input);
  if (call) return JSON.stringify(call.input);

  // A model that answered in prose anyway. Keep the old path so the brace hunt
  // still gets its chance, and say what was said if it does not.
  const text = blocks
    .filter((block) => block.type === 'text')
    .map((block) => block.text ?? '')
    .join('');
  if (!text.trim()) throw new GenerationError('The model returned nothing.');
  return text;
}

/**
 * The reply, as JSON.
 *
 * Asked for bare JSON and usually given it, but a model that wraps the object
 * in a fence or a sentence is not worth failing a generation over — so the
 * outermost braces are found rather than assumed.
 */
function parse(reply: string): Record<string, unknown> {
  const start = reply.indexOf('{');
  const end = reply.lastIndexOf('}');
  if (start < 0 || end <= start) {
    // Say what it did reply with. "Did not reply with JSON" on its own leaves
    // nobody anything to act on — the first line of the actual answer usually
    // explains itself.
    throw new GenerationError(
      `The model did not reply with JSON. It said: ${reply.trim().slice(0, 200)}`
    );
  }
  try {
    return JSON.parse(reply.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    throw new GenerationError('The model replied with something that is not valid JSON.');
  }
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/** Slugs are unique in the database; a collision must not lose the draft. */
async function freeSlug(candidate: string, jobId: string): Promise<string> {
  const sql = requireDb();
  const base = candidate
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);

  for (let suffix = 0; suffix < 20; suffix += 1) {
    const slug = suffix === 0 ? base : `${base}-${suffix + 1}`;
    const [taken] = (await sql`
      select job_id from marketing_content where slug = ${slug}
    `) as unknown as { job_id: string }[];
    if (!taken || taken.job_id === jobId) return slug;
  }
  return `${base}-${Date.now()}`;
}

export async function generate(jobId: string, channel: string): Promise<Draft> {
  const spec = channelSpec(channel);
  if (!spec) throw new GenerationError(`No such channel: ${channel}`);

  const detail = await getMarketingJob(jobId);
  if (!detail) throw new GenerationError('That job is not in the console.');
  const { job } = detail;

  // The gate. Before the prompt is even built.
  assertClean({
    diagnosis: job.diagnosis,
    'the repair': job.repair_performed,
    "the technician's note": job.technician_notes,
  });

  const voice = await getVoice();
  // Only the pictures that were chosen, in the order they were chosen — the
  // same list the article will show.
  const chosen = detail.photos
    .filter((photo) => photo.selected)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const wantsPhotos = spec.fields.includes('body') && spec.key === 'article' && chosen.length > 0;

  // Only the photographs that will actually be published are loaded, and only
  // when the piece has room for them.
  const images = wantsPhotos ? await loadPhotos(chosen.map((photo) => photo.photo_id)) : [];

  const reply = await ask(
    buildPrompt(job, spec, voice, wantsPhotos ? chosen : [], images.length),
    spec.fields,
    wantsPhotos ? chosen.length : 0,
    images
  );
  const parsed = parse(reply);

  const body = str(parsed.body);
  if (!body) throw new GenerationError('The model returned no body text.');

  // Keep the descriptions with the photographs they belong to. Written once,
  // corrected in the console if they are wrong.
  if (wantsPhotos && Array.isArray(parsed.photoAlts)) {
    const alts = (parsed.photoAlts as unknown[]).map((alt) => str(alt));
    const sql = requireDb();
    await Promise.all(
      chosen.map((photo, index) => {
        const alt = alts[index];
        if (!alt) return null;
        return sql`
          update marketing_photo set alt_text = ${alt}
          where job_id = ${jobId} and photo_id = ${photo.photo_id}
        `;
      }).filter(Boolean) as Promise<unknown>[]
    );
  }

  const title = spec.fields.includes('title') ? str(parsed.title) : null;
  const slug = spec.fields.includes('slug')
    ? await freeSlug(str(parsed.slug) || title || `${job.appliance_type ?? 'repair'}-${jobId}`, jobId)
    : null;

  // Everything the reader will see, checked together — a fabricated part
  // number in a meta description counts exactly as much as one in the body.
  const flags = checkClaims(
    [title, str(parsed.metaTitle), str(parsed.metaDesc), body].filter(Boolean).join('\n\n'),
    job,
    voice
  );

  const sql = requireDb();
  const [row] = (await sql`
    insert into marketing_content (
      job_id, channel, status, title, slug, meta_title, meta_desc,
      generated_body, model, prompt_version, flags, updated_at
    ) values (
      ${jobId}, ${channel}, 'generated', ${title}, ${slug},
      ${spec.fields.includes('metaTitle') ? str(parsed.metaTitle) : null},
      ${spec.fields.includes('metaDesc') ? str(parsed.metaDesc) : null},
      ${body}, ${MODEL}, ${PROMPT_VERSION}, ${sql.json(flags as never)}, now()
    )
    on conflict (job_id, channel) do update set
      -- The edit is not touched. Regenerating gives you a new draft to compare
      -- against your own version, not a new version of your own version.
      status         = case when marketing_content.edited_body is null
                            then 'generated' else marketing_content.status end,
      title          = excluded.title,
      slug           = coalesce(marketing_content.slug, excluded.slug),
      meta_title     = excluded.meta_title,
      meta_desc      = excluded.meta_desc,
      generated_body = excluded.generated_body,
      model          = excluded.model,
      prompt_version = excluded.prompt_version,
      flags          = excluded.flags,
      updated_at     = now()
    returning id
  `) as unknown as { id: string }[];

  // The attempt is kept whatever happens to it next. This is what makes
  // "Write again" a safe press: the previous draft is still here, so trying
  // once more costs nothing you cannot get back.
  if (row) {
    await sql`
      insert into marketing_content_version (content_id, source, title, body, model, prompt_version, flags)
      values (${row.id}, 'model', ${title}, ${body}, ${MODEL}, ${PROMPT_VERSION}, ${sql.json(flags as never)})
    `;
  }

  return {
    channel,
    title,
    slug,
    metaTitle: str(parsed.metaTitle),
    metaDesc: str(parsed.metaDesc),
    body,
    flags,
    model: MODEL,
  };
}
