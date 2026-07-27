import styled from 'styled-components';

/* ================================================================
   HEADER — Neryva Research System
   Scroll-aware, brand-aligned, accessible navigation.
   Every token references the design system — no legacy aliases.
   ================================================================ */

// ─── MAIN HEADER SHELL ─────────────────────────────────────────
// Full-bleed sticky container. Background spans entire viewport.
// Content is constrained by HeaderInner below.
export const StyledHeader = styled.header<{ $scrolled?: boolean; $isDark?: boolean }>`
  position: sticky;
  top: 0;
  z-index: ${({ theme }) => theme.zIndices.header};
  width: 100%;

  background: ${({ $scrolled, $isDark }) => {
    if ($isDark) return $scrolled ? 'rgba(6, 16, 30, 0.92)' : 'rgba(6, 16, 30, 1)';
    return $scrolled ? 'rgba(255, 255, 255, 0.92)' : 'rgba(255, 255, 255, 0.72)';
  }};
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);

  box-shadow: ${({ $scrolled, $isDark }) => {
    if (!$scrolled) return 'none';
    return $isDark ? '0 1px 0 rgba(255, 255, 255, 0.06)' : '0 1px 0 rgba(0, 0, 0, 0.06)';
  }};

  transition: background 320ms cubic-bezier(0.2, 0, 0, 1),
              box-shadow 320ms cubic-bezier(0.2, 0, 0, 1);
  will-change: background, box-shadow;
`;

// ─── CONTENT WRAPPER ───────────────────────────────────────────
// Constrains header content to max-width while keeping background full-bleed.
// Same pattern as Apple, Stripe, Vercel navbars.
export const HeaderInner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 72px;
  max-width: ${({ theme }) => theme.containers.wide};
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing.s5};

  ${({ theme }) => theme.media.mobile} {
    height: 60px;
    padding: 0 ${({ theme }) => theme.spacing.s4};
  }
`;

// ─── LAYOUT SECTIONS ───────────────────────────────────────────
// flex: 1 on left/right keeps the center nav truly centered at any width.
export const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
`;

export const HeaderCenter = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 0 1 auto;

  ${({ theme }) => theme.media.mobile} {
    display: none;
  }
`;

export const HeaderRight = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  flex: 1;
  min-width: 0;
  gap: ${({ theme }) => theme.spacing.s3};
`;

// ─── BRANDING ──────────────────────────────────────────────────
// Brand name uses mono font to distinguish it from nav links and
// signal technical identity. Heavier weight + tighter tracking
// creates the "premium stamp" effect used by Linear, Vercel, Stripe.
export const LogoLink = styled.a<{ $isDark?: boolean }>`
  display: flex;
  align-items: center;
  gap: 14px;
  text-decoration: none;
  color: ${({ theme, $isDark }) => $isDark ? 'rgba(255,255,255,0.92)' : theme.colors.text.primary};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-weight: 700;
  font-size: 19px;
  letter-spacing: -0.04em;
  transition: opacity ${({ theme }) => theme.transitions.fast};

  &:hover {
    opacity: 0.8;
  }

  ${({ theme }) => theme.media.mobile} {
    font-size: 17px;
  }
`;

export const LogoImage = styled.svg`
  height: 32px;
  width: auto;
  display: block;
`;

// ─── DESKTOP NAV ───────────────────────────────────────────────
export const DesktopNav = styled.nav`
  display: flex;
  align-items: center;
  gap: 2px;
`;

export const NavLink = styled.a<{ $isActive?: boolean; $isDark?: boolean }>`
  position: relative;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 16px;
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme, $isDark }) => $isDark ? 'rgba(255,255,255,0.82)' : theme.colors.text.strong};
  text-decoration: none;
  padding: 10px 14px;
  border-radius: 999px;
  letter-spacing: -0.02em;
  transition: color 180ms ease;

  &::after {
    content: '';
    position: absolute;
    bottom: 4px;
    left: 14px;
    right: 14px;
    height: 2px;
    background: linear-gradient(
      90deg,
      ${({ theme }) => theme.colors.accent.lilac},
      ${({ theme }) => theme.colors.accent.emerald},
      ${({ theme }) => theme.colors.accent.azure},
      ${({ theme }) => theme.colors.accent.amethyst}
    );
    border-radius: 1px;
    opacity: ${({ $isActive }) => ($isActive ? 1 : 0)};
    transform: scaleX(${({ $isActive }) => ($isActive ? 1 : 0)});
    transition: opacity 300ms cubic-bezier(0.16, 1, 0.3, 1),
                transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
  }

  &:hover::after {
    opacity: 1;
    transform: scaleX(1);
  }

  ${({ theme }) => theme.media.mobile} {
    font-size: 14px;
  }
`;

