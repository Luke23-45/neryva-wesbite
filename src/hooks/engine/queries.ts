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
  groups?: Array<{ id: string; name: string }>;
}

export function useMembers(params: { q?: string; status?: string; limit?: number; offset?: number } = {}) {
  const orgId = useOrgRequired();
  return useQuery({
    queryKey: ['engine', 'members', orgId, params],
    queryFn: () => engine<{ members: MemberRow[]; total: number }>(`/console/org/${orgId}/members`, { query: { ...params } }),
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
        seats: Array<{ product: string; seats: number | null; activeMembers: number; utilization: number | null; state: string }>;
      }>(`/console/org/${orgId}/summary`),
    staleTime: 15_000,
  });
}

export interface InviteRow {
  id: string;
  email: string;
  role: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  invitedBy: string;
  createdAt: string;
  expiresAt: string;
  resendCount: number;
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
  const orgId = useOrgRequired();
  return useQuery({
    queryKey: ['engine', 'projects', orgId, includeArchived],
    queryFn: () => engine<{ projects: ProjectRow[] }>(`/console/org/${orgId}/projects`, { query: { include_archived: includeArchived } }),
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

export function useKeys() {
  const orgId = useOrgRequired();
  return useQuery({
    queryKey: ['engine', 'keys', orgId],
    queryFn: () => engine<{ keys: KeyRow[] }>(`/console/org/${orgId}/keys`),
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

export function useAudit(filters: { actor_id?: string; action?: string; resource_type?: string; from?: string; to?: string; limit?: number; offset?: number }) {
  const orgId = useOrgRequired();
  return useQuery({
    queryKey: ['engine', 'audit', orgId, filters],
    queryFn: () => engine<{ events: AuditEventRow[]; total: number }>(`/console/org/${orgId}/audit`, { query: { ...filters } }),
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
