import styled from 'styled-components';

/* ================================================================
   HEADER — Neryva Research System
   Clean, structured, research-lab aesthetic.
   Inspired by Mistral's discipline + Cohere's refinement.
   ================================================================ */

export const StyledHeader = styled.header`
  position: sticky;
  top: 0;
  z-index: ${({ theme }) => theme.zIndices.header};
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 ${({ theme }) => theme.spacing.s6};
  background-color: rgba(247, 245, 239, 0.88);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid ${({ theme }) => theme.colors.line};

  ${({ theme }) => theme.media.mobile} {
    height: 56px;
    padding: 0 ${({ theme }) => theme.spacing.s5};
  }
`;

/* --- LAYOUT SECTIONS --- */
export const HeaderLeft = styled.div`
  display: flex;
  flex: 1;
  justify-content: flex-start;
  align-items: center;
`;

export const HeaderCenter = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;

  ${({ theme }) => theme.media.mobile} {
    display: none;
  }
`;

export const HeaderRight = styled.div`
  display: flex;
  flex: 1;
  justify-content: flex-end;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s3};
`;

/* --- BRANDING --- */
export const LogoLink = styled.a`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s3};
  text-decoration: none;
  color: ${({ theme }) => theme.colors.ink};
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  font-size: ${({ theme }) => theme.typography.sizes.body};
  letter-spacing: -0.01em;
  transition: opacity ${({ theme }) => theme.transitions.fast};

  &:hover {
    opacity: 0.7;
  }
`;

export const LogoImage = styled.img`
  height: 22px;
  width: auto;
  display: block;

  ${({ theme }) => theme.media.mobile} {
    height: 20px;
  }
`;

/* --- DESKTOP NAV --- */
export const DesktopNav = styled.nav`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s1};
`;

export const NavLink = styled.a<{ $isActive?: boolean }>`
  position: relative;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 13px;
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme, $isActive }) => ($isActive ? theme.colors.ink : theme.colors.muted)};
  text-decoration: none;
  padding: 6px 12px;
  border-radius: 6px;
  transition: color ${({ theme }) => theme.transitions.fast},
              background-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.ink};
    background-color: rgba(0, 0, 0, 0.04);
  }

  &::after {
    content: '';
    position: absolute;
    bottom: 2px;
    left: 12px;
    right: 12px;
    height: 1.5px;
    background-color: ${({ theme, $isActive }) => ($isActive ? theme.colors.ink : 'transparent')};
    border-radius: 1px;
    transition: background-color ${({ theme }) => theme.transitions.fast};
  }
`;

/* --- CTA BUTTONS --- */
export const DesktopActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s2};

  ${({ theme }) => theme.media.mobile} {
    display: none;
  }
`;

export const ButtonSecondary = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 ${({ theme }) => theme.spacing.s4};
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 13px;
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.ink};
  text-decoration: none;
  background-color: transparent;
  border: 1px solid ${({ theme }) => theme.colors.line};
  border-radius: 6px;
  transition: border-color ${({ theme }) => theme.transitions.fast},
              background-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.lineStrong};
    background-color: rgba(0, 0, 0, 0.03);
  }
`;

export const ButtonPrimary = styled(ButtonSecondary)`
  color: ${({ theme }) => theme.colors.paper};
  background-color: ${({ theme }) => theme.colors.blue};
  border-color: ${({ theme }) => theme.colors.blue};

  &:hover {
    background-color: ${({ theme }) => theme.colors.blueHover};
    border-color: ${({ theme }) => theme.colors.blueHover};
  }
`;

/* --- MOBILE TOGGLE --- */
export const MobileMenuButton = styled.button`
  display: none;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: ${({ theme }) => theme.colors.ink};
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.line};
  border-radius: 6px;
  cursor: pointer;
  transition: background-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }

  ${({ theme }) => theme.media.mobile} {
    display: flex;
  }
`;

/* --- MOBILE DRAWER --- */
export const MobileNavOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: ${({ theme }) => theme.zIndices.mobileNav};
  display: flex;
  flex-direction: column;
  background-color: ${({ theme }) => theme.colors.paper};
  padding: ${({ theme }) => theme.spacing.s6};
  opacity: ${({ $isOpen }) => ($isOpen ? 1 : 0)};
  pointer-events: ${({ $isOpen }) => ($isOpen ? 'auto' : 'none')};
  transform: translateY(${({ $isOpen }) => ($isOpen ? '0' : '-8px')});
  transition: opacity 240ms cubic-bezier(0.2, 0, 0, 1),
              transform 240ms cubic-bezier(0.2, 0, 0, 1);
`;

export const MobileNavHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.s8};
`;

export const MobileNavLink = styled.a<{ $isActive?: boolean }>`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.typography.sizes.h3};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme, $isActive }) => ($isActive ? theme.colors.ink : theme.colors.muted)};
  text-decoration: none;
  padding: ${({ theme }) => theme.spacing.s3} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.line};
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.ink};
  }
`;

/* --- MOBILE ACTIONS --- */
export const MobileActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s4};
  margin-top: auto;
  padding-top: ${({ theme }) => theme.spacing.s6};
  border-top: 1px solid ${({ theme }) => theme.colors.line};

  & > * {
    width: 100%;
    height: 44px;
  }
`;

/* --- DROPDOWN (Programs) --- */

export const NavItemWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

export const DropdownPanel = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
  width: 260px;
  background: ${({ theme }) => theme.colors.paper};
  border: 1px solid ${({ theme }) => theme.colors.line};
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04);
  opacity: ${({ $isOpen }) => ($isOpen ? 1 : 0)};
  pointer-events: ${({ $isOpen }) => ($isOpen ? 'auto' : 'none')};
  transform: translateX(-50%) translateY(${({ $isOpen }) => ($isOpen ? '0' : '-6px')});
  transition: opacity 200ms ease, transform 200ms ease;
  z-index: 100;
`;

export const DropdownItem = styled.a`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  text-decoration: none;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 13px;
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.inkSoft};
  transition: background-color 160ms ease, color 160ms ease;

  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
    color: ${({ theme }) => theme.colors.ink};
  }
`;

export const AccentDot = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${({ $color }) => $color};
  flex-shrink: 0;
`;

/* --- MEGA MENU (Resources) --- */
export const MegaMenuPanel = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
  width: 320px;
  background: ${({ theme }) => theme.colors.paper};
  border: 1px solid ${({ theme }) => theme.colors.line};
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04);
  opacity: ${({ $isOpen }) => ($isOpen ? 1 : 0)};
  pointer-events: ${({ $isOpen }) => ($isOpen ? 'auto' : 'none')};
  transform: translateX(-50%) translateY(${({ $isOpen }) => ($isOpen ? '0' : '-6px')});
  transition: opacity 200ms ease, transform 200ms ease;
  z-index: 100;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
`;

export const MegaMenuColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const MegaMenuTitle = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.muted};
  margin-bottom: 8px;
`;

export const MegaMenuLink = styled.a`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 13px;
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.inkSoft};
  text-decoration: none;
  transition: color 160ms ease;

  &:hover {
    color: ${({ theme }) => theme.colors.ink};
  }
`;

/* --- MOBILE SUB-ITEMS --- */
export const MobileSubLink = styled.a`
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.typography.sizes.body};
  font-weight: ${({ theme }) => theme.typography.weights.regular};
  color: ${({ theme }) => theme.colors.muted};
  text-decoration: none;
  padding: ${({ theme }) => theme.spacing.s2} 0 ${({ theme }) => theme.spacing.s2} 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.line};
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.ink};
  }
`;