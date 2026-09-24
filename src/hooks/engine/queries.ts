/**
 * Engine query hooks — every read surface the /platform area consumes.
 * Keyed under ['engine', …] with sensible stale times (org furniture is
 * near-realtime; usage/billing rollups are heavier and cached longer).
 */
import { useQuery } from '@tanstack/react-query';
import { engine } from '@lib/engine/client';
import { useOrg } from '@/Context/OrgContext';

export function useOrgRequired(): string {
  const { orgId } = useOrg();
  if (!orgId) {
    throw new Error('No active organization');
  }
  return orgId;
}

// ── Org furniture ──────────────────────────────────────────────────────────

/**
 * Engine `MemberRow` (`memberships.service.ts:16-30` + groups joined in
 * `listMembers`): identity + membership + provenance. `invitedBy` /
 * `suspendedAt` / `suspendedBy` ride the suspension/reactivate copy and the
 * member audit trail — carried, never dropped.
 */
export interface MemberRow {
  accountId: string;
  email: string;
  displayName: string | null;
  role: string;
  status: string;
  mfaLevel: string;
  emailVerified: boolean;
  lastLoginAt: string | null;
  memberSince: string;
  lastActiveAt: string | null;
  invitedBy: string | null;
  suspendedAt: string | null;
  suspendedBy: string | null;
  groups?: Array<{ id: string; name: string }>;
}

export function useMembers(params: { q?: string; status?: string; limit?: number; offset?: number } = {}, options?: { enabled?: boolean }) {
  // Null-safe (vs useOrgRequired): palette/search consumers render during
  // org resolution and must not crash — the query simply stays disabled.
  const { orgId } = useOrg();
  return useQuery({
    queryKey: ['engine', 'members', orgId, params],
    queryFn: () => engine<{ members: MemberRow[]; total: number }>(`/console/org/${orgId}/members`, { query: { ...params } }),
    enabled: (options?.enabled ?? true) && !!orgId,
  });
}

export function useOrgSummary() {
  const orgId = useOrgRequired();
  return useQuery({
    queryKey: ['engine', 'org-summary', orgId],
    queryFn: () =>
      engine<{
        members: { total: number; active: number; suspended: number };
        pendingInvites: number;
        serviceAccounts: { total: number; active: number };
        groups: number;
        maxMembers: number;
        seats: Array<{ product: string; plan: string; seats: number | null; activeMembers: number; utilization: number | null; state: string }>;
      }>(`/console/org/${orgId}/summary`),
    staleTime: 15_000,
  });
}

/**
 * Engine `InviteView` (`invites.service.ts:20-33`): the hash-free invite row.
 * `acceptedAt` / `revokedAt` / `attempts` explain terminal rows (expired vs
 * revoked vs locked); `updatedAt` orders re-sends. Never carries URL/token
 * (hash-only storage) — see `toView`.
 */
export interface InviteRow {
  id: string;
  email: string;
  role: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  invitedBy: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  resendCount: number;
  attempts: number;
}

export function useInvites() {
  const orgId = useOrgRequired();
  return useQuery({
    queryKey: ['engine', 'invites', orgId],
    queryFn: () => engine<{ invites: InviteRow[] }>(`/console/org/${orgId}/invites`),
  });
}

export interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  archivedAt: string | null;
  createdAt: string;
}

export function useProjects(includeArchived = false) {
  // Null-safe (vs useOrgRequired): PlatformShell renders its sign-in card
  // for anonymous visitors and a skeleton while the session is unknown —
  // both states have no orgId and must not crash. The query simply stays
  // disabled until an org resolves.
  const { orgId } = useOrg();
  return useQuery({
    queryKey: ['engine', 'projects', orgId, includeArchived],
    queryFn: () => engine<{ projects: ProjectRow[] }>(`/console/org/${orgId}/projects`, { query: { include_archived: includeArchived } }),
    enabled: !!orgId,
  });
}

