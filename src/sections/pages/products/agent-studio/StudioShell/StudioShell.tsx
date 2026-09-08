import { useState, useEffect, useMemo, type ReactNode } from 'react';
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
  RecentEmpty,
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
  BannerSlot,
  MobileMenuButton,
  MobileOverlay,
} from './StudioShell.styles';
import {
  LayoutDashboard,
  MessageSquare,
  Bot,
  MessagesSquare,
  Plug,
  Settings as SettingsIcon,
  Search as SearchIcon,
  Plus,
  Menu as MenuIcon,
  X as XIcon,
  Activity as ActivityIcon,
  BookOpen,
  Cpu,
  BarChart3,
  ShieldCheck,
  Sparkles,
  Code2,
  Users,
  Activity,
  FlaskConical,
  KeyRound,
} from 'lucide-react';
import { NotificationsPopover } from '../NotificationsPopover';
import { AccountMenu } from '../AccountMenu';
import { UpgradeModal } from '../UpgradeModal';
import { CommandPalette, type CommandItem } from '@/sections/common/CommandPalette';
import { useCan } from '@lib/engine/capabilities';
import { useAssistants } from '@hooks/studio/useAssistants';
import { useConversations } from '@hooks/studio/useStudioConversations';
import { useMembers, useKeys } from '@hooks/engine/queries';
import { ease } from '@styles/motion';

export type StudioNavItem = {
  label: string;
  to: string;
  icon: 'dashboard' | 'chat' | 'agents' | 'conversations' | 'activity' | 'integrations' | 'settings' | 'knowledge' | 'models' | 'analytics' | 'compliance' | 'templates' | 'api' | 'teams' | 'usage' | 'evaluations';
};

export type StudioNavGroup = {
  section: string;
  items: StudioNavItem[];
};

export type RecentChat = { id: string; title: string; to: string };

type Props = {
  nav: StudioNavGroup[];
  user: { initials: string; name: string; tier: string; email: string };
  workspace: { name: string; plan: string };
  searchPlaceholder: string;
  /** Real recent conversations; null while the list is still loading. */
  recentChats: RecentChat[] | null;
  topbarExtra?: ReactNode;
  /** The active-org switcher for the topbar (replaces the static title). */
  topbarOrg?: ReactNode;
  /** Entitlement-mode strip (trial countdown, payment alert, …). */
  banner?: ReactNode;
  children: ReactNode;
};

const iconMap = {
  dashboard: LayoutDashboard,
  chat: MessageSquare,
  agents: Bot,
  conversations: MessagesSquare,
  activity: ActivityIcon,
  integrations: Plug,
  settings: SettingsIcon,
  knowledge: BookOpen,
  models: Cpu,
  analytics: BarChart3,
  compliance: ShieldCheck,
  templates: Sparkles,
  api: Code2,
  teams: Users,
  usage: Activity,
  evaluations: FlaskConical,
} as const;

const isApplePlatform = () =>
  typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);

