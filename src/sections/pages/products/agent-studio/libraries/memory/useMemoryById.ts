import { useMemo } from 'react';
import { useMemories, type MemoryItem } from '@hooks/studio/useSetupKnowledge';

/**
 * Resolve a memory row by id across the three list scopes the library page
 * can show (organization, user, every assistant row). There is no
 * single-item endpoint — the list responses carry every field the detail
 * and edit sections need, so no extra reads. Unknown id → null once all
 * three settle; callers bounce to the memory list.
 */
export function useMemoryById(memoryId: string | null): {
  item: MemoryItem | null;
  isPending: boolean;
  isError: boolean;
} {
  const org = useMemories('organization');
  const user = useMemories('user');
  // No scope id widens the read to every assistant row (same rule as the
  // library page's assistant filter without a deep-link).
  const assistant = useMemories('assistant');

  const item = useMemo(() => {
    if (!memoryId) return null;
    for (const query of [org, user, assistant]) {
      const found = (query.data ?? []).find((m) => m.id === memoryId);
      if (found) return found;
    }
    return null;
  }, [org, user, assistant, memoryId]);

  return {
    item,
    isPending: org.isPending || user.isPending || assistant.isPending,
    isError: org.isError || user.isError || assistant.isError,
  };
}
