/**
 * Sidebar navigation config model + pure resolvers (SIDEBAR_LEDGER.md §§2-4).
 *
 * One registry feeds the rail-equivalent (level 1), the section sidebar (level 2),
 * breadcrumbs, and the ⌘K Navigate section. Nothing here touches JSX or the router:
 * every function is unit-testable against strings.
 *
 * Matching law: longest-prefix wins with boundary safety
 * (`pathname === base || pathname.startsWith(base + '/')`), so `/agents` never
 * matches `/agents-archive` and `/agents/123/edit` resolves to its parent item.
 * Query strings and hashes are stripped before matching.
 */

export type DomainKey =
  | 'dashboard'
  | 'chat'
  | 'agents'
  | 'libraries'
  | 'insights'
  | 'platform'
  | 'settings';

export type BadgeKind = 'count' | 'attention';

export interface NavItem {
  label: string;
  /** Absolute studio path. Must equal a route in routes.tsx (enforced by nav-coverage.test.ts). */
  to: string;
  /** Icon key into the shell iconMap. */
  icon: string;
  /** Prefix override. Default: longest-prefix of `to`. */
  match?: string;
  /** Badge KIND only — values come from useNavBadges, never this config. */
  badge?: BadgeKind;
  /** Absent = all roles. P4 fills these + the role-map consistency test. */
  roles?: string[];
}

export interface NavDomain {
  key: DomainKey;
  label: string;
  subtitle: string;
  icon: string;
  /** Domain click target (R6: first secondary item; single-surface domains land on themselves). */
  landing: string;
  /**
   * Single-surface domains (dashboard, chat) carry zero items and land on
   * themselves. Every other domain must ship ≥1 item (R1 test enforces).
   */
  single?: boolean;
  items: NavItem[];
}

export interface NavConfig {
  domains: NavDomain[];
}

export interface ResolvedNav {
  domain: NavDomain;
  item: NavItem | null;
}

/**
 * Full-bleed builder paths (sidebar hidden entirely). Exact by construction:
 * - `/agents/new` (static builder origin — declared in routes.tsx)
 * - `/agents/<anything>/edit` (dynamic agent id + static `edit` tail)
 * - `/agents/<anything>/build` (dynamic agent id + static `build` tail)
 *
 * Deliberately NOT a prefix of `/agents/`: the list (`/agents`), the overview
 * (`/agents/overview`), and the detail (`/agents/<id>`) all keep the sidebar.
 * A naive `/agents/` prefix would swallow them — this helper exists so that
 * mistake cannot be reintroduced.
 */
export function isBuilderPath(pathname: string): boolean {
  const path = stripSuffix(pathname);
  if (path === '/agent-studio/agents/new') return true;
  const segs = path.split('/').filter((s) => s.length > 0);
  // ['agent-studio','agents','<id>','edit'|'build']
  return (
    segs.length === 4 &&
    segs[0] === 'agent-studio' &&
    segs[1] === 'agents' &&
    (segs[3] === 'edit' || segs[3] === 'build')
  );
}

function stripSuffix(pathname: string): string {
  const cut = pathname.split(/[?#]/, 1)[0] ?? '';
  if (cut.length > 1 && cut.endsWith('/')) return cut.slice(0, -1);
  return cut;
}

function prefixOf(pathname: string, base: string): boolean {
  if (base.length === 0) return false;
  return pathname === base || pathname.startsWith(base + '/');
}

/**
 * Longest-prefix domain resolution. Returns null when nothing owns the path
 * (callers fall back to an explicit, visible fallback — never a silent guess).
 */
export function resolveDomain(pathname: string, config: NavConfig): NavDomain | null {
  const path = stripSuffix(pathname);
  let best: NavDomain | null = null;
  let bestLen = -1;
  for (const domain of config.domains) {
    for (const item of domain.items) {
      const base = stripSuffix(item.match ?? item.to);
      if (prefixOf(path, base) && base.length > bestLen) {
        best = domain;
        bestLen = base.length;
      }
    }
    // Single-surface domains own exactly their landing path.
    if (domain.single === true && prefixOf(path, stripSuffix(domain.landing)) && domain.landing.length > bestLen) {
      best = domain;
      bestLen = domain.landing.length;
    }
  }
  return best;
}

/** Longest-prefix item within an already-resolved domain (null = domain home, no leaf). */
export function resolveItem(pathname: string, domain: NavDomain): NavItem | null {
  const path = stripSuffix(pathname);
  let best: NavItem | null = null;
  let bestLen = -1;
  for (const item of domain.items) {
    const base = stripSuffix(item.match ?? item.to);
    if (prefixOf(path, base) && base.length > bestLen) {
      best = item;
      bestLen = base.length;
    }
  }
  return best;
}

export type NavLevel =
  | { kind: 'builder' }
  | { kind: 'section'; level: 1 | 2; domain: NavDomain; item: NavItem | null };

/**
 * Role gating for nav rows (P4): `roles` absent = every role may enter (reads
 * are broadly open server-side); present = only those roles. `null` role
 * (still loading) fails OPEN — the server enforces regardless, and a flicker
 * of denied states on every load is worse than a paint that resolves.
 */
export function isDenied(itemRoles: string[] | undefined, role: string | null): boolean {
  if (!itemRoles || itemRoles.length === 0) return false;
  if (role === null) return false;
  return !itemRoles.includes(role);
}

export function deniedCopy(itemRoles: string[]): string {
  const set = new Set(itemRoles);
  if (set.size === 2 && set.has('owner') && set.has('admin')) {
    return 'Owners and admins only — ask one for access.';
  }
  return `Requires ${itemRoles.join(' or ')} — ask for access.`;
}

/**
 * Level derivation (ledger §4). Builder prefixes win over everything; single-surface
 * domains and domain landings render level 1; everything else owned renders level 2
 * with a back row. Unowned paths return level 1 with a null domain so the shell can
 * render its explicit fallback instead of guessing.
 */
export function resolveLevel(pathname: string, config: NavConfig): NavLevel {
  const path = stripSuffix(pathname);
  if (isBuilderPath(path)) return { kind: 'builder' };
  const domain = resolveDomain(path, config);
  if (domain === null) return { kind: 'section', level: 1, domain: config.domains[0], item: null };
  if (domain.single === true) return { kind: 'section', level: 1, domain, item: null };
  return { kind: 'section', level: 2, domain, item: resolveItem(path, domain) };
}
