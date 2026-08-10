import styled from 'styled-components';

export const ShellRoot = styled.section`
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: #0b0d12;
  display: grid;
  grid-template-columns: 264px 1fr;
  color: #e6e9ef;
  font-family: ${({ theme }) => theme.typography.fonts.sans};

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: 1fr;
  }
`;

export const ShellSidebar = styled.aside<{ $mobileOpen?: boolean }>`
  position: sticky;
  top: 0;
  align-self: start;
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 16px 12px 14px;
  background: linear-gradient(180deg, #0d1016 0%, #0a0c11 100%);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  z-index: 50;

  ${({ theme }) => theme.media.tablet} {
    position: fixed;
    inset: 0 auto 0 0;
    width: 280px;
    transform: translateX(${({ $mobileOpen }) => ($mobileOpen ? '0' : '-100%')});
    transition: transform ${({ theme }) => theme.transitions.standard};
    box-shadow: ${({ $mobileOpen }) =>
      $mobileOpen ? '24px 0 60px rgba(0, 0, 0, 0.5)' : 'none'};
  }
`;

export const MobileOverlay = styled.div`
  display: none;
  ${({ theme }) => theme.media.tablet} {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
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
    color: rgba(229, 231, 235, 0.7);
    border-radius: 8px;
    cursor: pointer;
    &:hover {
      background: rgba(255, 255, 255, 0.06);
      color: #f5f7fb;
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
  font-size: 14px;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: #f5f7fb;
  display: inline-flex;
  align-items: baseline;
`;

export const BrandDot = styled.span`
  margin-left: 2px;
  color: #f97316;
  font-weight: 600;
`;

export const SidebarSearch = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  margin-bottom: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  color: rgba(229, 231, 235, 0.55);
  &:focus-within {
    border-color: rgba(245, 158, 11, 0.45);
    color: rgba(229, 231, 235, 0.85);
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
  font-size: 13px;
  color: #f5f7fb;
  &::placeholder {
    color: rgba(229, 231, 235, 0.4);
  }
`;

export const NavSection = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 18px;
`;

export const NavItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 500;
  color: rgba(229, 231, 235, 0.78);
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};
  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #f5f7fb;
  }
`;

export const NavItemIcon = styled.span<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  color: ${({ $active }) => ($active ? '#0b0d12' : 'rgba(229, 231, 235, 0.6)')};
  background: ${({ $active }) =>
    $active ? 'linear-gradient(135deg, #f59e0b 0%, #2563eb 100%)' : 'transparent'};
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};
`;

export const RecentSection = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-bottom: 8px;
  margin-right: -6px;
  padding-right: 6px;
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.08); border-radius: 4px; }
`;

export const RecentLabel = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(229, 231, 235, 0.45);
  padding: 6px 10px 4px;
`;

export const RecentItem = styled.div`
  display: block;
  padding: 7px 10px;
  border-radius: 7px;
  font-size: 13px;
  color: rgba(229, 231, 235, 0.72);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};
  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #f5f7fb;
  }
`;

export const SidebarFooter = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
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
  background: linear-gradient(135deg, #f59e0b 0%, #2563eb 100%);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
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
  font-size: 13px;
  font-weight: 500;
  color: #f5f7fb;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const UserTier = styled.span`
  font-size: 11px;
  color: rgba(229, 231, 235, 0.5);
`;

export const UpgradeCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    linear-gradient(180deg, rgba(245, 158, 11, 0.10), rgba(37, 99, 235, 0.06)),
    rgba(255, 255, 255, 0.02);
`;

export const UpgradeTitle = styled.div`
  font-size: 13px;
  color: rgba(229, 231, 235, 0.75);
`;

export const UpgradeButton = styled.button`
  border: 0;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 8px;
  background: #f5f7fb;
  color: #0b0d12;
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  transition: transform ${({ theme }) => theme.transitions.fast};
`;

export const ShellBody = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  background:
    radial-gradient(1200px 600px at 50% -10%, rgba(245, 158, 11, 0.10), transparent 60%),
    radial-gradient(900px 500px at 90% 10%, rgba(37, 99, 235, 0.08), transparent 60%),
    linear-gradient(180deg, #0b0d12 0%, #0a0c10 100%);
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
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(11, 13, 18, 0.7);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  ${({ theme }) => theme.media.mobile} { padding: 12px 18px; }
`;

export const TopbarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
`;

export const TopbarTitle = styled.h1`
  margin: 0;
  font-size: 14.5px;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: #f5f7fb;
`;

export const TopbarSubtitle = styled.span`
  font-size: 14.5px;
  color: rgba(229, 231, 235, 0.5);
`;

export const TopbarSearchHint = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: 8px;
  padding: 4px 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  color: rgba(229, 231, 235, 0.55);
  ${({ theme }) => theme.media.mobile} { display: none; }
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
  color: rgba(229, 231, 235, 0.55);
  border-radius: 8px;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};
  &:hover {
    color: #f5f7fb;
    background: rgba(255, 255, 255, 0.06);
  }
`;

export const ContentArea = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
`;
