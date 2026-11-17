// Tiny, safe formatting renderer for staff-written text.
// Supported: blank line = new paragraph, single newline = line break,
// **bold**, *italic* or _italic_, [link text](https://…).
// It builds React elements directly; nothing is ever parsed as HTML, so
// content cannot inject markup or scripts. Only http(s), mailto and tel
// links are made clickable; anything else stays plain text.
import { Fragment, type ReactNode } from 'react';

const SAFE_URL = /^(https?:\/\/[^\s]+|mailto:[^\s]+|tel:[+\d\s()-]+)$/i;
const TOKEN = /\[([^\]\n]+)\]\(([^)\s]+)\)|\*\*([^*\n]+?)\*\*|\*([^*\s][^*\n]*?)\*|_([^_\s][^_\n]*?)_/g;

export function renderInline(text: string, key = 'i'): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let n = 0;
  for (const m of text.matchAll(TOKEN)) {
    const start = m.index ?? 0;
    // "_" inside words (snake_case, file_names) is not italics
    if (m[5] !== undefined && (/\w/.test(text[start - 1] ?? '') || /\w/.test(text[start + m[0].length] ?? ''))) continue;
    if (start > last) out.push(text.slice(last, start));
    const k = `${key}-${n++}`;
    if (m[1] !== undefined) {
      const href = m[2];
      out.push(
        SAFE_URL.test(href) ? (
          <a key={k} href={href} {...(/^https?:/i.test(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="prose-link">
            {renderInline(m[1], k)}
          </a>
        ) : (
          <Fragment key={k}>{m[0]}</Fragment>
        ),
      );
    } else if (m[3] !== undefined) out.push(<strong key={k}>{renderInline(m[3], k)}</strong>);
    else out.push(<em key={k}>{renderInline(m[4] ?? m[5], k)}</em>);
    last = start + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Paragraphs + inline formatting. */
export function Markdown({ text, className = '' }: { text: string; className?: string }) {
  const paragraphs = text.replace(/\r\n/g, '\n').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return (
    <div className={`space-y-4 leading-relaxed ${className}`}>
      {paragraphs.map((p, i) => (
        <p key={i}>
          {p.split('\n').map((line, j, all) => (
            <Fragment key={j}>
              {renderInline(line, `${i}-${j}`)}
              {j < all.length - 1 && <br />}
            </Fragment>
          ))}
        </p>
      ))}
    </div>
  );
}

/** Plain-text excerpt of formatted text (formatting marks removed), cut at a word. */
export function excerpt(text: string, max = 180): string {
  const plain = text
    .replace(/\[([^\]\n]+)\]\([^)\s]+\)/g, '$1')
    .replace(/\*\*([^*\n]+?)\*\*/g, '$1')
    .replace(/(^|\W)[*_]([^*_\n]+?)[*_](?=\W|$)/g, '$1$2')
    .replace(/\s+/g, ' ')
    .trim();
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max * 0.6)).replace(/[,.;:!?-]+$/, '')}…`;
}
