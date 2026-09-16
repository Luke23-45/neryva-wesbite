/**
 * The org/project/entitlement context (frontend-engine-integration-plan A3/A4).
 *
 * OrgProvider resolves the caller's org contexts once, keeps the active org
 * (persisted per browser), and exposes everything the shell + pages need:
 * orgId, role, projects (+ active project), and per-product entitlement
 * states with helpers for the access-model banner/read-only modes.
 */
import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { engine, setActiveOrg } from '@lib/engine/client';
import { invalidateOrgScope, invalidateAuthScope } from '@lib/queryClient';
import { useSessionStore, onSessionCleared } from '@lib/engine/auth';

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
  /**
   * Adopt a server-issued org (invite redeem): bypasses the membership
   * pre-check — the server just added us; the home refetch reconciles the
   * list. Until the refetch lands, the active org resolves null (never a
   * wrong org).
   */
  adoptOrg: (orgId: string) => void;
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

export const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgProvider({ children }: { children: ReactNode }) {
  const status = useSessionStore((s) => s.status);
  const authenticated = status === 'authenticated';

  const home = useQuery({
    queryKey: ['org', 'home'],
    queryFn: () => engine<HomeResponse>('/console/home'),
    enabled: authenticated,
    staleTime: 30_000,
  });

  const orgs = home.data?.orgs ?? [];
  // The stored org is state (not a render-time localStorage read) so
  // cross-tab switches propagate and the active-org memo stays honest.
  const [stored, setStored] = useState<string | null>(() =>
    typeof window !== 'undefined' ? window.localStorage.getItem(ACTIVE_ORG_KEY) : null,
  );
  const [override, setOverride] = useState<string | null>(null);
  // Server-issued adoption in flight (invite redeem): the membership list does
  // not include the org until the home refetch lands.
  const [adopted, setAdopted] = useState<string | null>(null);

  // Session death drops the org context synchronously (inside clear(), before
  // any logout redirect): a stale org id must never leak into the next
  // account, and cached org/auth queries must never flash another user's data.
  useEffect(
    () =>
      onSessionCleared(() => {
        setOverride(null);
        setStored(null);
        setAdopted(null);
        try {
          window.localStorage.removeItem(ACTIVE_ORG_KEY);
        } catch {
          /* private mode — in-memory state still drops */
        }
        void invalidateOrgScope();
        void invalidateAuthScope();
      }),
    [],
  );

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === ACTIVE_ORG_KEY) {
        setStored(event.newValue);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const active = useMemo(() => {
    // Logged-out tabs hold no org context even while stale query data lingers
    // (invalidation is async) — otherwise the persist effect below would
    // re-write the org id that session death just removed.
    if (!authenticated || !orgs.length) {
      return null;
    }
    if (adopted && !orgs.some((o) => o.orgId === adopted)) {
      // Adopt-in-flight: the server added us but the home refetch has not
      // landed — null, never a wrong org. Resolves via override below.
      return null;
    }
    const wanted = override ?? stored;
    return orgs.find((o) => o.orgId === wanted) ?? orgs[0];
  }, [authenticated, adopted, orgs, stored, override]);

  useEffect(() => {
    if (active && authenticated) {
      window.localStorage.setItem(ACTIVE_ORG_KEY, active.orgId);
    }
  }, [active, authenticated]);

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
      setActive: (next) => {
        // Refuse orgs outside the membership list — a stale/foreign id must
        // fall back to a real context, never ride the X-Neryva-Org header.
        if (!orgs.some((o) => o.orgId === next)) {
          return;
        }
        setOverride(next);
        setStored(next);
        try {
          window.localStorage.setItem(ACTIVE_ORG_KEY, next);
        } catch {
          /* private mode — in-memory state still switches */
        }
        // Org-scoped queries are keyed ['org', orgId, …] — one prefix
        // invalidation re-resolves every view against the new org.
        void invalidateOrgScope();
      },
      adoptOrg: (next) => {
        // Server-issued adoption (invite redeem): the membership list does not
        // include the org yet, so the pre-check above cannot apply — the
        // server just added us. The header + storage update immediately; the
        // active memo stays null until the home refetch reconciles the list.
        setAdopted(next);
        setOverride(next);
        setStored(next);
        try {
          window.localStorage.setItem(ACTIVE_ORG_KEY, next);
        } catch {
          /* private mode — in-memory state still adopts */
        }
        setActiveOrg(next);
        void invalidateOrgScope();
      },
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
