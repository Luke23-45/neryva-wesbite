import styled from 'styled-components';
import { Link } from '@tanstack/react-router';

export const ShellRoot = styled.section<{ $collapsed?: boolean; $builder?: boolean }>`
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: ${({ theme }) => theme.app.bg.base};
  display: grid;
  /* A2-01: on builder routes the sidebar is hidden — the content must span
     the full width, not sit in the 264px sidebar column. */
  grid-template-columns: ${({ $collapsed, $builder }) =>
    $builder ? '1fr' : $collapsed ? '76px 1fr' : '264px 1fr'};
  color: ${({ theme }) => theme.app.text.body};
  font-family: ${({ theme }) => theme.typography.fonts.sans};

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: 1fr;
  }

  /* Builder: Figma-style fixed viewport. The page itself never scrolls —
     the palette rail and inspector scroll internally at a fixed height,
     and the canvas holds still. Bounded chain: this root (100dvh, hidden)
     → ShellBody (min-height: 0) → ContentArea (flex: 1, hidden) →
     AgentBuilder Shell/Main (flex: 1, min-height: 0, hidden) → Rail/Panel
     (overflow-y: auto). On tablet the builder falls back to page scroll. */
  ${({ $builder, theme }) =>
    $builder &&
    `
    height: 100vh;
    height: 100dvh;
    overflow: hidden;
    grid-template-rows: minmax(0, 1fr);

    ${theme.media.tablet} {
      height: auto;
      min-height: 100vh;
      overflow: visible;
      grid-template-rows: none;
    }
  `}
`;

/* ─── Sidebar ─── */
export const ShellSidebar = styled.aside<{ $mobileOpen?: boolean; $collapsed?: boolean }>`
  position: sticky;
  top: 0;
  align-self: start;
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 16px 12px 14px;
  ${({ $collapsed }) =>
    $collapsed &&
    `
    width: 76px;
    padding-left: 8px;
    padding-right: 8px;
    nav a {
      justify-content: center;
    }
    .collapse-hide {
      display: none;
    }
  `}
  background: ${({ theme }) => theme.app.bg.raised};
  border-right: 1px solid ${({ theme }) => theme.app.border.default};
  z-index: 50;

  ${({ theme }) => theme.media.tablet} {
    position: fixed;
    inset: 0 auto 0 0;
    width: 280px;
    transform: translateX(${({ $mobileOpen }) => ($mobileOpen ? '0' : '-100%')});
    transition: transform ${({ theme }) => theme.transitions.standard};
    box-shadow: ${({ $mobileOpen, theme }) =>
      $mobileOpen ? theme.app.shadow.drawer : 'none'};
  }
`;

export const MobileOverlay = styled.div`
  display: none;

  ${({ theme }) => theme.media.tablet} {
    display: block;
    position: fixed;
    inset: 0;
    background: ${({ theme }) => theme.app.scrim};
    z-index: 40;
    backdrop-filter: blur(2px);
  }
`;

export const MobileMenuButton = styled.button<{ $variant: 'menu' | 'close' }>`
  display: none;

  ${({ theme }) => theme.media.tablet} {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border: 0;
    background: transparent;
    color: ${({ theme }) => theme.app.text.secondary};
    border-radius: 8px;
    cursor: pointer;
    transition: background ${({ theme }) => theme.transitions.fast},
      color ${({ theme }) => theme.transitions.fast};

    &:hover {
      background: ${({ theme }) => theme.app.surface.active};
      color: ${({ theme }) => theme.app.text.primary};
    }

    &:focus-visible {
      outline: 2px solid ${({ theme }) => theme.app.border.focus};
      outline-offset: 1px;
    }
  }
`;

export const BrandRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px 14px;
`;

export const BrandMark = styled.svg`
  width: 22px;
  height: 22px;
  flex-shrink: 0;
`;

export const BrandWordmark = styled.span.attrs({ className: 'collapse-hide' })`
  font-size: ${({ theme }) => theme.app.type.bodyLg};
  font-weight: 500;
  letter-spacing: -0.01em;
  color: ${({ theme }) => theme.app.text.primary};
  display: inline-flex;
  align-items: baseline;
`;

export const BrandDot = styled.span`
  margin-left: 2px;
  color: ${({ theme }) => theme.colors.accent.emerald};
  font-weight: 600;