/** The static Navigate section of the command palette. */
const STATIC_NAV_ITEMS: CommandItem[] = [
  { id: 'dash', title: 'Dashboard', subtitle: 'Overview and live activity', to: '/agent-studio/dashboard', section: 'Navigate', icon: <LayoutDashboard size={14} strokeWidth={1.7} /> },
  { id: 'chat', title: 'Chat', subtitle: 'Conversational playground', to: '/agent-studio/chat', section: 'Navigate', icon: <MessageSquare size={14} strokeWidth={1.7} />, shortcut: ['C'] },
  { id: 'agents', title: 'Agents', subtitle: 'Manage and configure agents', to: '/agent-studio/agents', section: 'Navigate', icon: <Bot size={14} strokeWidth={1.7} />, shortcut: ['A'] },
  { id: 'knowledge', title: 'Knowledge base', subtitle: 'Sources your agents reference', to: '/agent-studio/knowledge', section: 'Navigate', icon: <BookOpen size={14} strokeWidth={1.7} />, shortcut: ['K'] },
  { id: 'models', title: 'Models', subtitle: 'AI models and routing', to: '/agent-studio/models', section: 'Navigate', icon: <Cpu size={14} strokeWidth={1.7} /> },
  { id: 'conversations', title: 'Conversations', subtitle: 'Browse all transcripts', to: '/agent-studio/conversations', section: 'Navigate', icon: <MessagesSquare size={14} strokeWidth={1.7} /> },
  { id: 'activity', title: 'Activity', subtitle: 'Live event stream', to: '/agent-studio/activity', section: 'Navigate', icon: <ActivityIcon size={14} strokeWidth={1.7} /> },
  { id: 'analytics', title: 'Analytics', subtitle: 'Performance and channel breakdown', to: '/agent-studio/analytics', section: 'Navigate', icon: <BarChart3 size={14} strokeWidth={1.7} /> },
  { id: 'integrations', title: 'Integrations', subtitle: 'Connected services and webhooks', to: '/agent-studio/integrations', section: 'Navigate', icon: <Plug size={14} strokeWidth={1.7} /> },
  { id: 'templates', title: 'Templates', subtitle: 'Pre-built agent templates', to: '/agent-studio/templates', section: 'Navigate', icon: <Sparkles size={14} strokeWidth={1.7} /> },
  { id: 'api', title: 'API explorer', subtitle: 'Interactive API reference', to: '/agent-studio/api', section: 'Navigate', icon: <Code2 size={14} strokeWidth={1.7} /> },
  { id: 'teams', title: 'Teams', subtitle: 'Members, invites, service accounts', to: '/agent-studio/teams', section: 'Navigate', icon: <Users size={14} strokeWidth={1.7} /> },
  { id: 'usage', title: 'Usage', subtitle: 'Tokens, cost, quota', to: '/agent-studio/usage', section: 'Navigate', icon: <Activity size={14} strokeWidth={1.7} /> },
  { id: 'evaluations', title: 'Evaluations', subtitle: 'Eval runs and datasets', to: '/agent-studio/evaluations', section: 'Navigate', icon: <FlaskConical size={14} strokeWidth={1.7} /> },
  { id: 'compliance', title: 'Compliance', subtitle: 'Certifications and audit log', to: '/agent-studio/compliance', section: 'Navigate', icon: <ShieldCheck size={14} strokeWidth={1.7} /> },
  { id: 'settings', title: 'Settings', subtitle: 'Workspace, team, billing', to: '/agent-studio/settings/profile', section: 'Navigate', icon: <SettingsIcon size={14} strokeWidth={1.7} />, shortcut: [','] },
];

