import styled from 'styled-components';
import { Link } from '@tanstack/react-router';

export const ShellRoot = styled.section`
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: ${({ theme }) => theme.app.bg.base};
  display: grid;
  grid-template-columns: 264px 1fr;
  color: ${({ theme }) => theme.app.text.body};
  font-family: ${({ theme }) => theme.typography.fonts.sans};

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: 1fr;
  }
`;

/* ─── Sidebar ─── */
export const ShellSidebar = styled.aside<{ $mobileOpen?: boolean }>`
  position: sticky;
  top: 0;
  align-self: start;
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 16px 12px 14px;
  background: linear-gradient(
    180deg,
    ${({ theme }) => theme.app.bg.raised} 0%,
    ${({ theme }) => theme.app.bg.deep} 100%
  );
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

export const BrandWordmark = styled.span`
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

export const SidebarSearch = styled.label`
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

export const NavGroupLabel = styled.div`
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
  background: ${({ $active, theme }) => ($active ? theme.colors.gradients.primary : 'transparent')};
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};
  flex-shrink: 0;
`;

export const RecentSection = styled.div`
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
  display: block;
  padding: 7px 10px;
  border-radius: 7px;
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

export const SidebarFooter = styled.div`
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
  background: ${({ theme }) => theme.colors.gradients.primary};
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
  background:
    linear-gradient(180deg, rgba(192, 132, 252, 0.10), rgba(37, 99, 235, 0.06)),
    ${({ theme }) => theme.app.surface.subtle};
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
  background:
    radial-gradient(1200px 600px at 50% -10%, rgba(124, 92, 255, 0.10), transparent 60%),
    radial-gradient(900px 500px at 90% 10%, rgba(37, 99, 235, 0.08), transparent 60%),
    linear-gradient(
      180deg,
      ${({ theme }) => theme.app.bg.base} 0%,
      ${({ theme }) => theme.app.bg.deep} 100%
    );
`;

export const Topbar = styled.div`
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
`;

export const TopbarSubtitle = styled.span`
  font-size: ${({ theme }) => theme.app.type.bodyLg};
  color: ${({ theme }) => theme.app.text.muted};
`;

export const TopbarSearchHint = styled.button`
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

export const ContentArea = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 0;
`;
