import { useState, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useMatchRoute } from '@tanstack/react-router';
import {
  LayoutDashboard,
  GitBranch,
  Rocket,
  Server,
  ScrollText,
  Settings as SettingsIcon,
  Search as SearchIcon,
  Plus,
  Bell,
  DollarSign,
  KeyRound,
  ShieldCheck,
  Menu as MenuIcon,
  X as XIcon,
} from 'lucide-react';
import { NotificationsPopover } from '../NotificationsPopover';
import { AccountMenu } from '../AccountMenu';
import { UpgradeModal } from '@/sections/pages/products/agent-studio/UpgradeModal/UpgradeModal';
import { CommandPalette, type CommandItem } from '@/sections/common/CommandPalette';
import {
  ShellRoot,
  ShellSidebar,
  BrandRow,
  BrandMark,
  BrandWordmark,
  BrandDot,
  SidebarSearch,
  SidebarSearchIcon,
  SidebarSearchInput,
  NavSection,
  NavItem,
  NavItemIcon,
  RecentSection,
  RecentLabel,
  RecentItem,
  SidebarFooter,
  UserCard,
  UserAvatar,
  UserMeta,
  UserName,
  UserTier,
  ShellBody,
  Topbar,
  TopbarLeft,
  TopbarTitle,
  TopbarSubtitle,
  TopbarSearchHint,
  TopbarRight,
  IconAction,
  UpgradeCard,
  UpgradeTitle,
  ContentArea,
  MobileMenuButton,
  MobileOverlay,
} from './DeployShell.styles';

export type DeployNavItem = {
  label: string;
  to: string;
  icon: 'dashboard' | 'pipelines' | 'deployments' | 'infrastructure' | 'logs' | 'settings' | 'alerts' | 'cost' | 'secrets' | 'compliance';
};

export type RecentPipeline = { id: string; title: string };

type Props = {
  nav: DeployNavItem[];
  user: { initials: string; name: string; tier: string; email: string };
  workspace: { name: string; plan: string };
  searchPlaceholder: string;
  recentPipelines: RecentPipeline[];
  children: ReactNode;
};

const iconMap = {
  dashboard: LayoutDashboard,
  pipelines: GitBranch,
  deployments: Rocket,
  infrastructure: Server,
  logs: ScrollText,
  settings: SettingsIcon,
  alerts: Bell,
  cost: DollarSign,
  secrets: KeyRound,
  compliance: ShieldCheck,
} as const;

const premiumEase = [0.16, 1, 0.3, 1] as const;