export function StudioShell({
  nav,
  user,
  workspace,
  searchPlaceholder,
  recentChats,
  topbarExtra,
  topbarOrg,
  banner,
  children,
}: Props) {
  const [query, setQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const matchRoute = useMatchRoute();
  const location = useLocation();
  const can = useCan('agent_studio');
  const canWrite = can('studio:write');

  // Palette + recents read real data. Conversations always load (the
  // sidebar recents use them, calm 15s staleness); members/keys/assistants
  // fetch only while the palette is open so the shell stays cheap.
  const assistants = useAssistants({ enabled: paletteOpen });
  const conversations = useConversations({ enabled: true });
  const members = useMembers({}, { enabled: paletteOpen });
  const keys = useKeys({ enabled: paletteOpen });
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
    if (to.startsWith('/agent-studio/agents')) return path.startsWith('/agent-studio/agents');
    if (to.startsWith('/agent-studio/settings')) return path.startsWith('/agent-studio/settings');
    if (to.startsWith('/agent-studio/integrations')) return path.startsWith('/agent-studio/integrations');
    return !!matchRoute({ to, fuzzy: false });
  };

  const q = query.trim().toLowerCase();
  const filteredGroups = nav
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.label.toLowerCase().includes(q)),
    }))
    .filter((group) => group.items.length > 0);
  const filteredRecents = (recentChats ?? []).filter((c) => c.title.toLowerCase().includes(q)).slice(0, 6);
  const hasResults = filteredGroups.length > 0 || filteredRecents.length > 0;

  // The launcher indexes the workspace: static pages plus live agents,
  // conversations, members, and keys (loaded while the palette is open).
  const commandItems = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [...STATIC_NAV_ITEMS];
    for (const agent of (assistants.data ?? []).slice(0, 8)) {
      items.push({
        id: `agent-${agent.id}`,
        title: agent.name,
        subtitle: agent.status ?? 'Agent',
        to: `/agent-studio/agents/${agent.id}`,
        section: 'Agents',
        icon: <Bot size={14} strokeWidth={1.7} />,
      });
    }
    for (const conversation of (conversations.data ?? []).slice(0, 8)) {
      items.push({
        id: `conversation-${conversation.id}`,
        title: conversation.title,
        subtitle: 'Conversation',
        to: `/agent-studio/conversations?chat=${encodeURIComponent(conversation.id)}`,
        section: 'Conversations',
        icon: <MessagesSquare size={14} strokeWidth={1.7} />,
      });
    }
    for (const member of (members.data?.members ?? []).slice(0, 6)) {
      items.push({
        id: `member-${member.accountId}`,
        title: member.displayName ?? member.email,
        subtitle: 'Member',
        to: '/agent-studio/teams',
        section: 'Members & keys',
        icon: <Users size={14} strokeWidth={1.7} />,
      });
    }
    for (const key of (keys.data?.keys ?? []).slice(0, 6)) {
      items.push({
        id: `key-${key.id}`,
        title: key.name,
        subtitle: 'API key',
        to: '/agent-studio/settings/api-keys',
        section: 'Members & keys',
        icon: <KeyRound size={14} strokeWidth={1.7} />,
      });
    }
    return items;
  }, [assistants.data, conversations.data, members.data, keys.data]);

  return (
    <ShellRoot>
      {mobileOpen && <MobileOverlay onClick={() => setMobileOpen(false)} aria-hidden="true" />}

      <ShellSidebar
        $mobileOpen={mobileOpen}
        as={motion.aside}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, ease: ease.premium }}
        aria-label="Studio navigation"
      >
        <BrandRow>
          <BrandMark viewBox="0 0 32 32" aria-hidden="true">
            <defs>
              <linearGradient id="shell-mark" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#c084fc" />
                <stop offset="0.55" stopColor="#2563eb" />
                <stop offset="1" stopColor="#05e3a4" />
              </linearGradient>
            </defs>
            <path
              d="M6 26V8.5C6 7.12 7.12 6 8.5 6h7.2c3.59 0 6.5 2.91 6.5 6.5S19.29 19 15.7 19H11v7H6z"
              fill="url(#shell-mark)"
            />
          </BrandMark>
          <BrandWordmark>
            Studio<BrandDot aria-hidden="true">·</BrandDot>
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
          <RecentLabel>Recent chats</RecentLabel>
          {recentChats !== null && (
            <>
              {q && !hasResults && <RecentLabel>No matches for “{query}”</RecentLabel>}
              {filteredRecents.map((c) => (
                <RecentItemLink key={c.id} to={c.to} onClick={() => setMobileOpen(false)}>
                  {c.title}
                </RecentItemLink>
              ))}
              {recentChats.length === 0 && !q && (
                <RecentEmpty to="/agent-studio/chat">Start your first chat →</RecentEmpty>
              )}
            </>
          )}
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
            <UpgradeTitle>Upgrade to Scale</UpgradeTitle>
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
            {topbarOrg ?? <TopbarTitle>{workspace.name}</TopbarTitle>}
            <TopbarSubtitle aria-hidden="true">·</TopbarSubtitle>
            <TopbarSubtitle>Studio</TopbarSubtitle>
            {topbarExtra}
            <TopbarSearchHint onClick={() => setPaletteOpen(true)} aria-label="Open command palette">
              <SearchIcon size={11} strokeWidth={1.7} />
              Press <TopbarKbd>{modKey} K</TopbarKbd> to search
            </TopbarSearchHint>
          </TopbarLeft>
          <TopbarRight>
            {canWrite ? (
              <IconAction as={Link} to="/agent-studio/chat" aria-label="New chat">
                <Plus size={15} strokeWidth={1.8} />
              </IconAction>
            ) : (
              <IconAction
                as="button"
                type="button"
                disabled
                title="Your role can’t start chats in this workspace — ask an owner, admin, or developer."
                aria-label="New chat (unavailable for your role)"
                style={{ cursor: 'not-allowed', opacity: 0.4 }}
              >
                <Plus size={15} strokeWidth={1.8} />
              </IconAction>
            )}
            <NotificationsPopover />
            <AccountMenu user={user} workspace={workspace} onOpenShortcuts={() => setPaletteOpen(true)} />
          </TopbarRight>
        </Topbar>
        {banner && <BannerSlot>{banner}</BannerSlot>}
        <ContentArea>{children}</ContentArea>
      </ShellBody>
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        items={commandItems}
        brand="studio"
        loading={paletteOpen && (assistants.isPending || conversations.isPending || members.isPending || keys.isPending)}
      />
    </ShellRoot>
  );
}
