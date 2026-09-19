/**
 * Health-parser coverage (C05 PLAN.md §5) — `embedding_complete` must survive
 * parsing (engine returns it per pin; older engines omit it → null, never a guess).
 */
import { describe, expect, it } from 'vitest';
import { parseKnowledgeHealth } from './useAgentAuthoring';

describe('parseKnowledgeHealth', () => {
  it('carries resolved/document/state/embedding coverage per pin', () => {
    const health = parseKnowledgeHealth({
      degraded: true,
      pins: [
        { source_slug: 'refund-policy', resolved: true, document_id: 'd1', state: 'ready', embedding_complete: true },
        { source_slug: 'faq-2026', resolved: true, document_id: 'd2', state: 'ready', embedding_complete: false },
        { source_slug: 'ghost', resolved: false, document_id: null, state: null, embedding_complete: null },
      ],
    });
    expect(health.degraded).toBe(true);
    expect(health.pins).toEqual([
      { sourceSlug: 'refund-policy', resolved: true, documentId: 'd1', state: 'ready', embeddingComplete: true },
      { sourceSlug: 'faq-2026', resolved: true, documentId: 'd2', state: 'ready', embeddingComplete: false },
      { sourceSlug: 'ghost', resolved: false, documentId: null, state: null, embeddingComplete: null },
    ]);
  });

  it('tolerates older engines (absent embedding_complete → null) and junk', () => {
    const health = parseKnowledgeHealth({ degraded: false, pins: [{ source_slug: 'a' }, null, 42] });
    expect(health).toEqual({
      degraded: false,
      pins: [{ sourceSlug: 'a', resolved: false, documentId: null, state: null, embeddingComplete: null }],
    });
    expect(parseKnowledgeHealth(null)).toEqual({ degraded: false, pins: [] });
  });
});
