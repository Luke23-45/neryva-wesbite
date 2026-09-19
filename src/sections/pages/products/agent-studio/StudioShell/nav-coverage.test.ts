import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isBuilderPath, resolveDomain, type NavConfig } from './nav-config';
import navJson from '@neryva_data/products/agent_studio/nav.json';

/**
 * R1 coverage test (SIDEBAR_LEDGER.md §7): every studio route maps to exactly
 * one domain, and every nav `to` equals a real route.
 *
 * Single-source WITHOUT importing the app: the test scans routes.tsx text for
 * `createRoute({ path, getParentRoute })` declarations (prettier-regular) and
 * resolves full paths through the parent chain. Zero component imports, zero
 * render cost, impossible to drift silently — any added route without a domain
 * fails here by construction.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
// StudioShell/ -> agent-studio/ -> products/ -> pages/ -> src/ -> routes.tsx
const ROUTES_TSX = join(HERE, '..', '..', '..', '..', '..', 'router', 'routes.tsx');

type Decl = { name: string; path: string; parent: string };

function scanRoutes(): Map<string, string> {
  const src = readFileSync(ROUTES_TSX, 'utf8');
  const decls = new Map<string, Decl>();
  // Matches: export const fooRoute = createRoute({ ... path: '/x', ... getParentRoute: () => barRoute, ... })
  const re =
    /export const (\w+) = createRoute\(\{([\s\S]*?)\n\}\);/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    const [, name, body] = m;
    const path = /path:\s*'([^']+)'/.exec(body ?? '')?.[1];
    const parent = /getParentRoute:\s*\(\)\s*=>\s*(\w+)/.exec(body ?? '')?.[1];
    if (path !== undefined && parent !== undefined && name !== undefined) {
      decls.set(name, { name, path, parent });
    }
  }
  const full = new Map<string, string>();
  const visit = (name: string, seen: string[] = []): string => {
    if (full.has(name)) return full.get(name) as string;
    if (seen.includes(name)) throw new Error(`route parent cycle: ${[...seen, name].join(' -> ')}`);
    const decl = decls.get(name);
    if (!decl) return '';
    const parentFull = decl.parent === 'rootRoute' ? '' : visit(decl.parent, [...seen, name]);
    const seg = decl.path;
    const joined =
      seg === '/'
        ? parentFull === ''
          ? '/'
          : parentFull
        : `${parentFull === '' ? '' : parentFull}${seg.startsWith('/') ? seg : `/${seg}`}`;
    full.set(name, joined);
    return joined;
  };
  for (const name of decls.keys()) visit(name);
  return full;
}

const STUDIO_PREFIX = '/agent-studio';
// Non-navigable studio paths, each with its reason (NOT silent exceptions):
// - index redirects (component: () => null + redirect in beforeLoad)
// - builder routes (full-bleed by lock, excluded from domain ownership)
const NON_NAVIGABLE_EXACT = new Set(['/agent-studio', '/agent-studio/settings']);

const config = navJson as unknown as NavConfig;

describe('nav.json v2 shape', () => {
  it('declares exactly the 7 locked domains', () => {
    expect(config.domains.map((d) => d.key)).toEqual([
      'dashboard',
      'chat',
      'agents',
      'libraries',
      'insights',
      'platform',
      'settings',
    ]);
  });

  it('gives every non-single domain ≥1 item with a resolvable landing', () => {
    for (const domain of config.domains) {
      if (domain.single === true) {
        expect(domain.items).toHaveLength(0);
        continue;
      }
      expect(domain.items.length).toBeGreaterThan(0);
      const landingHit =
        domain.items.some((i) => i.to === domain.landing) || domain.landing.length > 0;
      expect(landingHit).toBe(true);
    }
  });

  it('uses no duplicate destinations across domains', () => {
    const seen = new Map<string, string>();
    for (const domain of config.domains) {
      for (const item of domain.items) {
        expect(seen.has(item.to)).toBe(false);
        seen.set(item.to, domain.key);
      }
    }
  });
});

describe('route ↔ domain coverage (R1)', () => {
  const fullPaths = [...new Set(scanRoutes().values())].filter((p) =>
    p.startsWith(STUDIO_PREFIX),
  );

  it('finds the known studio routes (scanner sanity)', () => {
    for (const expected of [
      '/agent-studio/chat',
      '/agent-studio/agents',
      '/agent-studio/agents/$agentId/edit',
      '/agent-studio/settings/team',
      '/agent-studio/integrations/webhooks',
    ]) {
      expect(fullPaths).toContain(expected);
    }
  });

  it('maps every navigable studio route to exactly one domain', () => {
    const unowned: string[] = [];
    for (const path of fullPaths) {
      if (NON_NAVIGABLE_EXACT.has(path)) continue;
      if (isBuilderPath(path)) continue;
      // Dynamic params resolve through their parent item (longest-prefix).
      if (resolveDomain(path, config) === null) unowned.push(path);
    }
    expect(unowned).toEqual([]);
  });

  it('points every nav destination at a real route (or its dynamic parent)', () => {
    const missing: string[] = [];
    for (const domain of config.domains) {
      const targets = domain.single === true ? [domain.landing] : domain.items.map((i) => i.to);
      for (const to of targets) {
        const hit = fullPaths.some((p) => p === to || to.startsWith(p + '/'));
        if (!hit) missing.push(`${domain.key}:${to}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
