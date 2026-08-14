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
const MAX_TOKENS = 2000;
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

/** The SDK is one fetch call; a dependency for it would be the larger cost. */
async function ask(prompt: string): Promise<string> {
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
      messages: [{ role: 'user', content: prompt }],
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new GenerationError(
      `The model refused the request (${response.status}). ${detail.slice(0, 200)}`
    );
  }

  const data = (await response.json()) as { content?: Array<{ type: string; text?: string }> };
  const text = (data.content ?? [])
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
    throw new GenerationError('The model did not reply with JSON.');
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
  const reply = await ask(buildPrompt(job, spec, voice));
  const parsed = parse(reply);

  const body = str(parsed.body);
  if (!body) throw new GenerationError('The model returned no body text.');

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
  await sql`
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
  `;

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
