/**
 * Studio onboarding checklist (ledger S-6) — the engine's live first-run
 * state (project? key? trial? usage?) from GET /console/onboarding.
 */
import { useQuery } from '@tanstack/react-query';
import { engine } from '@lib/engine/client';
import { useOrg } from '@/Context/OrgContext';

export interface OnboardingItem {
  id: string;
  label: string;
  done: boolean;
  /** In-app deep link to the action surface, when the engine provides one. */
  href: string | null;
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

/**
 * The onboarding payload shape is not pinned — tolerate the reasonable
 * envelopes ({items|steps|checklist: [...]} or a bare array) and item
 * field spellings. Only in-app hrefs survive; external links are dropped.
 */
export function parseOnboarding(raw: unknown): OnboardingItem[] {
  if (typeof raw !== 'object' || raw === null) {
    return [];
  }
  const record = raw as Record<string, unknown>;
  const list = Array.isArray(raw)
    ? raw
    : [record.items, record.steps, record.checklist, record.tasks].find(Array.isArray) ?? [];
  if (!Array.isArray(list)) {
    return [];
  }
  return list
    .map((entry, index) => {
      if (typeof entry !== 'object' || entry === null) {
        return null;
      }
      const item = entry as Record<string, unknown>;
      const label = str(item.label) ?? str(item.title) ?? str(item.name);
      if (!label) {
        return null;
      }
      const href = str(item.href) ?? str(item.link) ?? str(item.action_url) ?? str(item.route);
      return {
        id: str(item.id) ?? str(item.key) ?? `onboarding-${index}`,
        label,
        done:
          item.done === true ||
          item.completed === true ||
          item.checked === true ||
          item.is_done === true ||
          item.complete === true,
        href: href !== null && href.startsWith('/') && !href.startsWith('//') ? href : null,
      } satisfies OnboardingItem;
    })
    .filter((item): item is OnboardingItem => item !== null);
}

export function useOnboarding(options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: ['studio', 'onboarding', orgId],
    queryFn: () => engine<unknown>('/console/onboarding'),
    enabled: (options?.enabled ?? true) && !!orgId,
    staleTime: 60_000,
    select: parseOnboarding,
  });
}
