// @vitest-environment jsdom
/**
 * A3-40/A3-46 — Worker 3c: reply HTML safety + markdown behavior.
 *
 * ChatMessages renders message text through a SAFE markdown pipeline
 * (react-markdown, remark-gfm, NO rehype-raw): hostile markup renders as
 * inert text, never as DOM; only http/https/mailto/relative URLs become
 * links (`javascript:` and friends degrade to plain text).
 */
import { describe, expect, it, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '@styles/theme';
import { ChatMessages, type Message } from './ChatMessages';
import { safeLinkUrl } from './linkSafety';

beforeAll(() => {
  // jsdom does not implement scrollIntoView (the component's pin-to-bottom effect).
  Element.prototype.scrollIntoView = vi.fn();
});

function renderMessages(messages: Message[]) {
  return render(
    <ThemeProvider theme={theme}>
      <ChatMessages messages={messages} />
    </ThemeProvider>,
  );
}

describe('ChatMessages reply HTML safety', () => {
  it('renders an <img onerror> payload as inert text — no element, no execution', () => {
    (window as unknown as Record<string, unknown>).__pwned = undefined;
    const payload = '<img src=x onerror="window.__pwned=1">';
    const { container } = renderMessages([{ id: 'm1', role: 'agent', text: payload }]);
    expect(container.querySelector('img')).toBeNull();
    expect((window as unknown as Record<string, unknown>).__pwned).toBeUndefined();
    expect(container.textContent).toContain(payload);
  });

  it('renders a <script> payload as inert text', () => {
    const payload = '<script>alert("xss")</script>';
    const { container } = renderMessages([{ id: 'm2', role: 'agent', text: payload }]);
    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).toContain(payload);
  });

  it('renders user messages with hostile markup as inert text too', () => {
    const payload = '"><svg onload=alert(1)>';
    const { container } = renderMessages([{ id: 'm3', role: 'user', text: payload }]);
    // (Lucide action icons legitimately render <svg> — assert none of them
    // carries the payload's executable attribute.)
    const executable = [...container.querySelectorAll('svg')].filter((el) => el.hasAttribute('onload'));
    expect(executable).toHaveLength(0);
    expect(container.textContent).toContain(payload);
  });

  it('does not linkify javascript: URLs — the label renders as plain text', () => {
    const { container } = renderMessages([{ id: 'm4', role: 'agent', text: 'click [here](javascript:alert(1)) now' }]);
    expect(container.querySelector('a')).toBeNull();
    expect(container.textContent).toContain('click here now');
  });

  it('renders https links as real anchors that open safely', () => {
    const { container } = renderMessages([{ id: 'm5', role: 'agent', text: 'see [docs](https://example.com/x)' }]);
    const anchor = container.querySelector('a');
    expect(anchor).not.toBeNull();
    expect(anchor?.getAttribute('href')).toBe('https://example.com/x');
    expect(anchor?.getAttribute('target')).toBe('_blank');
    expect(anchor?.getAttribute('rel')).toContain('noopener');
    expect(anchor?.textContent).toBe('docs');
  });

  it('renders markdown structure — bold, inline code, lists', () => {
    const { container } = renderMessages([
      { id: 'm6', role: 'agent', text: '**bold** and `code`\n\n- one\n- two' },
    ]);
    expect(container.querySelector('strong')?.textContent).toBe('bold');
    expect(container.querySelector('ul')).not.toBeNull();
    expect(container.textContent).toContain('one');
  });

  it('renders fenced code blocks with a copy control', () => {
    renderMessages([{ id: 'm7', role: 'agent', text: '```js\nconst x = 1;\n```' }]);
    expect(screen.getByRole('button', { name: 'Copy code' })).toBeTruthy();
  });

  it('notices render as text as well', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <ChatMessages
          messages={[{ id: 'm8', role: 'user', text: 'hi' }]}
          notices={[{ id: 'n1', kind: 'error', text: '<b>boom</b>' }]}
        />
      </ThemeProvider>,
    );
    expect(container.querySelector('b')).toBeNull();
  });
});

describe('safeLinkUrl', () => {
  it('allows http, https, mailto and relative URLs', () => {
    expect(safeLinkUrl('https://example.com')).toBe('https://example.com');
    expect(safeLinkUrl('http://example.com/x')).toBe('http://example.com/x');
    expect(safeLinkUrl('mailto:a@b.c')).toBe('mailto:a@b.c');
    expect(safeLinkUrl('/docs/x')).toBe('/docs/x');
    expect(safeLinkUrl('#frag')).toBe('#frag');
    expect(safeLinkUrl('page/x')).toBe('page/x');
  });

  it('blocks javascript:, data: and other schemes', () => {
    expect(safeLinkUrl('javascript:alert(1)')).toBeNull();
    expect(safeLinkUrl('JaVaScRiPt:alert(1)')).toBeNull();
    expect(safeLinkUrl('data:text/html,<h1>x</h1>')).toBeNull();
    expect(safeLinkUrl('vbscript:msgbox(1)')).toBeNull();
    expect(safeLinkUrl('')).toBeNull();
  });
});
