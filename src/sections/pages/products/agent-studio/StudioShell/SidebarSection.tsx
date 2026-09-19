import { type RefObject } from 'react';
import { deniedCopy, isDenied, type NavDomain, type NavItem } from './nav-config';
import type { NavBadgeMap } from './useNavBadges';
import {
  NavBackButton,
  NavBadge,
  NavGroupLabel,
  NavItemIcon,
  NavItemLabel,
  NavItemLink,
} from './StudioShell.styles';
import { studioIcon } from './studioIcons';

type Props = {
  domain: NavDomain;
  /** Owning item for the current route (null = domain landing, no leaf). */
  activeTo: string | null;
  badges: NavBadgeMap;
  /** Sidebar filter text; scopes to this domain's items. */
  query: string;
  /** Org role (null while loading → rows fail open; the server enforces). */
  role: string | null;
  onNavigate: () => void;
  onBack: () => void;
  backRef: RefObject<HTMLButtonElement | null>;
};

/**
 * Level 2 of the single sidebar (SIDEBAR_LEDGER.md §§3-4): one domain's items.
 * The back row is a chrome action (returns to level 1 on the SAME route —
 * never a destination, never a Link, so it needs no dirty-guard path).
 */
export function SidebarSection({ domain, activeTo, badges, query, role, onNavigate, onBack, backRef }: Props) {
  const q = query.trim().toLowerCase();
  const items = domain.items.filter((item) => item.label.toLowerCase().includes(q));

  const renderRow = (item: NavItem) => {
    const Icon = studioIcon(item.icon);
    const active = activeTo !== null && item.to === activeTo;
    const badge = badges[item.to] ?? null;
    const denied = isDenied(item.roles, role);
    return (
      <NavItemLink
        key={item.to}
        to={item.to}
        $active={active}
        aria-current={active ? 'page' : undefined}
        aria-disabled={denied || undefined}
        title={denied ? deniedCopy(item.roles ?? []) : undefined}
        onClick={denied ? (e) => e.preventDefault() : onNavigate}
      >
        <NavItemIcon $active={active}>
          <Icon size={15} strokeWidth={1.6} />
        </NavItemIcon>
        <NavItemLabel>{item.label}</NavItemLabel>
        {badge !== null && (
          <NavBadge $tone={badge.kind === 'attention' ? 'attention' : 'info'}>
            {typeof badge.count === 'number' ? badge.count : ''}
          </NavBadge>
        )}
      </NavItemLink>
    );
  };

  return (
    <div>
      <NavBackButton ref={backRef} type="button" onClick={onBack} aria-label="Back to all sections">
        <span aria-hidden="true">‹</span> All sections
      </NavBackButton>
      <NavGroupLabel>{domain.label}</NavGroupLabel>
      {items.map(renderRow)}
      {items.length === 0 && q.length > 0 && (
        <NavGroupLabel>No matches for “{query.trim()}”</NavGroupLabel>
      )}
    </div>
  );
}
