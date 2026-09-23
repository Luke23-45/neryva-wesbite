import { Children, isValidElement, memo, useRef, useState, type ReactNode } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styled from 'styled-components';
import { Check, Copy } from 'lucide-react';
import { safeLinkUrl } from './linkSafety';

/**
 * Safe markdown for assistant replies (A3-46): code blocks with a copy
 * button, lists, links, tables (GFM). Security posture:
 *  - no rehype-raw: raw HTML in the reply is rendered as inert text, never
 *    parsed into DOM (XSS-safe by construction — see ChatMessages.safety.test.tsx);
 *  - links allow only http/https/mailto/relative URLs — `javascript:` and
 *    other schemes render as plain text with no anchor;
 *  - external links open in a new tab with rel="noopener noreferrer".
 */

function SafeLink({ href, children }: { href?: string; children?: ReactNode }) {
  const safe = typeof href === 'string' ? safeLinkUrl(href) : null;
  if (!safe) return <>{children}</>;
  const external = /^https?:/i.test(safe);
  return (
    <a href={safe} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {children}
    </a>
  );
}

function CodeBlock({ children }: { children?: ReactNode }) {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);
  // The language rides on the <code className="language-x"> element —
  // derived during render, no effect needed.
  let language = '';
  Children.forEach(children, (child) => {
    if (isValidElement(child)) {
      const className = (child.props as { className?: string }).className ?? '';
      const match = /language-([\w-]+)/.exec(className);
      if (match?.[1]) language = match[1];
    }
  });

  const copy = async () => {
    const text = preRef.current?.querySelector('code')?.innerText ?? '';
    if (text === '') return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Non-secure contexts / denied permission: legacy fallback.
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'absolute';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } catch {
        /* clipboard unavailable — leave the button state honest */
        ta.remove();
        return;
      }
      ta.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <CodeWrap>
      <CodeHead>
        <CodeLang>{language || 'code'}</CodeLang>
        <CodeCopy type="button" onClick={copy} aria-label={copied ? 'Code copied' : 'Copy code'}>
          {copied ? <Check size={12} strokeWidth={2.2} /> : <Copy size={12} strokeWidth={1.8} />}
          {copied ? 'Copied' : 'Copy'}
        </CodeCopy>
      </CodeHead>
      <CodePre ref={preRef}>{children}</CodePre>
    </CodeWrap>
  );
}

const components: Components = {
  a: SafeLink,
  pre: CodeBlock,
  table: ({ children }) => (
    <TableScroll>
      <table>{children}</table>
    </TableScroll>
  ),
};

function MarkdownTextInner({ text }: { text: string }) {
  return (
    <MarkdownWrap>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {text}
      </ReactMarkdown>
    </MarkdownWrap>
  );
}

/** Memoized: a settled message's text never changes, so the parse happens once per message. */
export const MarkdownText = memo(MarkdownTextInner);

/* ─── Markdown element styles (chat scale) ─── */

const MarkdownWrap = styled.div`
  & > *:first-child {
    margin-top: 0;
  }
  & > *:last-child {
    margin-bottom: 0;
  }
  p {
    margin: 0 0 8px;
  }
  p:last-child {
    margin-bottom: 0;
  }
  h1,
  h2,
  h3,
  h4 {
    margin: 12px 0 6px;
    line-height: 1.3;
    font-weight: 600;
  }
  h1 {
    font-size: 1.15em;
  }
  h2 {
    font-size: 1.08em;
  }
  h3,
  h4 {
    font-size: 1em;
  }
  ul,
  ol {
    margin: 0 0 8px;
    padding-left: 20px;
  }
  li {
    margin: 2px 0;
  }
  li > p {
    margin: 0;
  }
  blockquote {
    margin: 0 0 8px;
    padding: 2px 0 2px 12px;
    border-left: 2px solid ${({ theme }) => theme.app.border.strong};
    color: ${({ theme }) => theme.app.text.secondary};
  }
  hr {
    border: 0;
    border-top: 1px solid ${({ theme }) => theme.app.border.default};
    margin: 12px 0;
  }
  a {
    color: #7aa7ff;
    text-decoration: underline;
    text-underline-offset: 2px;
    overflow-wrap: anywhere;
  }
  /* Inline code (not inside a CodeBlock pre). */
  code:not(pre code) {
    font-family: ${({ theme }) => theme.typography.fonts.mono};
    font-size: 0.86em;
    background: rgba(255, 255, 255, 0.07);
    border: 1px solid ${({ theme }) => theme.app.border.default};
    border-radius: 5px;
    padding: 1px 5px;
    overflow-wrap: anywhere;
  }
  img {
    max-width: 100%;
    border-radius: 8px;
  }
`;

const CodeWrap = styled.div`
  margin: 8px 0;
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  border-radius: 10px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.35);
`;

const CodeHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px 6px 12px;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.default};
  background: rgba(255, 255, 255, 0.03);
`;

const CodeLang = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.muted};
`;

const CodeCopy = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: transparent;
  color: ${({ theme }) => theme.app.text.secondary};
  border-radius: 7px;
  padding: 4px 9px;
  font-family: inherit;
  font-size: 11px;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.app.surface.hover};
    color: ${({ theme }) => theme.app.text.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

const CodePre = styled.pre`
  margin: 0;
  padding: 12px;
  max-height: 340px;
  overflow: auto;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12.5px;
  line-height: 1.6;
  color: ${({ theme }) => theme.app.text.primary};

  code {
    font-family: inherit;
    background: none;
    border: 0;
    padding: 0;
  }
`;

const TableScroll = styled.div`
  margin: 8px 0;
  overflow-x: auto;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 10px;

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.92em;
  }
  th,
  td {
    padding: 7px 10px;
    border-bottom: 1px solid ${({ theme }) => theme.app.border.default};
    text-align: left;
    white-space: nowrap;
  }
  th {
    font-weight: 600;
    background: rgba(255, 255, 255, 0.03);
  }
  tr:last-child td {
    border-bottom: 0;
  }
`;
