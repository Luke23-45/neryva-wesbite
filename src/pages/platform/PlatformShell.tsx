/**
 * The /platform shell (frontend-engine-integration-plan A6): org picker +
 * project selector header, console nav, and the sign-in state for the OP
 * session. Everything under /platform renders inside this shell.
 */
import { useEffect } from 'react';
import { Outlet, Link, useNavigate } from '@tanstack/react-router';
import styled from 'styled-components';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  KeyRound,
  BarChart3,
  Receipt,
  ScrollText,
  Settings,
  Activity,
  LogOut,
} from 'lucide-react';
import { useSessionStore, beginLogin, logout } from '@lib/engine/auth';
import { useOrg, ROLE_LABELS, type OrgRole } from '@/Context/OrgContext';
import { useProjects } from '@hooks/engine/queries';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { StepUpModal } from '@components/platform/StepUpModal';
import { OrgSwitcher } from '@components/platform/OrgSwitcher';
import { SignInOptions } from '@components/platform/SignInOptions';

const Shell = styled.div`
  display: flex;
  min-height: 100vh;
  background: #0a0a0f;
  color: #eceef4;
`;

const Sidebar = styled.aside`
  width: 232px;
  flex-shrink: 0;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  padding: 20px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const NavItem = styled(Link)<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  color: rgba(236, 238, 244, 0.65);
  text-decoration: none;
  transition: background 150ms ease, color 150ms ease;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #eceef4;
  }
  ${({ $active }) => $active && 'background: rgba(255,255,255,0.08); color: #fff;'}
`;

const Main = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
`;

const TopBar = styled.header`
  height: 60px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  gap: 16px;
`;

const TopGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
`;

const PlainSelect = styled.select`
  background: transparent;
  color: rgba(236, 238, 244, 0.7);
  border: none;
  font-size: 12px;
  cursor: pointer;
`;

const AccountChip = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: rgba(236, 238, 244, 0.7);
`;

const Content = styled.main`
  flex: 1;
  padding: 28px 32px;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
`;

const Brand = styled.div`
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.02em;
  padding: 4px 12px 16px;
`;

const NAV = [
  { to: '/platform', label: 'Home', icon: LayoutDashboard },
  { to: '/platform/organization/members', label: 'Members', icon: Users },
  { to: '/platform/projects', label: 'Projects', icon: FolderKanban },
  { to: '/platform/api-keys', label: 'API Keys', icon: KeyRound },
  { to: '/platform/usage', label: 'Usage', icon: BarChart3 },
  { to: '/platform/billing', label: 'Billing', icon: Receipt },
  { to: '/platform/audit', label: 'Audit', icon: ScrollText },
  { to: '/platform/settings', label: 'Settings', icon: Settings },
  { to: '/platform/status', label: 'Status', icon: Activity },
];

export default function PlatformShell() {
  const navigate = useNavigate();
  const status = useSessionStore((s) => s.status);
  const account = useSessionStore((s) => s.account);
  const hydrate = useSessionStore((s) => s.hydrate);
  const { orgs, orgId, role, name } = useOrg();
  const projects = useProjects();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (status === 'authenticated' && !orgId && (orgs?.length ?? 0) === 0) {
      // Authenticated with zero orgs — the engine autocreates a personal org,
      // so this only happens mid-propagation; the home page explains it.
    }
  }, [status, orgId, orgs]);

  if (status === 'unknown') {
    return (
      <Shell>
        <Sidebar />
        <Main>
          <TopBar />
          <Content>
            <Skeleton $h="32px" $w="220px" />
            <Skeleton $h="220px" $r="12px" />
          </Content>
        </Main>
      </Shell>
    );
  }

  if (status === 'anonymous') {
    return (
      <Shell>
        <Main>
          <TopBar>
            <Brand>Neryva Platform</Brand>
          </TopBar>
          <Content>
            <h2 style={{ fontSize: 20, fontWeight: 600 }}>Sign in to the Neryva Platform</h2>
            <p style={{ fontSize: 14, opacity: 0.7, maxWidth: 460 }}>
              The console uses your Neryva Account — the same identity across the platform, studio, and billing.
            </p>
            <button
              onClick={() => void beginLogin()}
              style={{ marginTop: 16, padding: '10px 20px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
            >
              Sign in with Neryva
            </button>
            <SignInOptions />
          </Content>
        </Main>
      </Shell>
    );
  }

  return (
    <Shell>
      <Sidebar>
        <Brand>neryva · platform</Brand>
        {NAV.map((item) => (
          <NavItem
            key={item.to}
            to={item.to}
            $active={item.to === '/platform' ? window.location.pathname === '/platform' : window.location.pathname.startsWith(item.to)}
          >
            <item.icon size={15} strokeWidth={1.8} />
            {item.label}
          </NavItem>
        ))}
      </Sidebar>
      <Main>
        <TopBar>
          <TopGroup>
            <OrgSwitcher onSwitch={() => void navigate({ to: '/platform' })} />
            {projects.data?.projects?.length ? (
              <PlainSelect defaultValue="">
                <option value="">All projects</option>
                {projects.data.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </PlainSelect>
            ) : null}
          </TopGroup>
          <TopGroup>
            <AccountChip>
              {name ?? account?.email ?? 'Account'}
              {role && <> · {ROLE_LABELS[role as OrgRole] ?? role}</>}
            </AccountChip>
            <button
              onClick={() => void logout()}
              title="Sign out"
              style={{ background: 'none', border: 'none', color: 'rgba(236,238,244,0.6)', cursor: 'pointer', display: 'flex', padding: 6 }}
            >
              <LogOut size={15} />
            </button>
          </TopGroup>
        </TopBar>
        <Content>
          <Outlet />
        </Content>
        <StepUpModal />
      </Main>
    </Shell>
  );
}
