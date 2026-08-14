import { siteConfig } from '@/data/site-config';
import type { MarketingJobRow } from '@/lib/marketing/queries';
import type { BrandVoice } from '@/lib/marketing/voice';

/**
 * Reading the draft back against the facts it was allowed to use.
 *
 * The prompt tells the model not to invent. This checks whether it did — not
 * by judging the prose, which is a person's job, but by looking at the parts of
 * a draft where an invention is both likely and checkable: a part number, an
 * error code, a model, a price, a year. Those come from somewhere, and there
 * are only two legitimate somewheres: this job's data, and the short list of
 * business facts.
 *
 * Everything here is a flag, not a block. A flagged draft is still shown — the
 * point is that nobody has to read four hundred words hunting for the one
 * number that was made up.
 */

export interface Flag {
  label: string;
  /** The offending text, short enough to read in a list. */
  excerpt: string;
}

/** Phrases that would be a problem however well they were written. */
const RISKY = [
  { pattern: /\bguarantee[ds]?\b/gi, label: 'a guarantee' },
  { pattern: /\bcheapest|lowest price|beat any price\b/gi, label: 'a price claim' },
  { pattern: /\b(?:#\s?1|number one|the best in|top[- ]rated)\b/gi, label: 'a superlative' },
  { pattern: /\b(?:five|5)[- ]star|reviews? say|our customers say\b/gi, label: 'an implied review' },
  { pattern: /\b24\/7|around the clock\b/gi, label: 'a 24/7 claim' },
  { pattern: /\b(?:the )?(?:customer|homeowner|client|owner) (?:said|told|asked|called|reported)/gi, label: 'a customer being quoted' },
];

/**
 * Personal detail, checked against finished prose rather than a technician's
 * shorthand — which is why these are not the sanitiser's rules.
 *
 * The sanitiser guards the input and is deliberately greedy: it treats any
 * "code <word>" as an access code and any "called <Name>" as a customer,
 * because over-cutting a note costs nothing. Run against an article those two
 * fire on "plumbing code fixture" and on half the sentences that mention a
 * service call, and a warning that cries wolf is a warning nobody reads.
 *
 * So the greedy pair is dropped here and the rest kept. Nothing is lost: the
 * draft can only contain what the prompt contained, and the prompt was already
 * through the strict gate.
 */
const PROSE_PII = [
  { label: 'an email address', pattern: /[\w.+-]+@[\w-]+\.[\w.-]+/gi },
  { label: 'a phone number that is not ours', pattern: /(?:\+?1[\s.-]?)?\(?\b\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g },
  {
    label: 'a street address',
    pattern:
      /\b\d+\s+[A-Za-z][\w'-]*(?:\s+[A-Za-z][\w'-]*)?\s+(?:st|street|ave|avenue|rd|road|dr|drive|ln|lane|blvd|boulevard|ct|court|way|pl|place|ter|terrace|cir|circle)\b\.?/gi,
  },
  // Narrowed to an actual code: a named enclosure, and a token with a digit in
  // it. "gate code 4432" still fires; "plumbing code fixture" does not.
  {
    label: 'an access code',
    pattern: /\b(?:gate|door|lock\s*box|lockbox|garage|access|entry)\s*code\s*(?:is|=|:|#)?\s*(?=[\w-]*\d)[\w-]{2,12}\b/gi,
  },
  { label: 'coordinates', pattern: /-?\b\d{1,3}\.\d{4,}\s*,\s*-?\d{1,3}\.\d{4,}\b/g },
  { label: 'a card number', pattern: /\b(?:\d[ -]?){13,19}\b/g },
];

function digits(value: string): string {
  return value.replace(/\D/g, '');
}

export function checkClaims(text: string, job: MarketingJobRow, voice: BrandVoice): Flag[] {
  const flags: Flag[] = [];
  const seen = new Set<string>();
  const add = (label: string, excerpt: string) => {
    const key = `${label}:${excerpt.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    flags.push({ label, excerpt });
  };

  // --- personal detail -----------------------------------------------------
  // The shop's own number is in the call to action and is not a disclosure, so
  // it is taken out first — and every later check runs on the result, or the
  // part-number scan reads "749-0006" as an invented part.
  const ownPhone = digits(siteConfig.contact.phone);
  const prose = text.replace(
    /(?:\+?1[\s.-]?)?\(?\b\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
    (match) => (digits(match).replace(/^1/, '') === ownPhone ? '[our number]' : match)
  );

  for (const { label, pattern } of PROSE_PII) {
    for (const match of prose.matchAll(pattern)) {
      if (label === 'a card number' && digits(match[0]).length < 13) continue;
      add(`personal detail: ${label}`, '—');
    }
  }

  // --- numbers that should have come from the job --------------------------
  const knownParts = new Set(
    job.replaced_parts.map((p) => (p.partNumber ?? '').toUpperCase()).filter(Boolean)
  );
  const knownCodes = new Set(job.error_codes.map((c) => c.toUpperCase()));
  const knownModel = (job.model ?? '').toUpperCase();

  // A part or model number: has letters and digits, or is a long digit run.
  for (const match of prose.matchAll(/\b(?=[A-Z0-9-]{5,})(?=[A-Z0-9-]*\d)[A-Z0-9][A-Z0-9-]{4,}\b/g)) {
    const token = match[0].toUpperCase();
    if (knownParts.has(token) || knownCodes.has(token) || token === knownModel) continue;
    add('a part or model number not in the job data', match[0]);
  }

  for (const match of prose.matchAll(/\b([A-Z]{1,2}\d{1,3})\b/g)) {
    const code = match[1].toUpperCase();
    if (knownCodes.has(code) || code === knownModel) continue;
    add('an error code not in the job data', match[1]);
  }

  // --- money ---------------------------------------------------------------
  // The dataset carries no prices at all, so the only permissible figure is one
  // the business facts already state.
  const allowedMoney = new Set(
    voice.facts.flatMap((fact) => [...fact.matchAll(/\$\s?([\d,]+)/g)].map((m) => m[1].replace(/,/g, '')))
  );
  for (const match of prose.matchAll(/\$\s?([\d,]+)/g)) {
    if (allowedMoney.has(match[1].replace(/,/g, ''))) continue;
    add('a price that is neither in the job data nor an agreed business fact', match[0]);
  }

  // --- time and dates ------------------------------------------------------
  for (const match of prose.matchAll(/\b(?:19|20)\d{2}\b/g)) {
    add('a year, which is not in the job data', match[0]);
  }

  // --- claims --------------------------------------------------------------
  for (const { pattern, label } of RISKY) {
    for (const match of prose.matchAll(pattern)) add(label, match[0]);
  }

  return flags;
}
