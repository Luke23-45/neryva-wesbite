import styled from 'styled-components';

export const StyledHeader = styled.header`
  position: sticky;
  top: 0;
  z-index: ${({ theme }) => theme.zIndices.header};
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 72px;
  padding: 0 ${({ theme }) => theme.spacing.s7};
  background-color: ${({ theme }) => theme.colors.paper};
  border-bottom: 1px solid ${({ theme }) => theme.colors.line};

  ${({ theme }) => theme.media.mobile} {
    height: 60px;
    padding: 0 ${({ theme }) => theme.spacing.s5};
  }
`;

export const LogoLink = styled.a`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s2};
  text-decoration: none;
  color: ${({ theme }) => theme.colors.ink};
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  font-size: ${({ theme }) => theme.typography.sizes.bodyLg};

  &:hover {
    color: ${({ theme }) => theme.colors.ink};
  }
`;

export const LogoImage = styled.img`
  height: 28px;
  width: auto;

  ${({ theme }) => theme.media.mobile} {
    height: 24px;
  }
`;

export const DesktopNav = styled.nav`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s6};

  ${({ theme }) => theme.media.mobile} {
    display: none;
  }
`;

export const NavLink = styled.a<{ $isActive?: boolean }>`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.typography.sizes.small};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme, $isActive }) => $isActive ? theme.colors.ink : theme.colors.inkSoft};
  text-decoration: none;
  padding-bottom: 2px;
  border-bottom: 2px solid ${({ theme, $isActive }) => $isActive ? theme.colors.ink : 'transparent'};
  transition: color ${({ theme }) => theme.transitions.fast},
              border-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.ink};
  }
`;

export const MobileMenuButton = styled.button`
  display: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: ${({ theme }) => theme.colors.ink};

  ${({ theme }) => theme.media.mobile} {
    display: flex;
  }
`;

export const MobileNavOverlay = styled.div<{ $isOpen: boolean }>`
  display: ${({ $isOpen }) => ($isOpen ? 'flex' : 'none')};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: ${({ theme }) => theme.zIndices.mobileNav};
  flex-direction: column;
  background-color: ${({ theme }) => theme.colors.paper};
  padding: ${({ theme }) => theme.spacing.s7};
`;

export const MobileNavHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.s8};
`;

export const MobileNavLink = styled.a<{ $isActive?: boolean }>`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.typography.sizes.h2};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme, $isActive }) => $isActive ? theme.colors.ink : theme.colors.inkSoft};
  text-decoration: none;
  padding: ${({ theme }) => theme.spacing.s3} 0;
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.ink};
  }
`;
