// @vitest-environment jsdom
/**
 * Demo honesty flag parsing (build spec v3 §2): `synthetic` is read
 * verbatim off the wire — never inferred.
 */
import { describe, expect, it } from 'vitest';
import { parseConversationMessages, parseRunEvent } from './useChat';
import type { SseMessage } from '@lib/engine/sse';

function sse(data: unknown): SseMessage {
  return { id: 'e', event: 'message', data: JSON.stringify(data) };
}

describe('parseConversationMessages synthetic flag', () => {
  it('marks wire-marked agent messages synthetic', () => {
    const parsed = parseConversationMessages({
      messages: [
        { id: 'm1', role: 'user', text: 'hi', created_at: null },
        { id: 'm2', role: 'agent', text: 'hello (canned)', created_at: null, synthetic: true },
        { id: 'm3', role: 'agent', text: 'real reply', created_at: null },
      ],
    });
    expect(parsed).toHaveLength(3);
    expect(parsed[0].synthetic).toBe(false);
    expect(parsed[1].synthetic).toBe(true);
    // Absent flag is NOT synthetic — never inferred.
    expect(parsed[2].synthetic).toBe(false);
  });

  it('treats a non-true flag as not synthetic', () => {
    const parsed = parseConversationMessages({
      messages: [{ id: 'm1', role: 'agent', text: 'x', created_at: null, synthetic: 1 }],
    });
    expect(parsed[0].synthetic).toBe(false);
  });
});

describe('parseRunEvent synthetic flag', () => {
  it('reads synthetic off the model frame verbatim', () => {
    const event = parseRunEvent(sse({ case: 'model', value: { modelId: 'neryva/demo', synthetic: true } }));
    expect(event.synthetic).toBe(true);
  });

  it('defaults to false when the frame carries nothing', () => {
    const event = parseRunEvent(sse({ case: 'model', value: { modelId: 'openai/gpt-4o-mini' } }));
    expect(event.synthetic).toBe(false);
  });

  it('never marks non-model events synthetic', () => {
    const event = parseRunEvent(sse({ case: 'assistantChunk', value: { text: 'hi' } }));
    expect(event.synthetic).toBe(false);
  });
});
