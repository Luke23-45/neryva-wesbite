/**
 * Operate + observe (team_setup_ledger.md F-E5/E6) over the EXACT contract:
 *
 * Rollouts (`engine/src/modules/assistants/rollouts.{controller,service}.ts`,
 * releases.controller.ts):
 * - GET assistants/:a/rollout → {rollout: AssistantRollout | null};
 * - POST assistants/:a/rollout {versions!} → {rollout} (1–10 variants,
 *   {version_id, weight positive int}, weights sum exactly 100, every
 *   version PUBLISHED, version-blocked or BLOCK-decided unassignable —
 *   409 `version <id> is BLOCKed by evaluation — resolve and re-evaluate
 *   before promoting`);
 * - POST assistants/:a/rollout/pause (no body);
 * - GET assistants/:a/releases?environment&channel (defaults
 *   production/default) → {release};
 * - PUT assistants/:a/releases/ {environment?, channel?, versions?} →
 *   {release}.
 * Rows carry state active|paused + paused_reason/by/at (manual = actor,
 * burn-rate = reason+costs; NULL on pre-attribution rows =
 * operator-paused-legacy; cleared on resume). Banner verbatim.
 *
 * Control blocks (control-blocks.controller.ts, owner/admin):
 * - GET control-blocks → {blocks};
 * - POST control-blocks {target_type! ∈
 *   assistant|version|tool|template|capability, target_name! 1..128,
 *   reason! 1..512 MANDATORY, expires_at?} → {block};
 * - DELETE control-blocks/:blockId.
 * No warn mode; expiry needs no worker.
 *
 * Observe (harness-parity.controller.ts:181-192, analytics.query.service.ts):
 * - GET analytics/rollups?kind&days&assistant_id → {rollups:
 *   [{kind, period_start, scope, metrics, computed_at}]} (days default 30,
 *   clamp 1..365; all roles incl. billing).
 */
import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { engine } from '@lib/engine/client';
import { toastEngineError } from '@lib/engine/errors';
import { useOrg } from '@/Context/OrgContext';
import { useMembers } from '@hooks/engine/queries';

const OPERATE_KEY = ['studio', 'setup', 'operate'] as const;

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

export interface RolloutVariant {
  version_id: string;
  weight: number;
}

