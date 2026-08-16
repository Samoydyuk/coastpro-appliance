import { requireDb } from '@/lib/db';
import { getMarketingJob } from '@/lib/marketing/queries';
import { TREATMENT_VERSION, tokens } from '@/lib/marketing/treatment-tokens';

/**
 * What a photograph is of, and how it should be dressed.
 *
 * The model is shown the picture and told the job. It answers with what it can
 * see — the subject and where it sits — and with wording drawn from the job
 * sheet. It is not allowed to diagnose: a control panel reading F11 gets
 * "DRAINAGE FAULT" because that is what the code means, and "FAILED DRAIN PUMP"
 * only if a technician wrote that down.
 *
 * Prepared automatically, corrected by hand. A piece must not go up as a set of
 * raw snapshots because nobody pressed a button — so publishing dresses
 * anything undressed — and everything it decides can be overruled in the
 * console afterwards.
 */

export type PhotoType =
  | 'error_code'
  | 'failed_part'
  | 'diagnostic_area'
  | 'before'
  | 'after'
  | 'repair_process'
  | 'completed_repair'
  | 'appliance_overview'
  | 'model_serial'
  | 'damage'
  | 'maintenance'
  | 'other';

export type LayoutName = 'field_note' | 'detail' | 'before' | 'after' | 'process' | 'clean';

export type OverlayCorner = 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right';

export interface Treatment {
  photoType: PhotoType;
  /** Where the thing the photograph is about sits, 0–1 of the frame. */
  subject: { x: number; y: number; w: number; h: number } | null;
  confidence: number;
  layout: LayoutName;
  /** The emptiest corner — where words can go without covering the subject. */
  overlay: OverlayCorner;

  label: string | null;
  main: string | null;
  headline: string | null;
  secondary: string | null;
  annotation: { text: string; x: number; y: number } | null;
  footer: string | null;

  /** "02 / 05" — which photograph of this piece it is. */
  index?: string;
  /** The model wanted to point at something and was not sure enough. */
  needsReview?: boolean;
  /** Only the frame that opens a piece carries the wordmark and the town. */
  isHero?: boolean;
  templateVersion: string;
  /** Set when a person has looked at it. */
  approved?: boolean;
}

const MODEL = 'claude-sonnet-5';
const API_URL = 'https://api.anthropic.com/v1/messages';
const TIMEOUT_MS = 90_000;

export class TreatmentError extends Error {}

/** The shape the model must answer in. */
const analysisTool = {
  name: 'describe_photo',
  description: 'What this photograph is of, and how it should be laid out.',
  input_schema: {
    type: 'object' as const,
    properties: {
      photoType: {
        type: 'string',
        enum: [
          'error_code', 'failed_part', 'diagnostic_area', 'before', 'after',
          'repair_process', 'completed_repair', 'appliance_overview',
          'model_serial', 'damage', 'maintenance', 'other',
        ],
        description: 'What the frame is mainly about.',
      },
      subject: {
        type: 'object',
        description:
          'Where that subject sits, as fractions of the frame: x and y are its top-left corner.',
        properties: {
          x: { type: 'number' }, y: { type: 'number' },
          w: { type: 'number' }, h: { type: 'number' },
        },
        required: ['x', 'y', 'w', 'h'],
      },
      confidence: {
        type: 'number',
        description:
          'How sure you are of photoType and subject, 0 to 1. Be honest: under 0.55 the ' +
          'photograph is published clean, with no technical caption, which is the right ' +
          'outcome for a picture you cannot read.',
      },
      emptiestCorner: {
        type: 'string',
        enum: ['top_left', 'top_right', 'bottom_left', 'bottom_right'],
        description: 'The corner with the least detail, where words would cover nothing.',
      },
      main: {
        type: 'string',
        description:
          'The one thing worth reading from across a room, if the photograph has one — an ' +
          'error code you can actually see on a display. Leave empty otherwise. Never invent it.',
      },
      headline: {
        type: 'string',
        description:
          'Two or three words for what this shows, in the job\'s own terms: "DRAINAGE FAULT", ' +
          '"ICE BUILDUP", "FAILED COMPONENT". Uppercase.',
      },
      secondary: {
        type: 'string',
        description: 'One short line under it. A fact from the job, not a sales sentence.',
      },
      annotationText: {
        type: 'string',
        description:
          'Two or three words pointing at one thing in the frame, or empty. Only what is ' +
          'visible and what the job says.',
      },
      annotationPoint: {
        type: 'object',
        description: 'What that annotation points at, in fractions of the frame.',
        properties: { x: { type: 'number' }, y: { type: 'number' } },
        required: ['x', 'y'],
      },
      altText: {
        type: 'string',
        description:
          'One plain sentence describing the frame for somebody who cannot see it. What is ' +
          'actually there — no keyword stuffing, no customer, no address.',
      },
    },
    required: ['photoType', 'confidence', 'emptiestCorner', 'headline', 'altText'],
  },
};