`;

export const SidebarSearch = styled.label.attrs({ className: 'collapse-hide' })`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  margin-bottom: 12px;
  background: ${({ theme }) => theme.app.surface.tint};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 8px;
  color: ${({ theme }) => theme.app.text.muted};
  transition: border-color ${({ theme }) => theme.transitions.fast};

  &:focus-within {
    border-color: ${({ theme }) => theme.app.border.focus};
    color: ${({ theme }) => theme.app.text.secondary};
  }
`;

export const SidebarSearchIcon = styled.span`
  display: inline-flex;
`;

export const SidebarSearchInput = styled.input`
  flex: 1;
  border: 0;
  background: transparent;
  outline: none;
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.primary};

  &::placeholder {
    color: ${({ theme }) => theme.app.text.ghost};
  }
`;

export const NavSection = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 6px;
`;

export const NavGroupLabel = styled.div.attrs({ className: 'collapse-hide' })`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.faint};
  padding: 12px 10px 4px;

  &:first-child {
    padding-top: 2px;
  }
`;

/** The nav row IS the link — full click target, real focus state. */
export const NavItemLink = styled(Link)<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  border-radius: 8px;
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  color: ${({ theme, $active }) => ($active ? theme.app.text.primary : theme.app.text.secondary)};
  text-decoration: none;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.app.surface.hover};
    color: ${({ theme }) => theme.app.text.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: -2px;
  }

  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

export const NavItemIcon = styled.span<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  color: ${({ theme, $active }) => ($active ? theme.app.text.inverse : theme.app.text.muted)};
  background: ${({ $active, theme }) => ($active ? theme.colors.semantic.info : 'transparent')};
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};
  flex-shrink: 0;
`;

export const RecentSection = styled.div.attrs({ className: 'collapse-hide' })`
  flex: 1;
  overflow-y: auto;
  padding-bottom: 8px;
  margin-right: -6px;
  padding-right: 6px;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.app.scrollbar};
    border-radius: 4px;
  }
`;

export const RecentLabel = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.faint};
  padding: 6px 10px 4px;
`;

export const RecentItemLink = styled(Link)`
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 7px 10px;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.app.surface.hover};
    color: ${({ theme }) => theme.app.text.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: -2px;
  }
`;

export const RecentItemTitle = styled.span`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const RecentItemDate = styled.span`
  flex-shrink: 0;
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.faint};
`;

export const SidebarFooter = styled.div.attrs({ className: 'collapse-hide' })`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid ${({ theme }) => theme.app.border.default};
`;

export const UserCard = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 8px;
  border-radius: 10px;
`;

export const UserAvatar = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 7px;
  background: #3b82f6;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  font-weight: 600;
  letter-spacing: 0.02em;
`;

export const UserMeta = styled.div`
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  min-width: 0;
  flex: 1;
`;

export const UserName = styled.span`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const UserTier = styled.span`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
`;

export const UpgradeCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  background: ${({ theme }) => theme.app.surface.subtle};
`;

export const UpgradeTitle = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
`;

/* ─── Body ─── */
export const ShellBody = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  /* Builder fixed-viewport chain: the grid item must be allowed to shrink
     below content height, otherwise min-height: auto forces the page tall. */
  min-height: 0;
  background: ${({ theme }) => theme.app.bg.base};
`;

export const Topbar = styled.div<{ $builder?: boolean }>`
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 28px;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.default};
  background: rgba(11, 13, 18, 0.7);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);

  ${({ theme }) => theme.media.mobile} {
    padding: 12px 18px;
  }

  /* Merged builder bar (ledger T13): a single 48px bar instead of the
     shell topbar + a stacked 56px builder row. Non-builder pages keep the
     padding-driven height above. */
  ${({ $builder }) =>
    $builder &&
    `
    height: 48px;
    flex: none;
    padding: 0 16px;
    gap: 12px;
  `}
`;

export const TopbarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
`;

export const TopbarTitle = styled.h1`
  margin: 0;
  font-size: ${({ theme }) => theme.app.type.bodyLg};
  font-weight: 500;
  letter-spacing: -0.01em;
  color: ${({ theme }) => theme.app.text.primary};
  min-width: 0;
  max-width: 40ch;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const TopbarSubtitle = styled.span`
  font-size: ${({ theme }) => theme.app.type.bodyLg};
  color: ${({ theme }) => theme.app.text.muted};
`;

export const TopbarCrumbLink = styled(Link)`
  color: inherit;
  text-decoration: none;

  &:hover {
    color: ${({ theme }) => theme.app.text.primary};
    text-decoration: underline;
  }