// ─── CTA BUTTONS ───────────────────────────────────────────────
export const DesktopActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s2};

  ${({ theme }) => theme.media.mobile} {
    display: none;
  }
`;

export const ButtonGhost = styled.a<{ $isDark?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  padding: 0 14px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 16px;
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  letter-spacing: -0.02em;
  color: ${({ theme, $isDark }) => $isDark ? 'rgba(255, 255, 255, 0.85)' : theme.colors.text.secondary};
  text-decoration: none;
  border-radius: 999px;
  transition: color 180ms ease, background-color 180ms ease;

  &:hover {
    color: ${({ theme, $isDark }) => $isDark ? '#FFF' : theme.colors.text.strong};
    background-color: ${({ $isDark }) => $isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'};
  }

  ${({ theme }) => theme.media.mobile} {
    font-size: 14px;
  }
`;

export const ButtonSecondary = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 42px;
  padding: 0 18px 0 20px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.015em;
  color: ${({ theme }) => theme.colors.text.primary};
  text-decoration: none;
  background-color: transparent;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 999px;
  transition: border-color 180ms ease, background-color 180ms ease,
              transform 140ms ease, box-shadow 180ms ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.text.muted};
    background-color: ${({ theme }) => theme.colors.overlay.light};
    box-shadow: 0 8px 18px -14px rgba(15, 23, 42, 0.24);
  }

  &:active {
    transform: translateY(1px);
  }

  ${({ theme }) => theme.media.mobile} {
    font-size: 12px;
  }
`;

export const ButtonPrimary = styled.a<{ $isDark?: boolean }>`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 42px;
  padding: 0 20px 0 24px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 14.5px;
  font-weight: 600;
  letter-spacing: -0.01em;
  text-decoration: none;
  
  /* Premium Aesthetics */
  color: ${({ theme, $isDark }) => $isDark ? theme.colors.text.strong : theme.colors.text.inverse};
  background: ${({ theme, $isDark }) => $isDark ? '#FFFFFF' : theme.colors.text.strong};
  border-radius: 999px;
  border: 1px solid ${({ $isDark }) => $isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)'};
  box-shadow:
    0 4px 14px 0 ${({ $isDark }) => $isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)'},
    inset 0 1px 1px 0 ${({ $isDark }) => $isDark ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.15)'};
  
  transition: transform 180ms ease, box-shadow 180ms ease;
  overflow: hidden;

  /* Hover effect with a sleek shadow / subtle lift */
  &:hover {
    color: ${({ theme, $isDark }) => $isDark ? theme.colors.text.strong : theme.colors.text.inverse};
    transform: translateY(-1px);
    box-shadow: 
      0 6px 20px 0 ${({ $isDark }) => $isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.2)'},
      inset 0 1px 1px 0 ${({ $isDark }) => $isDark ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.25)'};
  }

  &:active {
    transform: scale(0.98);
    box-shadow: 0 2px 8px 0 ${({ $isDark }) => $isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
  }

  ${({ theme }) => theme.media.mobile} {
    font-size: 12.5px;
  }
`;

export const ButtonIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;

  svg {
    width: 16px;
    height: 16px;
  }
`;

// ─── MOBILE TOGGLE ─────────────────────────────────────────────
export const MobileMenuButton = styled.button<{ $isDark?: boolean }>`
  display: none;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: ${({ theme, $isDark }) => $isDark ? 'rgba(255,255,255,0.82)' : theme.colors.text.primary};
  background: transparent;
  border: 1px solid ${({ theme, $isDark }) => $isDark ? 'rgba(255,255,255,0.18)' : theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;
  transition: background-color 180ms ease;

  &:hover {
    background-color: ${({ $isDark }) => $isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'};
  }

  ${({ theme }) => theme.media.mobile} {
    display: flex;
  }
`;

// ─── MOBILE DRAWER ─────────────────────────────────────────────
export const MobileNavOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: ${({ theme }) => theme.zIndices.mobileNav};
  display: flex;
  flex-direction: column;
  background-color: ${({ theme }) => theme.colors.background.primary};
  padding: ${({ theme }) => theme.spacing.s5};
  opacity: ${({ $isOpen }) => ($isOpen ? 1 : 0)};
  pointer-events: ${({ $isOpen }) => ($isOpen ? 'auto' : 'none')};
  transform: translateY(${({ $isOpen }) => ($isOpen ? '0' : '-8px')});
  transition: opacity 240ms cubic-bezier(0.16, 1, 0.3, 1),
              transform 240ms cubic-bezier(0.16, 1, 0.3, 1);
`;

export const MobileNavHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.s6};
`;

export const MobileNavScroll = styled.div`
  flex: 1;
  overflow-y: auto;
  margin-bottom: ${({ theme }) => theme.spacing.s4};
  padding-right: 4px;
`;

export const MobileNavGroup = styled.div`
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing.s4} 0;

  &:last-child {
    border-bottom: none;
  }
`;

export const MobileNavLink = styled.a<{ $isActive?: boolean }>`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 18px;
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.text.strong};
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: space-between;

  ${({ theme }) => theme.media.mobile} {
    font-size: 16px;
  }
`;

export const MobileSubLinkContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-top: ${({ theme }) => theme.spacing.s3};
  padding-left: 14px;
  border-left: 1.5px solid ${({ theme }) => theme.colors.border};
`;

export const MobileSubLink = styled.a<{ $indented?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 15px;
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.text.primary};
  text-decoration: none;
  padding: 9px 0;
  padding-left: ${({ $indented }) => ($indented ? '12px' : '0')};
  transition: color 180ms ease, background-color 180ms ease;

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
    background-color: ${({ theme }) => theme.colors.overlay.light};
  }

  ${({ theme }) => theme.media.mobile} {
    font-size: 13px;
  }
`;

export const MobileSectionTitle = styled.span`
  display: block;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: ${({ theme }) => theme.colors.text.muted};
  margin: 12px 0 6px 0;
  opacity: 0.7;

  ${({ theme }) => theme.media.mobile} {
    font-size: 10px;
  }
`;

// ─── MOBILE ACTIONS ────────────────────────────────────────────
export const MobileActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s3};
  padding-top: ${({ theme }) => theme.spacing.s5};
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  & > * {
    width: 100%;
    height: 44px;
  }