/**
 * What the model may say about this job, spelled out.
 *
 * The rule that matters is the one about diagnosis: an error code on a screen
 * is a symptom, not a verdict, and a caption that names a failed part when the
 * technician only wrote down a code is a fabrication published as fact.
 */
function context(
  job: {
    manufacturer: string | null;
    appliance_type: string | null;
    model: string | null;
    error_codes: string[];
    diagnosis: string | null;
    repair_performed: string | null;
    replaced_parts: Array<{ description: string; partNumber: string | null }>;
    city: string | null;
    state: string | null;
  },
  /**
   * The piece these photographs will appear in.
   *
   * Given because a caption belongs to the article it sits in: the words on a
   * photograph should be the words the reader has just read, in the same terms,
   * rather than a second description of the same repair invented separately
   * (owner's instruction).
   */
  article: { title: string | null; body: string | null } | null
): string {
  const known: string[] = [];
  const appliance = [job.manufacturer, job.appliance_type].filter(Boolean).join(' ');
  if (appliance) known.push(`Appliance: ${appliance}`);
  if (job.model) known.push(`Model: ${job.model}`);
  if (job.error_codes.length) known.push(`Error codes read on the machine: ${job.error_codes.join(', ')}`);
  if (job.diagnosis) known.push(`What the technician diagnosed: ${job.diagnosis}`);
  if (job.repair_performed) known.push(`What was done: ${job.repair_performed}`);
  if (job.replaced_parts.length) {
    known.push(`Parts replaced, by name: ${job.replaced_parts.map((p) => p.description).join('; ')}`);
  }

  return [
    'You are looking at one photograph from a completed appliance repair, and writing the few',
    'words that will sit on it in a technical journal.',
    '',
    '## What is known about this job',
    ...(known.length ? known.map((line) => `- ${line}`) : ['- Nothing beyond the picture itself.']),
    '',
    ...(article?.body
      ? [
          '## The article these photographs illustrate',
          article.title ? `Title: ${article.title}` : '',
          '',
          // Trimmed: the opening carries the symptom and the finding, which is
          // everything a caption needs. A whole piece would crowd out the job
          // facts above it.
          article.body.slice(0, 1800),
          '',
          'Use its wording. A photograph in this piece should be captioned in the same terms the',
          'reader has just met — the same name for the fault, the same name for the part.',
          '',
        ]
      : []),
    '## Rules',
    '1. Describe only what is in the frame. If you cannot make out what a photograph shows, say',
    '   so with a low confidence rather than guessing — it will simply be published clean.',
    '2. Never diagnose. An error code visible on a display is a symptom: F11 justifies',
    '   "DRAINAGE FAULT", and "FAILED DRAIN PUMP" only if the diagnosis above says a pump',
    '   failed. A caption that names a cause nobody found is an invention published as fact.',
    '3. A part is named by what it is and never by its number.',
    '4. No customer, no address, no house number, no telephone, no number plate. The town alone',
    '   is fine and comes from the job, not from anything you read in the picture.',
    '5. Everything uppercase that is meant to be uppercase; short. This is a label on a',
    '   photograph, not a paragraph.',
  ].join('\n');
}

interface PhotoImage {
  media_type: string;
  data: string;
}

