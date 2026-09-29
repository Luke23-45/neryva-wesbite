import { describe, expect, it } from 'vitest';
import { canPerform, canSetup } from './capabilities';
import type { EntitlementState, OrgRole } from '@/Context/OrgContext';

/**
 * Console field audit — dashboard role gates (D-01, D-09): the STATIC
 * permission matrix.
 *
 * This file pins the pure capability functions `canPerform`/`canSetup` to
 * the engine's role sets. It does NOT exercise the live gate wirings —
 * reverting a wiring (the `enabled` flag in the component) leaves every
 * test here green. The wirings are pinned separately, each against the
 * real component/hook on a stubbed engine:
 *
 * - D-01: `DashboardView` gates `useUsageSeries` on `can('billing:view')`
 *   (dashboard/DashboardView.tsx) and renders honest "not visible to your
 *   role" copy for the rest instead of firing a doomed request the engine
 *   would 403 — pinned by dashboard/DashboardView.gates.test.tsx (no
 *   usage-series request fires for reader; it fires for owner).
 * - D-09: `SetupChecklist` skips the approvals read for roles the engine
 *   refuses via `useApprovals('PENDING', { enabled: canReadApprovals })`
 *   (dashboard/SetupChecklist.tsx; a refused read would otherwise kill the
 *   whole panel through the panel-level `failed` list) — pinned by
 *   dashboard/SetupChecklist.test.tsx's "gate wiring" block (no approvals
 *   request fires for reader; it fires for owner).
 *
 * Non-vacuity: each wiring test was verified to FAIL when its gate was
 * temporarily reverted to always-enabled (2026-09-29), then restored.
 */
const ALL_ROLES: readonly OrgRole[] = ['owner', 'admin', 'billing', 'developer', 'reader'];

describe('D-01 — billing:view gate mirrors the usage endpoint roles', () => {
  it.each(ALL_ROLES)('role %s: billing:view is %s', (role) => {
    const expected = role === 'owner' || role === 'admin' || role === 'billing';
    expect(canPerform(role, 'active', 'billing:view')).toBe(expected);
  });

  it('developer/reader are refused on every entitlement state', () => {
    const states: readonly EntitlementState[] = ['none', 'trial', 'active', 'past_due', 'suspended', 'expired'];
    for (const state of states) {
      expect(canPerform('developer', state, 'billing:view')).toBe(false);
      expect(canPerform('reader', state, 'billing:view')).toBe(false);
    }
  });

  it('owner/admin/billing pass on every entitlement state', () => {
    const states: readonly EntitlementState[] = ['none', 'trial', 'active', 'past_due', 'suspended', 'expired'];
    for (const state of states) {
      expect(canPerform('owner', state, 'billing:view')).toBe(true);
      expect(canPerform('admin', state, 'billing:view')).toBe(true);
      expect(canPerform('billing', state, 'billing:view')).toBe(true);
    }
  });

  it('null role (non-member) gets nothing', () => {
    expect(canPerform(null, 'active', 'billing:view')).toBe(false);
  });
});

describe('D-09 — setup:author gate mirrors the approvals endpoint roles', () => {
  it.each(ALL_ROLES)('role %s: setup:author is %s', (role) => {
    const expected = role === 'owner' || role === 'admin' || role === 'developer';
    expect(canSetup(role, 'setup:author')).toBe(expected);
  });

  it('reader/billing never read approvals (engine 403s them)', () => {
    expect(canSetup('reader', 'setup:author')).toBe(false);
    expect(canSetup('billing', 'setup:author')).toBe(false);
  });

  it('null role cannot author', () => {
    expect(canSetup(null, 'setup:author')).toBe(false);
  });
});
