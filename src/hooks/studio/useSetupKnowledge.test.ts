import { describe, expect, it } from 'vitest';
import { parseDocuments, parseMemories, parseSearchHits } from './useSetupKnowledge';

describe('parseDocuments', () => {
  it('reads the inventory rows (slug/title/state/version)', () => {
    const rows = parseDocuments({
      documents: [
        { id: 'd1', source_slug: 'help-center', title: 'Help Center', state: 'ready', updated_at: '2026-09-16T10:00:00Z', latest_version: 3 },
        { id: 'd2', source_slug: 'ext-sitemap-9f8e7d6c', title: null, state: 'processing', updated_at: null, latest_version: null },
      ],
    });
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ id: 'd1', sourceSlug: 'help-center', title: 'Help Center', state: 'ready', latestVersion: 3 });
    expect(rows[1]).toMatchObject({ sourceSlug: 'ext-sitemap-9f8e7d6c', state: 'processing', latestVersion: null });
  });

  it('drops rows without ids and tolerates junk', () => {
    expect(parseDocuments({ documents: [{ title: 'x' }, null, 42] })).toEqual([]);
    expect(parseDocuments(null)).toEqual([]);
  });
});

describe('parseSearchHits', () => {
  it('reads hits with byte-range citations (camelCase and snake_case)', () => {
    const hits = parseSearchHits({
      hits: [
        { chunkId: 'c1', documentId: 'd1', documentVersionId: 'v1', sequence: 2, text: 'Refunds within 30 days.', sourceRange: { byteStart: 10, byteEnd: 40 }, score: 0.91, title: 'Policy' },
        { chunk_id: 'c2', document_id: 'd2', sequence: 0, text: 'Hi.', sourceRange: { byte_start: 0, byte_end: 3 }, score: 0.5 },
      ],
    });
    expect(hits).toHaveLength(2);
    expect(hits[0]).toMatchObject({ byteStart: 10, byteEnd: 40, title: 'Policy' });
    expect(hits[1]).toMatchObject({ chunkId: 'c2', byteStart: 0, byteEnd: 3, title: null });
  });

  it('drops hits without chunk/document ids', () => {
    expect(parseSearchHits({ hits: [{ text: 'x' }] })).toEqual([]);
  });

  it('parses stringified ranges from older engines', () => {
    const hits = parseSearchHits({
      hits: [{ chunkId: 'c3', documentId: 'd3', text: 'Hello world', sourceRange: '{"byteEnd": 11, "byteStart": 0}', score: 1 }],
    });
    expect(hits[0]).toMatchObject({ byteStart: 0, byteEnd: 11 });
  });
});

describe('parseMemories', () => {
  it('reads memory items with scope provenance', () => {
    const items = parseMemories({
      memories: [{ id: 'm1', content: 'Ships Fridays.', scope_type: 'organization', created_at: '2026-09-16T10:00:00Z' }],
    });
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: 'm1', content: 'Ships Fridays.', scopeType: 'organization' });
  });

  it('tolerates junk', () => {
    expect(parseMemories({ memories: [{ content: 'x' }] })).toEqual([]);
  });

  it('reads drawer fields with snake_case fallback and numeric-string confidence (C08)', () => {
    const items = parseMemories({
      memories: [{
        id: 'm2', content: 'Prefers mornings.', scope_type: 'user', scope_id: 'u-9',
        source_ref: { proposal_id: 'p-1', run_id: 'r-1' }, provenance: 'memory_proposal',
        confidence: '0.920', valid_from: '2026-09-10T00:00:00Z', invalid_at: null,
        supersedes: null, embedding_model: 'granted-embed-3', updated_at: '2026-09-12T00:00:00Z',
      }],
    });
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      scopeId: 'u-9', provenance: 'memory_proposal', confidence: 0.92,
      validFrom: '2026-09-10T00:00:00Z', embeddingModel: 'granted-embed-3',
    });
    expect(items[0]?.sourceRef).toEqual({ proposal_id: 'p-1', run_id: 'r-1' });
  });
});
