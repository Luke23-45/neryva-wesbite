/**
 * section-ui — Markdown syntax tint for the editor's Write surface.
 *
 * A lightweight tokenizer (not a full parser): block markers (##, -, >,
 * 1.) tint blue, headings/bold render bright, quotes dim. The output is
 * rendered in a <pre> behind a transparent textarea — both share identical
 * font metrics so the tint tracks the caret exactly.
 */

import type { ReactNode } from 'react';
import styled from 'styled-components';

/* Tint palette (SVG spec) — content rendering, like MarkdownText's own
 * hard-coded link color. BODY is exported so the highlight <pre> base
 * color matches the tint exactly (the caret would drift otherwise). */
const MARKER = '#7aa7ff';
const BRIGHT = '#e8eaed';
/** Base body color of the tinted writing surface. */
export const TINT_BODY = '#c9ced6';
const DIM = '#9aa3ad';
const CODE = '#ffd479';

const Marker = styled.span`
  color: ${MARKER};
`;
const Bright = styled.span`
  color: ${BRIGHT};
  font-weight: 600;
`;
const Dim = styled.span`
  color: ${DIM};
  font-style: italic;
`;
const CodeSpan = styled.span`
  color: ${CODE};
`;
const LinkSpan = styled.span`
  color: ${MARKER};
`;

/** Inline tokens: bold, italic, code, images, links. */
const INLINE_RE = /(\*\*[^*\n]+\*\*|__[^_\n]+__|\*[^*\n]+\*|_[^_\n]+_|`[^`\n]+`|!\[[^\]\n]*\]\([^)\n]*\)|\[[^\]\n]*\]\([^)\n]*\))/g;

function tintInline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(INLINE_RE);
  return parts.map((part, i) => {
    const key = `${keyPrefix}-i${i}`;
    if (/^\*\*.+\*\*$/.test(part) || /^__.+__$/.test(part)) {
      const inner = part.slice(2, -2);
      return (
        <span key={key}>
          <Marker>{part.slice(0, 2)}</Marker>
          <Bright>{inner}</Bright>
          <Marker>{part.slice(-2)}</Marker>
        </span>
      );
    }
    if (/^`.+`$/.test(part)) {
      return (
        <span key={key}>
          <Marker>`</Marker>
          <CodeSpan>{part.slice(1, -1)}</CodeSpan>
          <Marker>`</Marker>
        </span>
      );
    }
    if (/^!?\[[^\]]*\]\(/.test(part)) {
      const isImage = part.startsWith('!');
      const labelEnd = part.indexOf(']');
      const label = part.slice(isImage ? 2 : 1, labelEnd);
      const url = part.slice(labelEnd + 2, -1);
      return (
        <span key={key}>
          <Marker>
            {isImage ? '![' : '['}
          </Marker>
          <LinkSpan>{label}</LinkSpan>
          <Marker>]</Marker>
          <Dim>({url})</Dim>
        </span>
      );
    }
    if (/^(\*[^*\n]+\*|_[^_\n]+_)$/.test(part)) {
      return (
        <span key={key}>
          <Marker>{part[0]}</Marker>
          <span style={{ color: TINT_BODY, fontStyle: 'italic' }}>{part.slice(1, -1)}</span>
          <Marker>{part[part.length - 1]}</Marker>
        </span>
      );
    }
    return <span key={key} style={{ color: TINT_BODY }}>{part}</span>;
  });
}

function tintLine(line: string, keyPrefix: string, inFence: boolean): ReactNode {
  const key = `${keyPrefix}`;
  if (/^\s*```/.test(line)) {
    return (
      <span key={key}>
        <Marker>{line}</Marker>
      </span>
    );
  }
  if (inFence) {
    return (
      <span key={key}>
        <CodeSpan>{line}</CodeSpan>
      </span>
    );
  }
  const heading = /^(#{1,6})(\s+)(.*)$/.exec(line);
  if (heading) {
    return (
      <span key={key}>
        <Marker>{heading[1]}{heading[2]}</Marker>
        <Bright>{tintInline(heading[3], `${keyPrefix}-h`)}</Bright>
      </span>
    );
  }
  const quote = /^(>\s?)(.*)$/.exec(line);
  if (quote) {
    return (
      <span key={key}>
        <Marker>{quote[1]}</Marker>
        <Dim>{tintInline(quote[2], `${keyPrefix}-q`)}</Dim>
      </span>
    );
  }
  const list = /^(\s*)([-*+]|\d+[.)])(\s+)(.*)$/.exec(line);
  if (list) {
    return (
      <span key={key}>
        <span style={{ color: TINT_BODY }}>{list[1]}</span>
        <Marker>{list[2]}{list[3]}</Marker>
        {tintInline(list[4], `${keyPrefix}-l`)}
      </span>
    );
  }
  if (/^\s*([-*_]\s*){3,}\s*$/.test(line)) {
    return (
      <span key={key}>
        <Marker>{line}</Marker>
      </span>
    );
  }
  return <span key={key}>{tintInline(line, keyPrefix)}</span>;
}

/**
 * Render tinted markdown as line spans joined by newlines. The caller puts
 * this in a <pre> with metrics identical to its textarea.
 */
export function MarkdownHighlight({ text }: { text: string }) {
  const lines = text.split('\n');
  let inFence = false;
  const out: ReactNode[] = [];
  lines.forEach((line, i) => {
    if (/^\s*```/.test(line)) inFence = !inFence;
    out.push(tintLine(line, `l${i}`, inFence && !/^\s*```/.test(line)));
    if (i < lines.length - 1) out.push('\n');
  });
  // A trailing newline renders an extra line in a textarea — mirror it so
  // the highlight never ends one line short.
  if (text.endsWith('\n')) out.push(<span key="trail">{'\u200b'}</span>);
  return <>{out}</>;
}