export interface KeyRow {
  id: string;
  name: string;
  prefix: string;
  role: string;
  scopes: string[];
  expiresAt: string | null;
  revoked: boolean;
  usageCount: number;
  lastUsedAt: string | null;
  createdAt: string;
}

export function useKeys(options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: ['engine', 'keys', orgId],
    queryFn: () => engine<{ keys: KeyRow[] }>(`/console/org/${orgId}/keys`),
    enabled: (options?.enabled ?? true) && !!orgId,
  });
}

export interface GroupRow {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
}

export function useGroups() {
  const orgId = useOrgRequired();
  return useQuery({
    queryKey: ['engine', 'groups', orgId],
    queryFn: () => engine<{ groups: GroupRow[] }>(`/console/org/${orgId}/groups`),
  });
}

export interface ServiceAccountRow {
  id: string;
  name: string;
  description: string | null;
  status: 'active' | 'disabled';
  scopes: string[];
  hasToken: boolean;
  tokenPrefix: string | null;
  tokenLastUsedAt: string | null;
  tokenLastRotatedAt: string | null;
  createdAt: string;
}

export function useServiceAccounts() {
  const orgId = useOrgRequired();
  return useQuery({
    queryKey: ['engine', 'service-accounts', orgId],
    queryFn: () => engine<{ serviceAccounts: ServiceAccountRow[] }>(`/console/org/${orgId}/service-accounts`),
  });
}

export interface EntitlementRow {
  product: string;
  plan: string;
  status: string;
  seats: number | null;
  periodEnd: string | null;
  msRemaining: number | null;
}

export function useEntitlements() {
  const orgId = useOrgRequired();
  return useQuery({
    queryKey: ['engine', 'entitlements', orgId],
    queryFn: () => engine<{ entitlements: EntitlementRow[] }>(`/console/org/${orgId}/entitlements`),
    staleTime: 30_000,
  });
}

export function useOrgProfile() {
  const orgId = useOrgRequired();
  return useQuery({
    queryKey: ['engine', 'org-profile', orgId],
    queryFn: () =>
      engine<{
        org: { id: string; name: string; slug: string; region: string | null; retentionDays: number | null; createdAt: string | null };
        settings: { supportEmail: string | null; defaultProjectId: string | null; branding: Record<string, unknown>; preferences: Record<string, unknown> };
      }>(`/console/org/${orgId}`),
  });
}

export function useDeletionStatus() {
  const orgId = useOrgRequired();
  return useQuery({
    queryKey: ['engine', 'deletion-status', orgId],
    queryFn: () => engine<{ deletion: { status: string; scheduled_purge_at: string | null } | null }>(`/console/org/${orgId}/deletion-status`),
  });
}

// ── Audit ───────────────────────────────────────────────────────────────────

export interface AuditEventRow {
  id: string;
  actor_type: string;
  actor_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: unknown;
  created_at: string;
}

/**
 * Audit trail — the engine's cursor-paginated contract
 * (console-platform.controller.ts → ConsoleAuditQueryService):
 * filters { actor, action, from, to, before, limit } → { events, nextCursor }.
 * There is no offset/total/resource_type filter server-side; callers that
 * need deeper traversal page with `before: <nextCursor>`.
 */
export function useAudit(filters: { actor?: string; action?: string; from?: string; to?: string; limit?: number; before?: string }) {
  const orgId = useOrgRequired();
  return useQuery({
    queryKey: ['engine', 'audit', orgId, filters],
    queryFn: () => engine<{ events: AuditEventRow[]; nextCursor: string | null }>(`/console/org/${orgId}/audit`, { query: { ...filters } }),
  });
}

export function useAuditFacets() {
  const orgId = useOrgRequired();
  return useQuery({
    queryKey: ['engine', 'audit-facets', orgId],
    queryFn: () => engine<{ actions: string[]; resourceTypes: string[] }>(`/console/org/${orgId}/audit/facets`),
    staleTime: 5 * 60_000,
  });
}

// ── Usage / billing ─────────────────────────────────────────────────────────