export function DeployShell({
  nav,
  user,
  workspace,
  searchPlaceholder,
  recentPipelines,
  children,
}: Props) {
  const [query, setQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const matchRoute = useMatchRoute();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      } else if (e.key === '/' && !paletteOpen && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName ?? '')) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [paletteOpen]);

  const commandItems: CommandItem[] = [
    { id: 'dash', title: 'Dashboard', subtitle: 'Overview and live activity', to: '/deployment/dashboard', section: 'Navigate', icon: <LayoutDashboard size={14} strokeWidth={1.7} /> },
    { id: 'pipelines', title: 'Pipelines', subtitle: 'Deployment lifecycle', to: '/deployment/pipelines', section: 'Navigate', icon: <GitBranch size={14} strokeWidth={1.7} />, shortcut: ['P'] },
    { id: 'deployments', title: 'Deployments', subtitle: 'Active model deployments', to: '/deployment/deployments', section: 'Navigate', icon: <Rocket size={14} strokeWidth={1.7} />, shortcut: ['D'] },
    { id: 'infra', title: 'Infrastructure', subtitle: 'Regions and runtimes', to: '/deployment/infrastructure', section: 'Navigate', icon: <Server size={14} strokeWidth={1.7} /> },
    { id: 'logs', title: 'Logs', subtitle: 'Live deployment logs', to: '/deployment/logs', section: 'Navigate', icon: <ScrollText size={14} strokeWidth={1.7} />, shortcut: ['L'] },
    { id: 'alerts', title: 'Alerts', subtitle: 'Incidents and on-call', to: '/deployment/alerts', section: 'Navigate', icon: <Bell size={14} strokeWidth={1.7} /> },
    { id: 'cost', title: 'Cost & usage', subtitle: 'Spend breakdown and forecast', to: '/deployment/cost', section: 'Navigate', icon: <DollarSign size={14} strokeWidth={1.7} /> },
    { id: 'secrets', title: 'Secrets', subtitle: 'Encrypted vault', to: '/deployment/secrets', section: 'Navigate', icon: <KeyRound size={14} strokeWidth={1.7} /> },
    { id: 'compliance', title: 'Compliance', subtitle: 'Controls and audit log', to: '/deployment/compliance', section: 'Navigate', icon: <ShieldCheck size={14} strokeWidth={1.7} /> },
    { id: 'settings', title: 'Settings', subtitle: 'Workspace, environments, access', to: '/deployment/settings', section: 'Navigate', icon: <SettingsIcon size={14} strokeWidth={1.7} />, shortcut: [','] },
  ];

  return (
    <ShellRoot>
      {mobileOpen && <MobileOverlay onClick={() => setMobileOpen(false)} aria-hidden="true" />}

      <ShellSidebar
        $mobileOpen={mobileOpen}
        as={motion.aside}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, ease: premiumEase }}
      >
        <BrandRow>
          <BrandMark viewBox="0 0 32 32" aria-hidden="true">
            <defs>
              <linearGradient id="deploy-mark" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#f59e0b" />
                <stop offset="1" stopColor="#2563eb" />
              </linearGradient>
            </defs>
            <path
              d="M16 4l10 5.5v13L16 28 6 22.5v-13L16 4zm0 2.4L8.5 11v10L16 25.6 23.5 21V11L16 6.4zM16 11l5 2.6v5.8L16 22l-5-2.6v-5.8L16 11z"
              fill="url(#deploy-mark)"
            />
          </BrandMark>
          <BrandWordmark>
            Deploy<BrandDot aria-hidden="true">·</BrandDot>
          </BrandWordmark>
          <MobileMenuButton
            $variant="close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            style={{ marginLeft: 'auto' }}
          >
            <XIcon size={15} strokeWidth={1.8} />
          </MobileMenuButton>
        </BrandRow>

        <SidebarSearch>
          <SidebarSearchIcon>
            <SearchIcon size={14} strokeWidth={1.7} />
          </SidebarSearchIcon>
          <SidebarSearchInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
          />
        </SidebarSearch>

        <NavSection>
          <AnimatePresence initial={false}>
            {nav.map((item, i) => {
              const Icon = iconMap[item.icon];
              const active = matchRoute({ to: item.to, fuzzy: false });
              return (
                <NavItem
                  key={item.to}
                  as={motion.div}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: premiumEase, delay: 0.05 + i * 0.04 }}
                  onClick={() => setMobileOpen(false)}
                >
                  <Link
                    to={item.to}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}
                  >
                    <NavItemIcon $active={!!active}>
                      <Icon size={15} strokeWidth={1.6} />
                    </NavItemIcon>
                    <span>{item.label}</span>
                  </Link>
                </NavItem>
              );
            })}
          </AnimatePresence>
        </NavSection>

        <RecentSection>
          <RecentLabel>Recent pipelines</RecentLabel>
          {recentPipelines
            .filter((p) => p.title.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 6)
            .map((p) => (
              <RecentItem key={p.id} onClick={() => setMobileOpen(false)}>
                <Link
                  to="/deployment/pipelines"
                  style={{ display: 'block', width: '100%' }}
                >
                  {p.title}
                </Link>
              </RecentItem>
            ))}
        </RecentSection>

        <SidebarFooter>
          <UserCard>
            <UserAvatar aria-hidden="true">{user.initials}</UserAvatar>
            <UserMeta>
              <UserName>{workspace.name}</UserName>
              <UserTier>{workspace.plan}</UserTier>
            </UserMeta>
          </UserCard>

          <UpgradeCard>
            <UpgradeTitle>Need more capacity?</UpgradeTitle>
            <UpgradeModal />
          </UpgradeCard>
        </SidebarFooter>
      </ShellSidebar>

      <ShellBody>
        <Topbar>
          <TopbarLeft>
            <MobileMenuButton
              $variant="menu"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <MenuIcon size={16} strokeWidth={1.8} />
            </MobileMenuButton>
            <TopbarTitle>{workspace.name}</TopbarTitle>
            <TopbarSubtitle aria-hidden="true">·</TopbarSubtitle>
            <TopbarSubtitle>Deploy</TopbarSubtitle>
            <TopbarSearchHint
              role="button"
              tabIndex={0}
              onClick={() => setPaletteOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setPaletteOpen(true);
                }
              }}
              aria-label="Open command palette"
              style={{ cursor: 'pointer' }}
            >
              <SearchIcon size={11} strokeWidth={1.7} />
              Press <strong style={{ color: 'rgba(229, 231, 235, 0.78)', fontWeight: 500 }}>⌘K</strong> to search
            </TopbarSearchHint>
          </TopbarLeft>
          <TopbarRight>
            <IconAction as={Link} to="/deployment/deployments" aria-label="New deployment">
              <Plus size={15} strokeWidth={1.8} />
            </IconAction>
            <NotificationsPopover />
            <AccountMenu user={user} workspace={workspace} />
          </TopbarRight>
        </Topbar>
        <ContentArea>{children}</ContentArea>
      </ShellBody>
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        items={commandItems}
        brand="deploy"
      />
    </ShellRoot>
  );
}
