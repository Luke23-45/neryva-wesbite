/**
 * The org/project/entitlement context (frontend-engine-integration-plan A3/A4).
 *
 * OrgProvider resolves the caller's org contexts once, keeps the active org
 * (persisted per browser), and exposes everything the shell + pages need:
 * orgId, role, projects (+ active project), and per-product entitlement
 * states with helpers for the access-model banner/read-only modes.
 */
import { createContext, useContext, useEffect, useMemo, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { engine, setActiveOrg } from '@lib/engine/client';
import { useSessionStore } from '@lib/engine/auth';

export type OrgRole = 'owner' | 'admin' | 'billing' | 'developer' | 'reader';
export type EntitlementState = 'none' | 'trial' | 'active' | 'past_due' | 'suspended' | 'expired';

export const ROLE_LABELS: Record<OrgRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  billing: 'Billing',
  developer: 'Developer',
  reader: 'Reader',
};
export const ROLE_SUBTITLES: Record<OrgRole, string> = {
  owner: 'Full control, including deletion and transfer',
  admin: 'Members, projects, and product resources',
  billing: 'Plans, usage, and invoices',
  developer: 'Product resources, projects, and API keys',
  reader: 'Read-only visibility',
};
const ROLE_RANK: Record<OrgRole, number> = { owner: 4, admin: 3, billing: 2, developer: 2, reader: 1 };

export interface OrgContextValue {
  orgId: string | null;
  orgs: Array<{ orgId: string; role: string; name: string | null }>;
  role: OrgRole | null;
  name: string | null;
  setActive: (orgId: string) => void;
  atLeast: (role: OrgRole) => boolean;
  canManageMembers: boolean;
  entitlementState: (product: string) => EntitlementState;
}

const ACTIVE_ORG_KEY = 'neryva.active_org';

interface HomeResponse {
  org: { id: string; name: string; role: string; projects: Array<{ id: string; name: string }> } | null;
  orgs: Array<{ orgId: string; role: string; name: string | null }>;
  products: Array<{ key: string; entitlement_state: EntitlementState }>;
}

const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgProvider({ children }: { children: ReactNode }) {
  const status = useSessionStore((s) => s.status);
  const authenticated = status === 'authenticated';

  const home = useQuery({
    queryKey: ['engine', 'home'],
    queryFn: () => engine<HomeResponse>('/console/home'),
    enabled: authenticated,
    staleTime: 30_000,
  });

  const orgs = home.data?.orgs ?? [];
  const stored = typeof window !== 'undefined' ? window.localStorage.getItem(ACTIVE_ORG_KEY) : null;
  const active = useMemo(() => {
    if (!orgs.length) {
      return null;
    }
    return orgs.find((o) => o.orgId === stored) ?? orgs[0];
  }, [orgs, stored]);

  useEffect(() => {
    if (active) {
      window.localStorage.setItem(ACTIVE_ORG_KEY, active.orgId);
    }
  }, [active]);

  const orgId = active?.orgId ?? null;
  useEffect(() => {
    setActiveOrg(orgId);
    return () => setActiveOrg(null);
  }, [orgId]);

  const value = useMemo<OrgContextValue>(() => {
    const role = (active?.role as OrgRole | undefined) ?? null;
    const stateByProduct = new Map((home.data?.products ?? []).map((p) => [p.key, p.entitlement_state]));
    return {
      orgId,
      orgs,
      role,
      name: active?.name ?? null,
      setActive: (next) => window.localStorage.setItem(ACTIVE_ORG_KEY, next),
      atLeast: (minimum) => role !== null && ROLE_RANK[role] >= ROLE_RANK[minimum],
      canManageMembers: role === 'owner' || role === 'admin',
      entitlementState: (product) => stateByProduct.get(product) ?? 'none',
    };
  }, [orgId, orgs, active?.role, active?.name, home.data?.products]);

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrg(): OrgContextValue {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error('useOrg used outside OrgProvider');
  }
  return context;
}
