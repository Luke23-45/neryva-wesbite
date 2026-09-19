/**
 * Capability gating (frontend-engine-integration-plan A3/A4).
 *
 * Two axes decide what a session may do, per the console access-model
 * (`engine/docs/legacy/architecture/console/access-model.md`):
 *  1. Membership role (org axis): owner > admin > billing/developer > reader.
 *  2. Entitlement state (product axis): none/trial/active/past_due/suspended/expired.
 *
 * Scopes are the product manifests' scopes (`engine/products_manifests/*.yaml`)
 * plus three console-level scopes that are org-axis only.
 *
 * UI convention (enforced through `useCan`, never per-view ad hoc):
 *  - Content a role can never see → hidden (nav items, menu entries).
 *  - Content the role could use with a different role/plan → rendered but
 *    disabled, with a `title` stating why (discoverability beats blankness).
 */
import { useCallback } from 'react';
import { useOrg } from '@/Context/OrgContext';
import type { EntitlementState, OrgRole } from '@/Context/OrgContext';

/** Manifest scopes per product — keep in sync with `engine/products_manifests/`. */
export const PRODUCT_SCOPES: Record<string, readonly string[]> = {
  agent_studio: ['studio:read', 'studio:write', 'studio:publish'],
  deployment: ['deployment:read', 'deployment:write', 'deployment:operate'],
};

/** Console-level scopes (org axis only — they are not product manifest scopes). */
export type ConsoleScope = 'billing:view' | 'billing:manage' | 'audit:view';

/** Reads stay alive on payment states (past_due/suspended are read-only, not dark). */
const PRODUCT_READ_STATES: readonly EntitlementState[] = ['trial', 'active', 'past_due', 'suspended'];
/** Writes exist only while the entitlement is live. */
const PRODUCT_WRITE_STATES: readonly EntitlementState[] = ['trial', 'active'];

const CAN_MANAGE_PRODUCTS: readonly OrgRole[] = ['owner', 'admin', 'developer'];
const CAN_BILLING_VIEW: readonly OrgRole[] = ['owner', 'admin', 'billing'];
const CAN_BILLING_MANAGE: readonly OrgRole[] = ['owner', 'billing'];

/**
 * The access-model matrix as a pure function (owner/admin/billing/developer/reader ×
 * entitlement state × scope):
 *  - product `:read`            → every role, while reads are alive
 *  - product `:write|:publish|:operate` → owner/admin/developer, live entitlement only
 *  - `billing:view`             → owner/admin/billing (any state — recovery needs visibility)
 *  - `billing:manage`           → owner/billing (any state — paying is how you recover)
 *  - `audit:view`               → everyone but reader
 */
export function canPerform(role: OrgRole | null, state: EntitlementState, scope: string): boolean {
  if (!role) {
    return false;
  }
  if (scope === 'billing:view') {
    return CAN_BILLING_VIEW.includes(role);
  }
  if (scope === 'billing:manage') {
    return CAN_BILLING_MANAGE.includes(role);
  }
  if (scope === 'audit:view') {
    return role !== 'reader';
  }
  if (scope.endsWith(':read')) {
    return PRODUCT_READ_STATES.includes(state);
  }
  if (scope.endsWith(':write') || scope.endsWith(':publish') || scope.endsWith(':operate')) {
    return CAN_MANAGE_PRODUCTS.includes(role) && PRODUCT_WRITE_STATES.includes(state);
  }
  return false;
}

/**
 * `const can = useCan('agent_studio'); can('studio:write')` — combine the
 * org role with the product's entitlement state. Scope must be one of the
 * product's manifest scopes or a ConsoleScope.
 */
export function useCan(product: string): (scope: string) => boolean {
  const { role, entitlementState } = useOrg();
  const state = entitlementState(product);
  return useCallback((scope: string) => canPerform(role, state, scope), [role, state]);
}

// ─── Setup-plane acts (team_setup_ledger.md §8) ─────────────────────────
// Agent setup is org-axis only (no product entitlement): the engine's
// @Roles decide, the UI mirrors. Two tiers — makers (owner/admin/developer)
// author drafts, test, evaluate, link connectors, manage tools/memories;
// governors (owner/admin) publish, roll back, retire, disable, kill, move
// rollout/release pointers, manage blocks, BYOK, enablements, OAuth apps,
// and review candidates. Reads stay open to every role the route allows
// (all incl. billing for most setup reads) — no gate needed for reads.

export type SetupAct = 'setup:author' | 'setup:govern';

const SETUP_AUTHORS: readonly OrgRole[] = ['owner', 'admin', 'developer'];
const SETUP_GOVERNORS: readonly OrgRole[] = ['owner', 'admin'];

/** Pure role check for setup acts. Hidden button ≠ security boundary — the engine enforces regardless. */
export function canSetup(role: OrgRole | null, act: SetupAct): boolean {
  if (!role) {
    return false;
  }
  return act === 'setup:govern' ? SETUP_GOVERNORS.includes(role) : SETUP_AUTHORS.includes(role);
}

/** Denied-state copy: names the required tier and the caller's role (discoverability beats blankness). */
export function setupDeniedCopy(role: OrgRole | null, act: SetupAct): string {
  const needed = act === 'setup:govern' ? 'an owner or admin' : 'an owner, admin, or developer';
  const yours = role ? `your role is ${role}` : 'you are not a member of this organization';
  return `This action requires ${needed} — ${yours}.`;
}

export function useCanSetup(): (act: SetupAct) => boolean {
  const { role } = useOrg();
  return useCallback((act: SetupAct) => canSetup(role, act), [role]);
}
