import { useState, useEffect, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useMatchRoute } from '@tanstack/react-router';
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
  NavGroupLabel,
  NavItemLink,
  NavItemIcon,
  RecentSection,
  RecentLabel,
  RecentItemLink,
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
  TopbarKbd,
  TopbarRight,
  IconAction,
  UpgradeCard,
  UpgradeTitle,
  ContentArea,
  MobileMenuButton,
  MobileOverlay,
} from './DeployShell.styles';
import {
  LayoutDashboard,
  GitBranch,
  Rocket,
  Server,
  ScrollText,
  Settings as SettingsIcon,
  Search as SearchIcon,
  Plus,
  Menu as MenuIcon,
  X as XIcon,
  Bell,
  DollarSign,
  KeyRound,
  ShieldCheck,
  Webhook,
  Globe2,
  Gauge,
  FlaskConical,
  Users,
  BarChart3,
  History,
} from 'lucide-react';
import { NotificationsPopover } from '../NotificationsPopover';
import { AccountMenu } from '../AccountMenu';
import { UpgradeModal } from '@/sections/pages/products/agent-studio/UpgradeModal/UpgradeModal';
import { CommandPalette, type CommandItem } from '@/sections/common/CommandPalette';
import { ease } from '@styles/motion';

export type DeployNavItem = {
  label: string;
  to: string;
  icon: 'dashboard' | 'pipelines' | 'deployments' | 'infrastructure' | 'logs' | 'settings' | 'alerts' | 'cost' | 'secrets' | 'compliance' | 'webhooks' | 'network' | 'scaling' | 'experiments' | 'teams' | 'usage' | 'releases';
};

export type DeployNavGroup = {
  section: string;
  items: DeployNavItem[];
};

export type RecentPipeline = { id: string; title: string };

type Props = {
  nav: DeployNavGroup[];
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
  webhooks: Webhook,
  network: Globe2,
  scaling: Gauge,
  experiments: FlaskConical,
  teams: Users,
  usage: BarChart3,
  releases: History,
} as const;

const isApplePlatform = () =>
  typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);

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
  const location = useLocation();
  const modKey = isApplePlatform() ? '⌘' : 'Ctrl';

  useEffect(() => {
    document.body.classList.add('app-shell');
    return () => document.body.classList.remove('app-shell');
  }, []);

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

  // Mobile drawer: Escape closes, body scroll locks while open.
  useEffect(() => {
    if (!mobileOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', onEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onEsc);
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // Detail/sub routes keep their parent highlighted in the sidebar.
  const isActive = (to: string) => {
    const path = location.pathname;
    if (to.startsWith('/deployment/pipelines')) return path.startsWith('/deployment/pipelines');
    if (to.startsWith('/deployment/deployments')) return path.startsWith('/deployment/deployments');
    if (to.startsWith('/deployment/settings')) return path.startsWith('/deployment/settings');
    return !!matchRoute({ to, fuzzy: false });
  };

  const q = query.trim().toLowerCase();
  const filteredGroups = nav
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.label.toLowerCase().includes(q)),
    }))
    .filter((group) => group.items.length > 0);
  const filteredRecents = recentPipelines
    .filter((p) => p.title.toLowerCase().includes(q))
    .slice(0, 6);
  const hasResults = filteredGroups.length > 0 || filteredRecents.length > 0;

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
    { id: 'webhooks', title: 'Webhooks', subtitle: 'Outbound HTTP callbacks', to: '/deployment/webhooks', section: 'Navigate', icon: <Webhook size={14} strokeWidth={1.7} /> },
    { id: 'network', title: 'Network', subtitle: 'Endpoints, VPC, DNS, CDN', to: '/deployment/network', section: 'Navigate', icon: <Globe2 size={14} strokeWidth={1.7} /> },
    { id: 'scaling', title: 'Scaling', subtitle: 'Auto-scaling and capacity', to: '/deployment/scaling', section: 'Navigate', icon: <Gauge size={14} strokeWidth={1.7} /> },
    { id: 'experiments', title: 'Experiments', subtitle: 'A/B tests and canaries', to: '/deployment/experiments', section: 'Navigate', icon: <FlaskConical size={14} strokeWidth={1.7} /> },
    { id: 'teams', title: 'Teams', subtitle: 'Members, RBAC, service accounts', to: '/deployment/teams', section: 'Navigate', icon: <Users size={14} strokeWidth={1.7} /> },
    { id: 'usage', title: 'Usage', subtitle: 'Requests, compute, quotas', to: '/deployment/usage', section: 'Navigate', icon: <BarChart3 size={14} strokeWidth={1.7} /> },
    { id: 'releases', title: 'Releases', subtitle: 'Release history and changelogs', to: '/deployment/releases', section: 'Navigate', icon: <History size={14} strokeWidth={1.7} /> },
    { id: 'settings', title: 'Settings', subtitle: 'Workspace, environments, access', to: '/deployment/settings/general', section: 'Navigate', icon: <SettingsIcon size={14} strokeWidth={1.7} />, shortcut: [','] },
  ];

  return (
    <ShellRoot>
      {mobileOpen && <MobileOverlay onClick={() => setMobileOpen(false)} aria-hidden="true" />}

      <ShellSidebar
        $mobileOpen={mobileOpen}
        as={motion.aside}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, ease: ease.premium }}
        aria-label="Deploy navigation"
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
            aria-label={searchPlaceholder}
          />
        </SidebarSearch>

        <NavSection>
          {filteredGroups.map((group, gi) => (
            <div key={group.section}>
              <NavGroupLabel>{group.section}</NavGroupLabel>
              {group.items.map((item, i) => {
                const Icon = iconMap[item.icon];
                const active = isActive(item.to);
                return (
                  <motion.div
                    key={item.to}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: ease.premium, delay: 0.05 + (gi + i) * 0.03 }}
                  >
                    <NavItemLink
                      to={item.to}
                      $active={active}
                      aria-current={active ? 'page' : undefined}
                      onClick={() => setMobileOpen(false)}
                    >
                      <NavItemIcon $active={active}>
                        <Icon size={15} strokeWidth={1.6} />
                      </NavItemIcon>
                      <span>{item.label}</span>
                    </NavItemLink>
                  </motion.div>
                );
              })}
            </div>
          ))}
        </NavSection>

        <RecentSection>
          <RecentLabel>Recent pipelines</RecentLabel>
          {q && !hasResults && <RecentLabel>No matches for “{query}”</RecentLabel>}
          {filteredRecents.map((p) => (
            <RecentItemLink key={p.id} to="/deployment/pipelines" onClick={() => setMobileOpen(false)}>
              {p.title}
            </RecentItemLink>
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
            <TopbarSearchHint onClick={() => setPaletteOpen(true)} aria-label="Open command palette">
              <SearchIcon size={11} strokeWidth={1.7} />
              Press <TopbarKbd>{modKey} K</TopbarKbd> to search
            </TopbarSearchHint>
          </TopbarLeft>
          <TopbarRight>
            <IconAction as={Link} to="/deployment/deployments" aria-label="New deployment">
              <Plus size={15} strokeWidth={1.8} />
            </IconAction>
            <NotificationsPopover />
            <AccountMenu user={user} workspace={workspace} onOpenShortcuts={() => setPaletteOpen(true)} />
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
