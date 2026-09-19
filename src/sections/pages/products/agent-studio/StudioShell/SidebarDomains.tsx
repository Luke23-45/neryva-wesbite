import { deniedCopy, isDenied, type DomainKey, type NavConfig } from './nav-config';
import { aggregateDomainBadge, type NavBadgeMap } from './useNavBadges';
import { NavBadge, NavGroupLabel, NavItemIcon, NavItemLabel, NavItemLink } from './StudioShell.styles';
import { studioIcon } from './studioIcons';

type Props = {
  config: NavConfig;
  /** Currently owning domain (null = explicit fallback state). */
  activeKey: DomainKey | null;
  badges: NavBadgeMap;
  /** Sidebar filter text; matches domains AND items across domains (jump-to). */
  query: string;
  /** Org role (null while loading → rows fail open; the server enforces). */
  role: string | null;
  onNavigate: () => void;
};

/**
 * Level 1 of the single sidebar (SIDEBAR_LEDGER.md §§3-4): the 7 domains.
 * Dashboard/Chat navigate directly; the other five drill (their rows navigate
 * to the domain landing AND the shell swaps to level 2 in the same action —
 * both are plain Links, so the dirty guard intercepts all of them).
 */
export function SidebarDomains({ config, activeKey, badges, query, role, onNavigate }: Props) {
  const q = query.trim().toLowerCase();
  const domains = config.domains.filter((d) => d.label.toLowerCase().includes(q));
  const jumps =
    q.length === 0
      ? []
      : config.domains
          .flatMap((d) => d.items.map((item) => ({ domain: d, item })))
          .filter(({ item }) => item.label.toLowerCase().includes(q))
          .slice(0, 6);

  return (
    <div>
      <NavGroupLabel>Sections</NavGroupLabel>
      {domains.map((domain) => {
        const Icon = studioIcon(domain.icon);
        const active = activeKey === domain.key;
        const badge = aggregateDomainBadge(
          domain.items.map((i) => i.to),
          badges,
        );
        return (
          <NavItemLink
            key={domain.key}
            to={domain.landing}
            $active={active}
            aria-current={active ? 'page' : undefined}
            onClick={onNavigate}
          >
            <NavItemIcon $active={active}>
              <Icon size={15} strokeWidth={1.6} />
            </NavItemIcon>
            <NavItemLabel>{domain.label}</NavItemLabel>
            {badge !== null && (
              <NavBadge $tone={badge.kind === 'attention' ? 'attention' : 'info'}>
                {typeof badge.count === 'number' ? badge.count : ''}
              </NavBadge>
            )}
          </NavItemLink>
        );
      })}
      {q.length > 0 && domains.length === 0 && jumps.length === 0 && (
        <NavGroupLabel>No matches for “{query.trim()}”</NavGroupLabel>
      )}
      {jumps.length > 0 && (
        <>
          <NavGroupLabel>Jump to</NavGroupLabel>
          {jumps.map(({ domain, item }) => {
            const Icon = studioIcon(item.icon);
            const denied = isDenied(item.roles, role);
            return (
              <NavItemLink
                key={item.to}
                to={item.to}
                $active={false}
                aria-disabled={denied || undefined}
                title={denied ? deniedCopy(item.roles ?? []) : undefined}
                onClick={denied ? (e) => e.preventDefault() : onNavigate}
              >
                <NavItemIcon $active={false}>
                  <Icon size={15} strokeWidth={1.6} />
                </NavItemIcon>
                <NavItemLabel>
                  {item.label} · {domain.label}
                </NavItemLabel>
              </NavItemLink>
            );
          })}
        </>
      )}
    </div>
  );
}


