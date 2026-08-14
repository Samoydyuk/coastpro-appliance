/**
 * The second net, in front of the language model.
 *
 * JobPocket already strips personal detail out of the technician's free text
 * on the way here, and the field whitelist means a name or a street was never
 * read in the first place. So nothing this file finds should exist — and that
 * is exactly why it refuses instead of cleaning. A hit means the first net has
 * a hole in it, and the right response to a hole is to stop, not to patch the
 * one sentence and carry on sending everything to a third party.
 *
 * The rules are the same ones the redactor uses on the JobPocket side, kept
 * deliberately in step: if one is tightened there it should be tightened here,
 * because a rule this side does not know about is a rule that cannot catch a
 * regression on the other.
 */

export interface Finding {
  label: string;
  /** Which field it turned up in, so the owner knows where to look. */
  field: string;
}

const RULES: Array<{ label: string; pattern: RegExp }> = [
  { label: 'email', pattern: /[\w.+-]+@[\w-]+\.[\w.-]+/gi },
  {
    label: 'phone',
    pattern: /(?:\+?1[\s.-]?)?\(?\b\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b(?:\s*(?:x|ext\.?)\s*\d+)?/gi,
  },
  {
    label: 'street address',
    pattern:
      /\b\d+\s+[A-Za-z][\w'-]*(?:\s+[A-Za-z][\w'-]*)?\s+(?:st|street|ave|avenue|rd|road|dr|drive|ln|lane|blvd|boulevard|ct|court|way|pl|place|ter|terrace|cir|circle)\b\.?(?:\s*(?:#|apt\.?|unit|ste\.?)\s*[\w-]+)?/gi,
  },
  {
    label: 'access code',
    pattern: /\b(?:gate|door|lock\s*box|lockbox|garage|access|entry)?\s*code\s*(?:is|=|:|#)?\s*[\w-]{2,12}\b/gi,
  },
  { label: 'access code', pattern: /\block\s*box\s*(?:is|=|:|#)?\s*[\w-]{2,12}\b/gi },
  {
    label: 'customer name',
    pattern:
      /\b(?:called|call|calling|texted|text|spoke\s+(?:to|with)|met|asked|told|per)\s+(?:mr\.?|mrs\.?|ms\.?|dr\.?)?\s*[A-Z][a-z]{1,20}(?:\s+[A-Z][a-z]{1,20})?/gi,
  },
  { label: 'coordinates', pattern: /-?\b\d{1,3}\.\d{4,}\s*,\s*-?\d{1,3}\.\d{4,}\b/g },
  { label: 'card number', pattern: /\b(?:\d[ -]?){13,19}\b/g },
];

/** Everything personal this text still appears to carry. Labels, never values. */
export function findPersonalDetail(field: string, text: string | null | undefined): Finding[] {
  if (!text) return [];

  const found = new Map<string, Finding>();
  for (const { label, pattern } of RULES) {
    for (const match of text.matchAll(pattern)) {
      // A four-digit year or an all-digit model number is not a card.
      if (label === 'card number' && match[0].replace(/\D/g, '').length < 13) continue;
      found.set(label, { label, field });
    }
  }
  return [...found.values()];
}

export class SanitizerRefusal extends Error {
  constructor(public findings: Finding[]) {
    const what = [...new Set(findings.map((f) => f.label))].join(', ');
    const where = [...new Set(findings.map((f) => f.field))].join(', ');
    super(
      `Refused to generate: what looks like ${what} is still present in ${where}. ` +
        'Nothing was sent. This should be impossible — the data is redacted before it ' +
        'leaves JobPocket — so the redaction rule that missed it needs fixing there.'
    );
  }
}

/**
 * The gate. Throws rather than returning a flag, because every caller's correct
 * response is the same one and a boolean is a thing a future caller can forget
 * to check.
 */
export function assertClean(fields: Record<string, string | null | undefined>): void {
  const findings = Object.entries(fields).flatMap(([field, text]) =>
    findPersonalDetail(field, text)
  );
  if (findings.length > 0) throw new SanitizerRefusal(findings);
}
