import { describe, expect, it } from 'vitest';
import { canPerform, canSetup, setupDeniedCopy } from './capabilities';
import type { OrgRole } from '@/Context/OrgContext';

const ROLES: OrgRole[] = ['owner', 'admin', 'billing', 'developer', 'reader'];

describe('canPerform — the access-model matrix', () => {
  it('product read: every role while reads are alive, never on none/expired', () => {
    for (const role of ROLES) {
      expect(canPerform(role, 'trial', 'studio:read')).toBe(true);
      expect(canPerform(role, 'active', 'studio:read')).toBe(true);
      expect(canPerform(role, 'past_due', 'studio:read')).toBe(true);
      expect(canPerform(role, 'suspended', 'studio:read')).toBe(true);
      expect(canPerform(role, 'none', 'studio:read')).toBe(false);
      expect(canPerform(role, 'expired', 'studio:read')).toBe(false);
    }
  });

  it('product write/publish/operate: owner+admin+developer with a live entitlement only', () => {
    for (const scope of ['studio:write', 'studio:publish', 'deployment:operate']) {
      expect(canPerform('owner', 'active', scope)).toBe(true);
      expect(canPerform('admin', 'active', scope)).toBe(true);
      expect(canPerform('developer', 'active', scope)).toBe(true);
      expect(canPerform('billing', 'active', scope)).toBe(false);
      expect(canPerform('reader', 'active', scope)).toBe(false);
      // payment states are read-only
      expect(canPerform('owner', 'past_due', scope)).toBe(false);
      expect(canPerform('owner', 'suspended', scope)).toBe(false);
      // expired/none deny outright
      expect(canPerform('owner', 'expired', scope)).toBe(false);
      expect(canPerform('owner', 'none', scope)).toBe(false);
    }
  });

  it('billing:view: owner/admin/billing — any state, because recovery needs visibility', () => {
    expect(canPerform('billing', 'past_due', 'billing:view')).toBe(true);
    expect(canPerform('admin', 'none', 'billing:view')).toBe(true);
    expect(canPerform('developer', 'active', 'billing:view')).toBe(false);
    expect(canPerform('reader', 'active', 'billing:view')).toBe(false);
  });

  it('billing:manage: owner/billing — any state, because paying is how you recover', () => {
    expect(canPerform('billing', 'past_due', 'billing:manage')).toBe(true);
    expect(canPerform('owner', 'suspended', 'billing:manage')).toBe(true);
    expect(canPerform('admin', 'active', 'billing:manage')).toBe(false);
  });

  it('audit:view: everyone but reader', () => {
    expect(canPerform('owner', 'active', 'audit:view')).toBe(true);
    expect(canPerform('developer', 'past_due', 'audit:view')).toBe(true);
    expect(canPerform('reader', 'active', 'audit:view')).toBe(false);
  });

  it('no role → nothing; unknown scope → nothing', () => {
    expect(canPerform(null, 'active', 'studio:read')).toBe(false);
    expect(canPerform('owner', 'active', 'studio:explode')).toBe(false);
  });
});

describe('canSetup — the setup-plane tiers (ledger §8)', () => {
  it('authors: owner/admin/developer; governors: owner/admin', () => {
    for (const role of ['owner', 'admin', 'developer'] as OrgRole[]) {
      expect(canSetup(role, 'setup:author')).toBe(true);
    }
    for (const role of ['owner', 'admin'] as OrgRole[]) {
      expect(canSetup(role, 'setup:govern')).toBe(true);
    }
    expect(canSetup('developer', 'setup:govern')).toBe(false);
    for (const role of ['billing', 'reader'] as OrgRole[]) {
      expect(canSetup(role, 'setup:author')).toBe(false);
      expect(canSetup(role, 'setup:govern')).toBe(false);
    }
    expect(canSetup(null, 'setup:author')).toBe(false);
  });

  it('denied copy names the tier and the caller role', () => {
    expect(setupDeniedCopy('developer', 'setup:govern')).toContain('owner or admin');
    expect(setupDeniedCopy('developer', 'setup:govern')).toContain('developer');
    expect(setupDeniedCopy(null, 'setup:author')).toContain('not a member');
  });
});
