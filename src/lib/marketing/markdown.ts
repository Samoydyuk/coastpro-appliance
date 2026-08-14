/**
 * The small slice of markdown the drafts actually use.
 *
 * A dependency would be the obvious move and is the wrong one here: the input
 * is not arbitrary user markdown, it is text this system asked a model for and
 * a person then read. Headings, paragraphs, bullets, bold and italic is the
 * whole vocabulary, and a parser for it is shorter than the argument for
 * adding one.
 *
 * Safety is by construction rather than by sanitising afterwards: everything
 * is HTML-escaped **first**, so the only tags in the output are the ones the
 * lines below put there. Nothing a model writes can become markup.
 */

function escape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Inline formatting, applied after escaping. */
function inline(text: string): string {
  return escape(text)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
}

export function renderMarkdown(source: string): string {
  const out: string[] = [];
  let list: string[] = [];

  const closeList = () => {
    if (list.length === 0) return;
    out.push(`<ul>${list.map((item) => `<li>${item}</li>`).join('')}</ul>`);
    list = [];
  };

  for (const raw of source.split('\n')) {
    const line = raw.trim();

    if (!line) {
      closeList();
      continue;
    }

    const heading = /^(#{2,4})\s+(.*)$/.exec(line);
    if (heading) {
      closeList();
      const level = Math.min(4, heading[1].length);
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }

    const bullet = /^[-*]\s+(.*)$/.exec(line);
    if (bullet) {
      list.push(inline(bullet[1]));
      continue;
    }

    closeList();
    out.push(`<p>${inline(line)}</p>`);
  }

  closeList();
  return out.join('\n');
}