async function ask(prompt: string, image: PhotoImage): Promise<Record<string, unknown>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new TreatmentError('No ANTHROPIC_API_KEY is set, so nothing can be analysed.');

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: image.media_type, data: image.data } },
            { type: 'text', text: prompt },
          ],
        },
      ],
      tools: [analysisTool],
      tool_choice: { type: 'tool', name: 'describe_photo' },
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new TreatmentError(`The model refused the request (${response.status}). ${detail.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    content?: Array<{ type: string; input?: Record<string, unknown> }>;
  };
  const call = data.content?.find((block) => block.type === 'tool_use' && block.input);
  if (!call?.input) throw new TreatmentError('The model answered without using the tool.');
  return call.input;
}

const str = (value: unknown): string | null => {
  const text = typeof value === 'string' ? value.trim() : '';
  return text.length > 0 ? text : null;
};

const frac = (value: unknown, fallback: number): number => {
  const n = typeof value === 'number' ? value : Number.NaN;
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : fallback;
};

/**
 * The layout a photograph of this kind wants, before the series has its say.
 *
 * A picture with a readable code on it is the one that earns the full
 * treatment; a part in close-up gets a line; a general view gets nothing but
 * the wordmark.
 */
function layoutFor(type: PhotoType, hasMain: boolean, confidence: number): LayoutName {
  if (confidence < tokens.confidenceFloor) return 'clean';
  switch (type) {
    case 'error_code':
      // A code on a display is the clearest case for the full note, but not the
      // only one — see applyRhythm, which gives the lead photograph the note
      // whether or not there is a number to shout.
      return 'field_note';
    case 'failed_part':
    case 'damage':
    case 'model_serial':
      return 'detail';
    case 'before':
      return 'before';
    case 'after':
    case 'completed_repair':
      return 'after';
    case 'repair_process':
    case 'maintenance':
      return 'process';
    case 'diagnostic_area':
      return 'detail';
    default:
      return 'clean';
  }
}

const LABELS: Record<LayoutName, string | null> = {
  field_note: 'Field Note',
  detail: null,
  before: 'Before',
  after: 'After',
  process: 'Service Journal',
  clean: null,
};

/**
 * One photograph's treatment, from the picture and the job.
 */
function shape(
  answer: Record<string, unknown>,
  footer: string | null
): Treatment & { altText: string | null } {
  const photoType = (str(answer.photoType) ?? 'other') as PhotoType;
  const confidence = frac(answer.confidence, 0);
  const main = str(answer.main);
  const layout = layoutFor(photoType, Boolean(main), confidence);
  const annotationText = str(answer.annotationText);
  const point = (answer.annotationPoint ?? {}) as Record<string, unknown>;
  const box = (answer.subject ?? {}) as Record<string, unknown>;

  return {
    photoType,
    subject:
      typeof box.x === 'number'
        ? { x: frac(box.x, 0), y: frac(box.y, 0), w: frac(box.w, 0.3), h: frac(box.h, 0.3) }
        : null,
    confidence,
    layout,
    overlay: (str(answer.emptiestCorner) ?? 'bottom_left') as OverlayCorner,
    label: LABELS[layout],
    main: layout === 'field_note' ? main : null,
    headline: layout === 'clean' ? null : str(answer.headline),
    secondary: layout === 'clean' ? null : str(answer.secondary),
    // A dot beside the roller reads as "this bracket". Either it is on the
    // component or it is not drawn, and the console says which photographs
    // want a human eye.
    annotation:
      annotationText && layout !== 'clean' && confidence >= tokens.annotationFloor
        ? { text: annotationText, x: frac(point.x, 0.5), y: frac(point.y, 0.5) }
        : null,
    needsReview: Boolean(annotationText) && confidence < tokens.annotationFloor,
    footer,
    templateVersion: TREATMENT_VERSION,
    altText: str(answer.altText),
  };
}

/**
 * A series reads as one story, not as six posters (§23–24).
 *
 * At most one photograph carries the full Field Note; the rest step down to a
 * line or to nothing. Which one keeps it is the one the model was surest of.
 */
export function applyRhythm<T extends { photoId: string; treatment: Treatment }>(
  entries: T[]
): T[] {
  // Paired with their photographs throughout, because this reorders them: a
  // treatment that drifts onto the wrong picture is worse than no treatment.
  const treatments = entries.map((entry) => entry.treatment);
  const total = treatments.length;

  // One name for one thing, across the whole piece.
  //
  // The series came back saying WORN ROLLER on one frame, SUPPORT ROLLER on the
  // next and DESTROYED ROLLER on a third, for the same component — which reads
  // as three findings rather than one (owner report). The most confident
  // wording wins and the rest adopt it.
  const canonical = new Map<string, string>();
  const key = (text: string) =>
    text.toLowerCase().replace(/[^a-z ]/g, '').split(' ').filter((w) => w.length > 3).sort().join(' ');
  for (const t of [...entries.map((e) => e.treatment)].sort((a, b) => b.confidence - a.confidence)) {
    if (!t.headline) continue;
    const k = key(t.headline);
    if (k && !canonical.has(k)) canonical.set(k, t.headline);
  }
  for (const t of entries.map((e) => e.treatment)) {
    if (!t.headline) continue;
    const agreed = canonical.get(key(t.headline));
    if (agreed) t.headline = agreed;
    if (t.annotation) {
      const annotated = canonical.get(key(t.annotation.text));
      if (annotated) t.annotation = { ...t.annotation, text: annotated };
    }
  }

  // The same finding said twice in a series is the series saying it once too
  // often. The first frame carries the words; a later frame showing the same
  // thing keeps its dot and goes quiet.
  const said = new Set<string>();
  for (const t of entries.map((e) => e.treatment)) {
    if (!t.headline) continue;
    const k = key(t.headline);
    if (said.has(k)) {
      t.layout = 'clean';
      t.label = null;
      t.main = null;
      t.headline = null;
      t.secondary = null;
    } else if (k) {
      said.add(k);
    }
  }

  // What opens the piece is the failure, not the front of the machine.
  //
  // A repair note is a documented case, not a catalogue page: the frame worth
  // seeing first is the cracked drum, and the exterior belongs at the end as
  // context (owner's instruction). Ordered by what a photograph is of, then by
  // how sure the model was of it.
  const ROLE_ORDER: PhotoType[] = [
    'damage', 'failed_part', 'error_code', 'diagnostic_area', 'repair_process',
    'completed_repair', 'maintenance', 'model_serial', 'before', 'after',
    'appliance_overview', 'other',
  ];
  const rank = (t: Treatment) => {
    const position = ROLE_ORDER.indexOf(t.photoType);
    return position < 0 ? ROLE_ORDER.length : position;
  };
  entries.sort(
    (a, b) =>
      rank(a.treatment) - rank(b.treatment) || b.treatment.confidence - a.treatment.confidence
  );

  // The photograph that opens a piece carries the full note. It is the frame
  // people see first and the one the house style is recognised by.
  const lead = entries[0]?.treatment;
  if (lead && lead.confidence >= tokens.confidenceFloor && lead.headline) {
    lead.layout = 'field_note';
    lead.label = LABELS.field_note;
  }
  const bestFieldNote = entries
    .map((entry, index) => ({ treatment: entry.treatment, index }))
    .filter(({ treatment }) => treatment.layout === 'field_note')
    .sort((a, b) => b.treatment.confidence - a.treatment.confidence)[0];

  // No more than a third of a set may carry a heavy treatment, and never more
  // than two — a page where every picture shouts is a page nobody reads.
  const heavyAllowed = Math.max(1, Math.min(2, Math.round(total * 0.2)));
  let heavyUsed = 0;

  return entries.map((entry, index) => {
    const treatment = entry.treatment;
    const numbered = {
      ...treatment,
      index: `${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`,
      // The reader is already on CoastPro and already knows the town by the
      // second photograph. Signing and placing every frame is what makes a
      // series look like five separate posters.
      isHero: index === 0,
      footer: index === 0 ? treatment.footer : null,
    };

    if (numbered.layout === 'field_note') {
      const isChosen =
        index === 0 || (bestFieldNote?.index === index && heavyUsed < heavyAllowed);
      if (isChosen) {
        heavyUsed += 1;
        return { ...entry, treatment: numbered };
      }
      // Demoted, but not silenced: it keeps its headline as a plain detail line.
      return {
        ...entry,
        treatment: { ...numbered, layout: 'detail' as LayoutName, label: null, main: null },
      };
    }
    return { ...entry, treatment: numbered };
  });
}

/** The town, never the address (§14). */
function footerFor(job: {
  manufacturer: string | null;
  appliance_type: string | null;
  city: string | null;
  state: string | null;
}): string | null {
  const appliance = [job.manufacturer, job.appliance_type].filter(Boolean).join(' ');
  const place = [job.city, job.state].filter(Boolean).join(', ');
  const parts = [appliance, place].filter(Boolean);
  return parts.length ? parts.join(' · ') : null;
}

/**
 * Look at every chosen photograph on a job and write down how to dress it.
 *
 * Returns what it wrote so the console can show it before anything is
 * published. Alt text is refreshed at the same time — it comes from the same
 * look at the same picture, so having two passes disagree would be silly.
 */
export async function analysePhotos(
  jobId: string,
  /**
   * Applied straight away rather than held for review.
   *
   * The owner's instruction: photographs are prepared automatically and
   * corrected afterwards if they are wrong, rather than waiting on somebody to
   * agree with each one. What makes that safe is upstream — the model may only
   * use the job's own facts, and anything it is unsure of becomes a plain
   * photograph rather than a confident caption.
   */
  autoApprove = false
): Promise<{ analysed: number }> {
  const detail = await getMarketingJob(jobId);
  if (!detail) throw new TreatmentError('That job is not in the marketing table.');

  const chosen = detail.photos
    .filter((photo) => photo.selected)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  if (chosen.length === 0) return { analysed: 0 };

  const { fetchMarketingPhoto } = await import('@/lib/marketing/client');
  // The article, if one has been written. Photographs are usually dressed
  // straight after it is, so in practice there is one.
  const piece = detail.content.find((row) => row.channel === 'article') ?? null;
  const prompt = context(detail.job, piece
    ? { title: piece.title, body: piece.edited_body ?? piece.generated_body }
    : null);
  const footer = footerFor(detail.job);

  const results: Array<{ photoId: string; treatment: Treatment; altText: string | null } | null> = [];
  for (const photo of chosen) {
    try {
      const res = await fetchMarketingPhoto(photo.photo_id);
      if (!res) { results.push(null); continue; }
      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length === 0 || buffer.length > 3_500_000) { results.push(null); continue; }
      const type = (res.headers.get('content-type') ?? 'image/jpeg').split(';')[0];

      const answer = await ask(prompt, { media_type: type, data: buffer.toString('base64') });
      const { altText, ...treatment } = shape(answer, footer);
      results.push({ photoId: photo.photo_id, treatment, altText });
    } catch (error) {
      // One unreadable photograph is one photograph published plain, not a
      // failed run.
      console.warn('[treatment] photo failed:', (error as Error).message);
      results.push(null);
    }
  }

  const usable = results.filter(Boolean) as Array<{
    photoId: string; treatment: Treatment; altText: string | null;
  }>;
  if (usable.length === 0) {
    throw new TreatmentError('None of the photographs could be read, so none were dressed.');
  }

  const ordered = applyRhythm(usable);

  const sql = requireDb();
  const rev = Date.now().toString(36);
  await Promise.all(
    ordered.map((entry, index) =>
      sql`
        update marketing_photo set
          treatment     = ${sql.json(entry.treatment as never)},
          treatment_rev = ${rev},
          -- The story order, written down: the failure opens the piece and the
          -- exterior closes it, and the article reads them in this order.
          sort_order    = ${index},
          alt_text      = coalesce(${entry.altText}, alt_text),
          approved_at   = ${autoApprove ? new Date() : null},
          approved_by   = ${autoApprove ? 'auto' : null}
        where job_id = ${jobId} and photo_id = ${entry.photoId}
      `
    )
  );

  return { analysed: usable.length };
}