`;

// ─── DESKTOP DROPDOWNS & PANELS ────────────────────────────────
export const NavItemWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

export const DropdownPanel = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 12px);
  left: 0;
  width: max-content;
  min-width: 232px;
  max-width: 296px;
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0;
  padding: 0;
  box-shadow: 0 18px 40px -24px rgba(15, 23, 42, 0.18);
  overflow: hidden;
  opacity: ${({ $isOpen }) => ($isOpen ? 1 : 0)};
  pointer-events: ${({ $isOpen }) => ($isOpen ? 'auto' : 'none')};
  transform: translateY(${({ $isOpen }) => ($isOpen ? '0' : '-10px')});
  transition: opacity 220ms cubic-bezier(0.16, 1, 0.3, 1),
              transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 100;

  &::before {
    content: '';
    position: absolute;
    top: -14px;
    left: 0;
    right: 0;
    height: 14px;
    background: transparent;
  }
`;

export const DropdownItem = styled.a`
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) 20px;
  align-items: center;
  column-gap: 14px;
  min-height: 62px;
  padding: 0 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  text-decoration: none;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 16px;
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  letter-spacing: -0.02em;
  color: ${({ theme }) => theme.colors.text.primary};
  transition: background-color 140ms ease, color 140ms ease;

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
    background-color: ${({ theme }) => theme.colors.overlay.light};
  }

  &:last-child {
    border-bottom: none;
  }

  ${({ theme }) => theme.media.mobile} {
    font-size: 14px;
  }
`;

export const DropdownArrow = styled.span`
  margin-left: auto;
  color: ${({ theme }) => theme.colors.text.strong};
  opacity: 1;
  transform: translateX(0);
`;

export const AccentDot = styled.span<{ $color: string }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${({ $color }) => $color};
  flex-shrink: 0;
`;

export const MenuGlyph = styled.span`
  display: inline-flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 28px;
    height: 28px;
  }
`;

// ─── MEGA MENU ─────────────────────────────────────────────────
export const MegaMenuPanel = styled(DropdownPanel)`
  width: max-content;
  min-width: 0;
  max-width: none;
  padding: 0;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: max-content;
`;

export const MegaMenuColumn = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 236px;
  border-right: 1px solid ${({ theme }) => theme.colors.borderLight};

  &:last-child {
    border-right: none;
  }
`;

export const MegaMenuTitle = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text.muted};
  padding: 18px 18px 15px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};

  ${({ theme }) => theme.media.mobile} {
    font-size: 10px;
  }
`;

export const MegaMenuLink = styled.a`
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) 20px;
  align-items: center;
  column-gap: 12px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  min-height: 68px;
  padding: 0 16px;
  font-size: 16px;
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  letter-spacing: -0.02em;
  color: ${({ theme }) => theme.colors.text.primary};
  text-decoration: none;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  transition: background-color 180ms ease, color 180ms ease;

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
    background-color: ${({ theme }) => theme.colors.overlay.light};
  }

  &:last-child {
    border-bottom: none;
  }

  ${({ theme }) => theme.media.mobile} {
    font-size: 14px;
  }
`;

export const MegaMenuArrow = styled.span`
  display: inline-flex;
  color: ${({ theme }) => theme.colors.text.strong};
  opacity: 1;
  transform: translateX(0);
  margin-left: auto;
`;
