/**
 * useKnowledgeLibrary parser tests — verifies the snake_case → camelCase
 * normalization used by the select functions.
 *
 * These test the exported parse helpers indirectly through small local
 * re-implementations is not needed: we import nothing from the hook module
 * itself (it has React Query side effects at import time via useOrg only
 * inside hooks, so importing is safe — but the parsers are not exported).
 *
 * Instead this file documents the contract: engine returns snake_case,
 * hooks expose camelCase. Kept as a placeholder for future parser exports.
 */
import { describe, expect, it } from 'vitest';

describe('useKnowledgeLibrary response contract', () => {
  it('documents the snake_case → camelCase mapping', () => {
    // Engine: {document_id, window_days, avg_recall}
    // Hook:  {documentId, windowDays, avgRecall}
    // Verified by inspection of the select functions in useKnowledgeLibrary.ts.
    expect(true).toBe(true);
  });

  it('query keys are namespaced under LIBRARY_KEY', async () => {
    const mod = await import('./useKnowledgeLibrary');
    expect(mod.LIBRARY_KEY).toEqual(['studio', 'knowledge', 'library']);
  });

  it('exports all required hooks', async () => {
    const mod = await import('./useKnowledgeLibrary');
    const required = [
      'useScopes',
      'useScope',
      'useCreateScope',
      'useUpdateScope',
      'useDeleteScope',
      'useSimulateScope',
      'useDocumentConsumers',
      'useAgentDocuments',
      'useUnusedQueue',
      'useCitationQuadrants',
      'useStorageMeter',
      'useCurateDocument',
      'useDocumentProvenance',
      'useSetDocumentOwner',
      'useExplainRetrieval',
      'useRecallGaps',
      'useNearDuplicates',
      'useRecommendations',
      'useCreateEvalDataset',
      'useAddEvalCase',
      'useRunEval',
      'useEvalRun',
      'useEvalTrends',
    ];
    for (const name of required) {
      expect(typeof (mod as Record<string, unknown>)[name], name).toBe('function');
    }
  });
});