`;

export const TopbarSearchHint = styled.button<{ $builder?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: 8px;
  padding: 4px 8px;
  border-radius: 6px;
  background: ${({ theme }) => theme.app.surface.tint};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
  cursor: pointer;
  transition: color ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.app.text.secondary};
    border-color: ${({ theme }) => theme.app.border.strong};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }

  ${({ theme }) => theme.media.mobile} {
    display: none;
  }

  /* Merged builder bar (ledger T13): the hint leaves the bar below 900px
     so the agent identity keeps room. Ctrl+K / Cmd+K still opens the
     palette — the keyboard path is untouched. */
  ${({ $builder }) =>
    $builder &&
    `
    @media (max-width: 900px) {
      display: none;
    }
  `}
`;

export const TopbarKbd = styled.span`
  color: ${({ theme }) => theme.app.text.secondary};
  font-weight: 500;
`;

export const TopbarRight = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const IconAction = styled.a`
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.app.text.muted};
  border-radius: 8px;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.app.text.primary};
    background: ${({ theme }) => theme.app.surface.active};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

export const ContentArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 0;
  /* Builder fixed-viewport chain: clip at the flex bound so the columns
     below (not the page) do the scrolling. Harmless on other pages —
     with unconstrained height nothing clips. */
  overflow: hidden;
`;
/* NOTE (a11y): this is a <div>, not a <main>. The router root
   (src/router/root.tsx) already renders the page's single <main>
   landmark (MainContent) around the outlet — a nested <main> here
   would break landmark navigation for assistive tech. */

export const BannerSlot = styled.div`
  padding: 0 24px;
  margin-top: 18px;

  > * {
    max-width: 100%;
  }
`;

export const RecentEmpty = styled(Link)`
  display: block;
  padding: 6px 12px;
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.ghost};
  text-decoration: none;
  border-radius: 6px;
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.app.text.secondary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

/* ─── Dynamic sidebar levels (SIDEBAR_LEDGER.md §§3-4; additive only) ─── */

/** Builder-mode return link in the topbar (sidebar hidden on builder routes). */
export const TopbarBackLink = styled(Link)`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.secondary};
  text-decoration: none;
  border-radius: 6px;

  &:hover {
    color: ${({ theme }) => theme.app.text.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 2px;
  }
`;

/** Hairline divider between topbar clusters in the merged builder bar
 * (ledger T13). Flat #1E2530 per C1. */
export const TopbarDivider = styled.span`
  width: 1px;
  height: 20px;
  flex: none;
  background: #1e2530;
`;

/** Row label (carries the collapse-hide hook; icons and badges stay visible). */
export const NavItemLabel = styled.span.attrs({ className: 'collapse-hide' })`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/** Collapse toggle in the brand row (persisted per account). */
export const CollapseButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin-left: auto;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: ${({ theme }) => theme.app.text.muted};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.app.surface.hover};
    color: ${({ theme }) => theme.app.text.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: -2px;
  }
`;

/** Slide container for the level 1 ⇄ level 2 swap (framer-motion drives it). */
export const NavLevelSlide = styled.div`
  overflow: hidden;
`;

/** Back row: a chrome action (returns to level 1 on the SAME route), never a destination. */
export const NavBackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 7px 10px;
  margin-bottom: 2px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.secondary};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.app.surface.hover};
    color: ${({ theme }) => theme.app.text.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: -2px;
  }
`;

/**
 * Badge pill for nav rows. Dot + optional count, never color alone (the count
 * text or the row label always names the state). Null-safe: parents render
 * nothing until values resolve.
 */
export const NavBadge = styled.span<{ $tone: 'attention' | 'info' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  margin-left: auto;
  padding: 0 6px;
  border-radius: 999px;
  font-size: ${({ theme }) => theme.app.type.micro};
  font-weight: 600;
  flex-shrink: 0;
  color: ${({ theme, $tone }) =>
    $tone === 'attention' ? theme.app.status.warning.fg : theme.app.status.info.fg};
  background: ${({ theme, $tone }) =>
    $tone === 'attention' ? theme.app.status.warning.bg : theme.app.status.info.bg};
  border: 1px solid
    ${({ theme, $tone }) =>
      $tone === 'attention' ? theme.app.status.warning.border : theme.app.status.info.border};

  &:empty {
    min-width: 8px;
    width: 8px;
    height: 8px;
    padding: 0;
    border-radius: 999px;
  }
`;
