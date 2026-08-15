/**
 * An article's body, cut into the sections the page numbers.
 *
 * The generated piece is markdown with `## ` headings, and the layout wants
 * them as separate blocks: a number down the left, the heading beside it, the
 * prose under it — and two of them replaced entirely by something better than
 * prose, the parts list and the checklist of symptoms.
 *
 * Splitting it here rather than in the page keeps the page a layout and this a
 * parser, and means the rule for "which section is the parts one" is written
 * down once.
 */

export interface ArticleSection {
  /** The heading as written, e.g. "What the Technician Found". */
  heading: string;
  /** Everything under it, still markdown. */
  body: string;
  /** Bullet lines, when the section is a list. Used by the checklist block. */
  bullets: string[];
  /** Which of the special blocks this is, if any. */
  kind: 'prose' | 'parts' | 'expect';
}

export interface SplitArticle {
  /** Prose before the first heading, or under a heading that only repeats the
   *  title. It opens the piece and is not numbered. */
  intro: string;
  sections: ArticleSection[];
}

function classify(heading: string): ArticleSection['kind'] {
  const lower = heading.toLowerCase();
  if (lower.includes('part')) return 'parts';
  if (lower.includes('what to expect') || lower.includes('signs') || lower.includes('symptom')) {
    return 'expect';
  }
  return 'prose';
}

/** Bullet lines, stripped of their markers. */
function bulletsOf(body: string): string[] {
  return body
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^[-*+]\s+/.test(line))
    .map((line) => line.replace(/^[-*+]\s+/, '').trim())
    .filter(Boolean);
}

/**
 * Does this heading just say the title again?
 *
 * The generated opening heading is a restatement — "Ice Maker Not Working on a
 * GE CYE22TSHKSS" under a headline that already says the same thing. Printing
 * both, one of them numbered 01, reads like a mistake.
 */
function echoesTitle(heading: string, title: string): boolean {
  const words = (text: string) =>
    new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((word) => word.length > 3)
    );
  const a = words(heading);
  const b = words(title);
  if (a.size === 0) return false;
  let shared = 0;
  for (const word of a) if (b.has(word)) shared += 1;
  return shared / a.size >= 0.6;
}

/**
 * The opening heading, whatever it was called.
 *
 * It is not always a restatement of the title — "Ice Maker Not Working on a GE
 * CYE22TSHKSS" under "GE Ice Maker Not Cooling Enough" shares one word — but it
 * is always the symptom, because that is what the outline asks for first.
 */
function isOpener(heading: string): boolean {
  return /\b(not|won'?t|stopped|no|failing|leaking|noisy)\b/i.test(heading);
}

export function splitArticle(body: string, title: string): SplitArticle {
  const lines = body.split('\n');
  const sections: ArticleSection[] = [];
  let intro: string[] = [];
  let current: { heading: string; lines: string[] } | null = null;

  const flush = () => {
    if (!current) return;
    const text = current.lines.join('\n').trim();
    // The first heading is the symptom restated — the outline the piece is
    // written to opens with it every time, and the page has already said it in
    // the headline and again in the summary card. Printing it as section 01
    // reads like the article starts twice.
    if (sections.length === 0 && (echoesTitle(current.heading, title) || isOpener(current.heading))) {
      intro = intro.concat(text ? [text] : []);
    } else {
      sections.push({
        heading: current.heading,
        body: text,
        bullets: bulletsOf(text),
        kind: classify(current.heading),
      });
    }
    current = null;
  };

  for (const line of lines) {
    const heading = line.match(/^#{2,3}\s+(.+?)\s*$/);
    if (heading) {
      flush();
      current = { heading: heading[1].trim(), lines: [] };
      continue;
    }
    if (current) current.lines.push(line);
    else intro.push(line);
  }
  flush();

  return { intro: intro.join('\n').trim(), sections };
}

/** Roughly how long this takes to read, for the line under the eyebrow. */
export function readingMinutes(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
