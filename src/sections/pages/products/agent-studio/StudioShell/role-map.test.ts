import { describe, expect, it } from 'vitest';
import { deniedCopy, isDenied, type NavConfig } from './nav-config';
import navJson from '@neryva_data/products/agent_studio/nav.json';

/**
 * Role-map test (SIDEBAR_LEDGER.md P4): nav `roles` arrays stay honest.
 * - Vocabulary: only engine-known roles may appear.
 * - Pin: Blocks is owner/admin-only (control-blocks.controller.ts:17-46 —
 *   GET/POST/DELETE all @Roles('owner','admin')).
 * - Drift catcher: the set of role-bearing destinations is explicit — any NEW
 *   roles-bearing item fails here until it is added with justification.
 */

const KNOWN_ROLES = new Set(['owner', 'admin', 'developer', 'reader', 'billing']);
const ROLE_BEARING_ALLOWLIST = new Map<string, string[]>([['/agent-studio/blocks', ['owner', 'admin']]]);

const config = navJson as unknown as NavConfig;

describe('nav role map', () => {
  it('uses only engine-known roles', () => {
    for (const domain of config.domains) {
      for (const item of domain.items) {
        for (const role of item.roles ?? []) {
          expect(KNOWN_ROLES.has(role)).toBe(true);
        }
      }
    }
  });

  it('pins Blocks to owner/admin (server truth)', () => {
    const blocks = config.domains
      .flatMap((d) => d.items)
      .find((i) => i.to === '/agent-studio/blocks');
    expect(blocks?.roles).toEqual(['owner', 'admin']);
  });

  it('allows role-bearing destinations only from the explicit allowlist', () => {
    const bearing = new Map<string, string[]>();
    for (const domain of config.domains) {
      for (const item of domain.items) {
        if (item.roles !== undefined && item.roles.length > 0) {
          bearing.set(item.to, item.roles);
        }
      }
    }
    expect([...bearing.keys()].sort()).toEqual([...ROLE_BEARING_ALLOWLIST.keys()].sort());
    for (const [to, roles] of bearing) {
      expect(roles).toEqual(ROLE_BEARING_ALLOWLIST.get(to));
    }
  });
});

describe('isDenied / deniedCopy', () => {
  it('fails open while the role is still loading (server enforces regardless)', () => {
    expect(isDenied(['owner', 'admin'], null)).toBe(false);
    expect(isDenied(undefined, 'reader')).toBe(false);
  });

  it('denies exactly the roles outside the list', () => {
    expect(isDenied(['owner', 'admin'], 'developer')).toBe(true);
    expect(isDenied(['owner', 'admin'], 'admin')).toBe(false);
  });

  it('explains in plain words, never a bare 403', () => {
    expect(deniedCopy(['owner', 'admin'])).toBe('Owners and admins only — ask one for access.');
    expect(deniedCopy(['owner'])).toContain('owner');
  });
});
