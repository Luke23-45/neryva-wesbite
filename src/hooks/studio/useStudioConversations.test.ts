import { describe, expect, it } from 'vitest';
import { parseAssistants } from './useAssistants';
import { parseConversations } from './useStudioConversations';

describe('parseConversations', () => {
  it('sorts by recency and falls back to a title', () => {
    const conversations = parseConversations({
      conversations: [
        { id: 'c1', title: 'Older', updated_at: '2026-09-01T10:00:00Z' },
        { id: 'c2', name: 'Newer', last_message_at: '2026-09-05T10:00:00Z', status: 'open' },
        { id: 'c3' },
      ],
    });
    expect(conversations.map((c) => c.id)).toEqual(['c2', 'c1', 'c3']);
    expect(conversations[2].title).toBe('Untitled conversation');
    expect(conversations[0].status).toBe('open');
  });

  it('accepts bare-array and items envelopes', () => {
    expect(parseConversations([{ id: 'a' }])).toHaveLength(1);
    expect(parseConversations({ items: [{ conversation_id: 'b' }] })).toHaveLength(1);
  });

  it('survives garbage', () => {
    expect(parseConversations(null)).toEqual([]);
    expect(parseConversations({ conversations: 'x' })).toEqual([]);
  });
});

describe('parseAssistants', () => {
  it('extracts agents from the reasonable envelopes', () => {
    const assistants = parseAssistants({
      assistants: [
        { id: 'a1', display_name: 'Support Concierge', state: 'active' },
        { agent_id: 'a2' },
      ],
    });
    expect(assistants).toEqual([
      { id: 'a1', name: 'Support Concierge', status: 'active' },
      { id: 'a2', name: 'Untitled agent', status: null },
    ]);
  });

  it('survives garbage', () => {
    expect(parseAssistants(42)).toEqual([]);
    expect(parseAssistants({ assistants: [null, 'x'] })).toEqual([]);
  });
});