export function useUsageOverview() {
  const orgId = useOrgRequired();
  return useQuery({
    queryKey: ['engine', 'usage-overview', orgId],
    queryFn: () => engine<Record<string, unknown>>(`/console/usage/${orgId}/overview`),
    staleTime: 60_000,
  });
}

export function useUsageRollup() {
  const orgId = useOrgRequired();
  return useQuery({
    queryKey: ['engine', 'usage-rollup', orgId],
    queryFn: () => engine<Record<string, unknown>>(`/console/usage/${orgId}/rollup`),
    staleTime: 60_000,
  });
}

export function useLedgers() {
  const orgId = useOrgRequired();
  return useQuery({
    queryKey: ['engine', 'ledgers', orgId],
    queryFn: () => engine<Record<string, unknown>>(`/console/billing/${orgId}/ledgers`),
    staleTime: 60_000,
  });
}

export function useInvoices() {
  const orgId = useOrgRequired();
  return useQuery({
    queryKey: ['engine', 'invoices', orgId],
    queryFn: () => engine<{ invoices: unknown[] }>(`/console/billing/${orgId}/invoices`),
    staleTime: 60_000,
  });
}

// ── Status / platform ───────────────────────────────────────────────────────

export function usePlatformStatus() {
  return useQuery({
    queryKey: ['engine', 'status'],
    queryFn: () =>
      engine<{
        overall: 'operational' | 'degraded' | 'outage';
        components: Array<{ name: string; ok: boolean }>;
        satellites: Array<{ key: string; status: string; liveness: string; heartbeat_age_seconds: number | null }>;
        announcements: Array<Record<string, unknown>>;
      }>('/console/status'),
    staleTime: 30_000,
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ['engine', 'notifications'],
    queryFn: () => engine<{ notifications: unknown[] }>('/console/notifications'),
  });
}

export function useOnboarding() {
  return useQuery({
    queryKey: ['engine', 'onboarding'],
    queryFn: () => engine<Record<string, unknown>>('/console/onboarding'),
    staleTime: 5 * 60_000,
  });
}

// ── Org limits (billing tab meters) ────────────────────────────────────────

export interface QuotaMeter {
  label: string;
  used: number;
  limit: number | null;
}

function meterLabelFromKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b(monthly|events|spend|usd)\b/gi, (m) => m.toUpperCase() === 'USD' ? 'USD' : m)
    .trim();
}

/** Defensive walk: any `{used|spent|current, limit|max}` pair becomes a meter. */
export function parseQuotaMeters(raw: unknown, product: string): QuotaMeter[] {
  if (typeof raw !== 'object' || raw === null) {
    return [];
  }
  const record = raw as Record<string, unknown>;
  const scope =
    (typeof record.products === 'object' && record.products !== null && (record.products as Record<string, unknown>)[product]) ??
    (typeof record.quotas === 'object' && record.quotas !== null ? (record.quotas as Record<string, unknown>)[product] : undefined) ??
    record[product] ??
    record;
  if (typeof scope !== 'object' || scope === null) {
    return [];
  }
  const meters: QuotaMeter[] = [];
  for (const [key, value] of Object.entries(scope as Record<string, unknown>)) {
    if (typeof value !== 'object' || value === null) {
      continue;
    }
    const bucket = value as Record<string, unknown>;
    const used = bucket.used ?? bucket.spent ?? bucket.current;
    const limit = bucket.limit ?? bucket.max ?? null;
    if (typeof used !== 'number') {
      continue;
    }
    meters.push({
      label: meterLabelFromKey(key),
      used,
      limit: typeof limit === 'number' ? limit : null,
    });
  }
  return meters;
}

export function useOrgLimits(options?: { enabled?: boolean }) {
  // Null-safe: settings/billing render during org resolution.
  const { orgId } = useOrg();
  return useQuery({
    queryKey: ['engine', 'limits', orgId],
    queryFn: () => engine<Record<string, unknown>>(`/console/org/${orgId}/limits`),
    enabled: (options?.enabled ?? true) && !!orgId,
    staleTime: 60_000,
  });
}
