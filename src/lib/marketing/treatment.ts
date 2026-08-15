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
 * Everything here is a recommendation. Nothing reaches a reader until somebody
 * has looked at it and said yes.
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

  /** "02 / 05" — which photograph of this piece it is (§10, variant B). */
  index?: string;
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
function context(job: {
  manufacturer: string | null;
  appliance_type: string | null;
  model: string | null;
  error_codes: string[];
  diagnosis: string | null;
  repair_performed: string | null;
  replaced_parts: Array<{ description: string; partNumber: string | null }>;
  city: string | null;
  state: string | null;
}): string {
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
      return hasMain ? 'field_note' : 'detail';
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
    annotation:
      annotationText && layout !== 'clean'
        ? { text: annotationText, x: frac(point.x, 0.5), y: frac(point.y, 0.5) }
        : null,
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
export function applyRhythm(treatments: Treatment[]): Treatment[] {
  const total = treatments.length;
  const bestFieldNote = treatments
    .map((treatment, index) => ({ treatment, index }))
    .filter(({ treatment }) => treatment.layout === 'field_note')
    .sort((a, b) => b.treatment.confidence - a.treatment.confidence)[0];

  // No more than a third of a set may carry a heavy treatment, and never more
  // than two — a page where every picture shouts is a page nobody reads.
  const heavyAllowed = Math.max(1, Math.min(2, Math.round(total * 0.2)));
  let heavyUsed = 0;

  return treatments.map((treatment, index) => {
    const numbered = {
      ...treatment,
      index: `${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`,
    };

    if (numbered.layout === 'field_note') {
      const isChosen = bestFieldNote?.index === index && heavyUsed < heavyAllowed;
      if (isChosen) {
        heavyUsed += 1;
        return numbered;
      }
      // Demoted, but not silenced: it keeps its headline as a plain detail line.
      return { ...numbered, layout: 'detail' as LayoutName, label: null, main: null };
    }
    return numbered;
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
export async function analysePhotos(jobId: string): Promise<{ analysed: number }> {
  const detail = await getMarketingJob(jobId);
  if (!detail) throw new TreatmentError('That job is not in the marketing table.');

  const chosen = detail.photos
    .filter((photo) => photo.selected)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  if (chosen.length === 0) return { analysed: 0 };

  const { fetchMarketingPhoto } = await import('@/lib/marketing/client');
  const prompt = context(detail.job);
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

  const withRhythm = applyRhythm(usable.map((entry) => entry.treatment));

  const sql = requireDb();
  const rev = Date.now().toString(36);
  await Promise.all(
    usable.map((entry, index) =>
      sql`
        update marketing_photo set
          treatment     = ${JSON.stringify(withRhythm[index])}::jsonb,
          treatment_rev = ${rev},
          alt_text      = coalesce(${entry.altText}, alt_text),
          approved_at   = null,
          approved_by   = null
        where job_id = ${jobId} and photo_id = ${entry.photoId}
      `
    )
  );

  return { analysed: usable.length };
}