export interface AssistantRollout {
  id: string | null;
  state: string | null;
  environment: string | null;
  channel: string | null;
  variants: RolloutVariant[];
  pausedReason: string | null;
  pausedBy: string | null;
  pausedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

function parseVariants(raw: unknown): RolloutVariant[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const variants: RolloutVariant[] = [];
  for (const entry of raw) {
    if (typeof entry !== 'object' || entry === null) {
      continue;
    }
    const item = entry as Record<string, unknown>;
    const versionId = str(item.version_id) ?? str(item.versionId);
    if (!versionId || typeof item.weight !== 'number') {
      continue;
    }
    variants.push({ version_id: versionId, weight: item.weight });
  }
  return variants;
}

export function parseRollout(raw: unknown): AssistantRollout | null {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const inner = (['rollout', 'release'] as const)
    .map((key) => record[key])
    .find((value) => typeof value === 'object' && value !== null) as Record<string, unknown> | undefined;
  const row = inner ?? (typeof record.id === 'string' || typeof record.state === 'string' ? record : null);
  if (!row) {
    return null;
  }
  return {
    id: str(row.id),
    state: str(row.state),
    environment: str(row.environment),
    channel: str(row.channel),
    variants: parseVariants(row.versions ?? row.variants),
    pausedReason: str(row.pausedReason) ?? str(row.paused_reason),
    pausedBy: str(row.pausedBy) ?? str(row.paused_by),
    pausedAt: str(row.pausedAt) ?? str(row.paused_at),
    createdAt: str(row.createdAt) ?? str(row.created_at),
    updatedAt: str(row.updatedAt) ?? str(row.updated_at),
  };
}

function operateKey(orgId: string | null, assistantId: string | null) {
  return [...OPERATE_KEY, orgId, assistantId] as const;
}

export function useRollout(assistantId: string | null, options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...operateKey(orgId, assistantId), 'rollout'],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/assistants/${assistantId}/rollout`),
    enabled: (options?.enabled ?? true) && !!orgId && !!assistantId,
    staleTime: 15_000,
    select: parseRollout,
  });
}

export function useReleasePointer(assistantId: string | null, environment?: string, channel?: string) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...operateKey(orgId, assistantId), 'release', environment ?? null, channel ?? null],
    queryFn: () =>
      engine<unknown>(`/console/org/${orgId}/assistants/${assistantId}/releases`, {
        query: { environment, channel },
      }),
    enabled: !!orgId && !!assistantId,
    staleTime: 15_000,
    select: parseRollout,
  });
}

function useInvalidateOperate(assistantId: string | null) {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: operateKey(orgId, assistantId) });
}

export function useSetRollout(assistantId: string | null) {
  const { orgId } = useOrg();
  const invalidate = useInvalidateOperate(assistantId);
  return useMutation({
    mutationFn: async (variants: RolloutVariant[]) =>
      engine(`/console/org/${orgId}/assistants/${assistantId}/rollout`, {
        method: 'POST',
        body: { versions: variants },
        idempotent: true,
      }),
    onSuccess: () => invalidate(),
    onError: (error) => toastEngineError(error, 'Could not set the rollout'),
  });
}

export function usePauseRollout(assistantId: string | null) {
  const { orgId } = useOrg();
  const invalidate = useInvalidateOperate(assistantId);
  return useMutation({
    mutationFn: async () => engine(`/console/org/${orgId}/assistants/${assistantId}/rollout/pause`, { method: 'POST', idempotent: true }),
    onSuccess: () => invalidate(),
    onError: (error) => toastEngineError(error, 'Could not pause the rollout'),
  });
}

export function useMoveRelease(assistantId: string | null) {
  const { orgId } = useOrg();
  const invalidate = useInvalidateOperate(assistantId);
  return useMutation({
    mutationFn: async (input: { environment?: string; channel?: string; versions: RolloutVariant[] }) =>
      engine(`/console/org/${orgId}/assistants/${assistantId}/releases`, {
        method: 'PUT',
        body: {
          ...(input.environment ? { environment: input.environment } : {}),
          ...(input.channel ? { channel: input.channel } : {}),
          versions: input.versions,
        },
        idempotent: true,
      }),
    onSuccess: () => invalidate(),
    onError: (error) => toastEngineError(error, 'Could not move the release pointer'),
  });
}

export const BLOCK_TARGETS = ['assistant', 'version', 'tool', 'template', 'capability'] as const;

/**
 * Block liveness, computed client-side — expiry is evaluated at check time
 * server-side with no sweeper, so the UI must never trust a stored flag
 * (SIDEBAR_LEDGER.md P2 / report F3 acceptance).
 */
export function isBlockActive(block: Pick<ControlBlock, 'expiresAt'>, nowMs = Date.now()): boolean {
  if (block.expiresAt === null || block.expiresAt === undefined) return true;
  const parsed = new Date(block.expiresAt).getTime();
  if (Number.isNaN(parsed)) return true;
  return parsed > nowMs;
}

export function describeBlockExpiry(expiresAt: string | null): string {
  if (expiresAt === null || expiresAt === undefined) return 'no expiry';
  const parsed = new Date(expiresAt).getTime();
  if (Number.isNaN(parsed)) return 'no expiry';
  const diffMs = parsed - Date.now();
  if (diffMs <= 0) return 'expired';
  // Sub-day buckets: Math.ceil on whole days rounded a 90-second expiry up
  // to "expires tomorrow" (browser-found P5-BL anomaly). Hours/minutes keep
  // the pill honest for short-lived blocks.
  const minutes = Math.ceil(diffMs / 60_000);
  if (minutes < 60) return `expires in ${minutes} min`;
  const hours = Math.ceil(diffMs / 3_600_000);
  if (hours < 24) return `expires in ${hours} h`;
  const days = Math.ceil(diffMs / 86_400_000);
  if (days === 1) return 'expires tomorrow';
  return `expires in ${days} days`;
}

export type BlockTargetFilter = 'all' | (typeof BLOCK_TARGETS)[number];
export type BlockStatusFilter = 'all' | 'active' | 'expiring' | 'expired' | 'permanent';

export interface BlockFilter {
  target: BlockTargetFilter;
  status: BlockStatusFilter;
  query: string;
}

/** Days before expiry a block counts as "expiring" (amber, not red). */
export const BLOCK_EXPIRING_WITHIN_DAYS = 7;

/**
 * Client-side block filtering (C07) — the list query stays single-source
 * (`useControlBlocks`); this only narrows what renders. Status reuses
 * `isBlockActive` (never a parallel liveness derivation).
 */
export function filterBlocks(blocks: ControlBlock[], filter: BlockFilter, nowMs = Date.now()): ControlBlock[] {
  const q = filter.query.trim().toLowerCase();
  return blocks.filter((block) => {
    if (filter.target !== 'all' && block.targetType !== filter.target) return false;
    const active = isBlockActive(block, nowMs);
    switch (filter.status) {
      case 'active':
        if (!active) return false;
        break;
      case 'expired':
        if (active) return false;
        break;
      case 'permanent':
        if (!active || (block.expiresAt !== null && block.expiresAt !== undefined)) return false;
        break;
      case 'expiring': {
        if (!active || block.expiresAt === null || block.expiresAt === undefined) return false;
        const parsed = new Date(block.expiresAt).getTime();
        if (Number.isNaN(parsed)) return false;
        const days = Math.ceil((parsed - nowMs) / 86_400_000);
        if (days <= 0 || days > BLOCK_EXPIRING_WITHIN_DAYS) return false;
        break;
      }
      case 'all':
        break;
    }
    if (q !== '' && !`${block.targetName} ${block.reason}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

/**
 * Template install-block match (engine rule, templates.service.ts: bare `slug`
 * blocks every version of that template; `slug@version` blocks one release).
 * Exact-version match wins over the bare-slug match. Expired rows never match.
 */
export function matchTemplateBlock(
  blocks: ControlBlock[],
  slug: string,
  version: string,
  nowMs = Date.now(),
): ControlBlock | null {
  const candidates = blocks.filter(
    (b) => b.targetType === 'template' && isBlockActive(b, nowMs),
  );
  return (
    candidates.find((b) => b.targetName === `${slug}@${version}`) ??
    candidates.find((b) => b.targetName === slug) ??
    null
  );
}

export interface ControlBlock {
  id: string;
  targetType: string;
  targetName: string;
  reason: string;
  expiresAt: string | null;
  createdBy: string | null;
  createdAt: string | null;
}

export function parseControlBlocks(raw: unknown): ControlBlock[] {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(raw) ? raw : Array.isArray(record.blocks) ? record.blocks : [];
  return list
    .map((entry): ControlBlock | null => {
      if (typeof entry !== 'object' || entry === null) {
        return null;
      }
      const item = entry as Record<string, unknown>;
      const id = str(item.id);
      if (!id) {
        return null;
      }
      return {
        id,
        targetType: str(item.targetType) ?? str(item.target_type) ?? 'unknown',
        targetName: str(item.targetName) ?? str(item.target_name) ?? '',
        reason: str(item.reason) ?? '',
        expiresAt: str(item.expiresAt) ?? str(item.expires_at),
        createdBy: str(item.createdBy) ?? str(item.created_by),
        createdAt: str(item.createdAt) ?? str(item.created_at),
      };
    })
    .filter((b): b is ControlBlock => b !== null);
}

export function useControlBlocks(options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...OPERATE_KEY, orgId, 'blocks'],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/control-blocks`),
    enabled: (options?.enabled ?? true) && !!orgId,
    staleTime: 15_000,
    select: parseControlBlocks,
  });
}

export function useSetControlBlock() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { targetType: string; targetName: string; reason: string; expiresAt?: string }) =>
      engine(`/console/org/${orgId}/control-blocks`, {
        method: 'POST',
        body: {
          target_type: input.targetType,
          target_name: input.targetName,
          reason: input.reason,
          ...(input.expiresAt ? { expires_at: input.expiresAt } : {}),
        },
        idempotent: true,
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...OPERATE_KEY, orgId, 'blocks'] }),
    onError: (error) => toastEngineError(error, 'Could not set the block'),
  });
}

export function useClearControlBlock() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (blockId: string) => engine(`/console/org/${orgId}/control-blocks/${blockId}`, { method: 'DELETE' }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...OPERATE_KEY, orgId, 'blocks'] }),
    onError: (error) => toastEngineError(error, 'Could not clear the block'),
  });
}

export interface AnalyticsRollup {
  kind: string;
  periodStart: string | null;
  scope: Record<string, unknown>;
  metrics: Record<string, unknown>;
  computedAt: string | null;
}

export function parseRollups(raw: unknown): AnalyticsRollup[] {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(raw) ? raw : Array.isArray(record.rollups) ? record.rollups : [];
  return list
    .map((entry): AnalyticsRollup | null => {
      if (typeof entry !== 'object' || entry === null) {
        return null;
      }
      const item = entry as Record<string, unknown>;
      const kind = str(item.kind);
      if (!kind) {
        return null;
      }
      return {
        kind,
        periodStart: str(item.period_start) ?? str(item.periodStart),
        scope: typeof item.scope === 'object' && item.scope !== null ? (item.scope as Record<string, unknown>) : {},
        metrics: typeof item.metrics === 'object' && item.metrics !== null ? (item.metrics as Record<string, unknown>) : {},
        computedAt: str(item.computed_at) ?? str(item.computedAt),
      };
    })
    .filter((r): r is AnalyticsRollup => r !== null);
}

/** Verified kind vocabulary (analytics-rollup.consumer.ts:16-23,126-195). */
export const ROLLUP_KINDS = ['assistant_csat_daily', 'assistant_outcomes_daily', 'assistant_usage_daily', 'csat_daily', 'conversation_outcomes', 'usage_daily'] as const;

/**
 * G10: actor/account ids → human names (display name, else email, else
 * shortened id). Operators don't know UUIDs — every paused-by/decided-by/
 * published-by surface reads through this. Unknown ids render shortened,
 * never blank.
 */
export function useMemberNameMap(options?: { enabled?: boolean }) {
  const members = useMembers({}, options);
  const map = useMemo(() => {
    const names = new Map<string, string>();
    for (const member of members.data?.members ?? []) {
      names.set(member.accountId, member.displayName || member.email || member.accountId);
    }
    return names;
  }, [members.data]);
  return {
    ...members,
    nameOf: (accountId: string | null): string => {
      if (!accountId) {
        return 'unknown';
      }
      return map.get(accountId) ?? `${accountId.slice(0, 8)}…`;
    },
  };
}

export function useAnalyticsRollups(input: { kind?: string; days?: number; assistantId?: string }, options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...OPERATE_KEY, orgId, 'rollups', input.kind ?? null, input.days ?? null, input.assistantId ?? null],
    queryFn: () =>
      engine<unknown>(`/console/org/${orgId}/analytics/rollups`, {
        query: {
          kind: input.kind,
          days: input.days,
          assistant_id: input.assistantId,
        },
      }),
    enabled: (options?.enabled ?? true) && !!orgId,
    staleTime: 60_000,
    select: parseRollups,
  });
}
