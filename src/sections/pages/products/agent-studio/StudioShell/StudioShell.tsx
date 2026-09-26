import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, useLocation } from '@tanstack/react-router';
import {
  ShellRoot,
  ShellSidebar,
  BrandRow,
  BrandMark,
  BrandWordmark,
  BrandDot,
  CollapseButton,
  SidebarSearch,
  SidebarSearchIcon,
  SidebarSearchInput,
  NavSection,
  NavLevelSlide,
  RecentSection,
  RecentLabel,
  RecentItemLink,
  RecentItemTitle,
  RecentItemDate,
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
  TopbarBackLink,
  TopbarSearchHint,
  TopbarKbd,
  TopbarRight,
  IconAction,
  ContentArea,
  BannerSlot,
  MobileMenuButton,
  MobileOverlay,
} from './StudioShell.styles';
import {
  MessageSquare,
  Search as SearchIcon,
  Plus,
  Menu as MenuIcon,
  X as XIcon,
  ChevronsLeft,
  ChevronsRight,
  Bot,
  Users,
  KeyRound,
  LayoutDashboard,
  BookOpen,
  Cpu,
  Wrench,
  ShieldCheck,
  BarChart3,
  Plug,
  Sparkles,
  Code2,
  Activity as ActivityIcon,
  FlaskConical,
  Settings as SettingsIcon,
} from 'lucide-react';
import { NotificationsPopover } from '../NotificationsPopover';
import { AccountMenu } from '../AccountMenu';
import { CommandPalette, type CommandItem } from '@/sections/common/CommandPalette';
import { useCan } from '@lib/engine/capabilities';
import { useAssistants } from '@hooks/studio/useAssistants';
import { useConversations } from '@hooks/studio/useStudioConversations';
import { useMembers, useKeys } from '@hooks/engine/queries';
import { useOrg } from '@/Context/OrgContext';
import { ease } from '@styles/motion';
import {
  resolveDomain,
  resolveItem,
  resolveLevel,
  type NavConfig,
} from './nav-config';
import { SidebarDomains } from './SidebarDomains';
import { SidebarSection } from './SidebarSection';
import { useNavBadges } from './useNavBadges';
import { useSidebarPrefs } from './useSidebarPrefs';

export type RecentChat = { id: string; title: string; to: string; updatedAt: string | null };

/**
 * Check if a chat title is a generic placeholder (e.g., "Untitled conversation").
 * Generic titles get a relative date suffix to disambiguate them in the sidebar.
 */
const isGenericTitle = (title: string): boolean => {
  const normalized = title.toLowerCase().trim();
  return normalized === 'untitled conversation' || normalized === 'untitled' || normalized === '';
};

/**
 * Format an ISO date as a relative time (e.g., "2d ago", "Yesterday").
 * Apple-style: concise, human-readable, no unnecessary precision.
 */
const formatRelativeDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Just now';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? '1w ago' : `${weeks}w ago`;
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

type Props = {
  /** v2 domain config (SIDEBAR_LEDGER.md §2 — single source of truth). */
  nav: NavConfig;
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

/** The static Navigate section of the command palette. */
const STATIC_NAV_ITEMS: CommandItem[] = [
  { id: 'dash', title: 'Dashboard', subtitle: 'Overview and live activity', to: '/agent-studio/dashboard', section: 'Navigate', icon: <LayoutDashboard size={14} strokeWidth={1.7} /> },
  { id: 'chat', title: 'Chat', subtitle: 'Conversational playground', to: '/agent-studio/chat', section: 'Navigate', icon: <MessageSquare size={14} strokeWidth={1.7} />, shortcut: ['C'] },
  { id: 'agents', title: 'Agents', subtitle: 'Manage and configure agents', to: '/agent-studio/agents', section: 'Navigate', icon: <Bot size={14} strokeWidth={1.7} />, shortcut: ['A'] },
  { id: 'agents-overview', title: 'Agents overview', subtitle: 'Fleet health and what needs attention', to: '/agent-studio/agents/overview', section: 'Navigate', icon: <LayoutDashboard size={14} strokeWidth={1.7} /> },
  { id: 'agents-new', title: 'New agent', subtitle: 'Guided circuit builder', to: '/agent-studio/agents/new', section: 'Create', icon: <Plus size={14} strokeWidth={1.7} /> },
  { id: 'memory', title: 'Memory', subtitle: 'What your agents remember', to: '/agent-studio/memory', section: 'Navigate', icon: <MessageSquare size={14} strokeWidth={1.7} /> },
  { id: 'datasets', title: 'Datasets', subtitle: 'Evaluation datasets', to: '/agent-studio/datasets', section: 'Navigate', icon: <FlaskConical size={14} strokeWidth={1.7} /> },
  { id: 'blocks', title: 'Blocks', subtitle: 'Governance kill switches', to: '/agent-studio/blocks', section: 'Navigate', icon: <ShieldCheck size={14} strokeWidth={1.7} /> },
  { id: 'knowledge', title: 'Knowledge base', subtitle: 'Sources your agents reference', to: '/agent-studio/knowledge', section: 'Navigate', icon: <BookOpen size={14} strokeWidth={1.7} />, shortcut: ['K'] },
  { id: 'models', title: 'Models', subtitle: 'AI models and routing', to: '/agent-studio/models', section: 'Navigate', icon: <Cpu size={14} strokeWidth={1.7} /> },
  { id: 'tools', title: 'Tools', subtitle: 'Tool catalog and bindings', to: '/agent-studio/tools', section: 'Navigate', icon: <Wrench size={14} strokeWidth={1.7} /> },
  { id: 'channels', title: 'Channels', subtitle: 'WhatsApp, Messenger, Telegram, widget', to: '/agent-studio/channels', section: 'Navigate', icon: <MessageSquare size={14} strokeWidth={1.7} /> },
  { id: 'approvals', title: 'Approvals', subtitle: 'Human review queue for tool calls', to: '/agent-studio/approvals', section: 'Navigate', icon: <ShieldCheck size={14} strokeWidth={1.7} /> },
  { id: 'conversations', title: 'Conversations', subtitle: 'Browse all transcripts', to: '/agent-studio/conversations', section: 'Navigate', icon: <MessageSquare size={14} strokeWidth={1.7} /> },
  { id: 'activity', title: 'Activity', subtitle: 'Live event stream', to: '/agent-studio/activity', section: 'Navigate', icon: <ActivityIcon size={14} strokeWidth={1.7} /> },
  { id: 'analytics', title: 'Analytics', subtitle: 'Usage and agent activity', to: '/agent-studio/analytics', section: 'Navigate', icon: <BarChart3 size={14} strokeWidth={1.7} /> },
  { id: 'integrations', title: 'Integrations', subtitle: 'Connected services and webhooks', to: '/agent-studio/integrations', section: 'Navigate', icon: <Plug size={14} strokeWidth={1.7} /> },
  { id: 'templates', title: 'Templates', subtitle: 'Pre-built agent templates', to: '/agent-studio/templates', section: 'Navigate', icon: <Sparkles size={14} strokeWidth={1.7} /> },
  { id: 'api', title: 'API explorer', subtitle: 'Interactive API reference', to: '/agent-studio/api', section: 'Navigate', icon: <Code2 size={14} strokeWidth={1.7} /> },
  { id: 'teams', title: 'Teams', subtitle: 'Members, invites, service accounts', to: '/agent-studio/teams', section: 'Navigate', icon: <Users size={14} strokeWidth={1.7} /> },
  { id: 'usage', title: 'Usage', subtitle: 'Tokens, cost, quota', to: '/agent-studio/usage', section: 'Navigate', icon: <ActivityIcon size={14} strokeWidth={1.7} /> },
  { id: 'evaluations', title: 'Evaluations', subtitle: 'Eval runs and datasets', to: '/agent-studio/evaluations', section: 'Navigate', icon: <FlaskConical size={14} strokeWidth={1.7} /> },
  { id: 'compliance', title: 'Compliance', subtitle: 'Certifications and audit log', to: '/agent-studio/compliance', section: 'Navigate', icon: <ShieldCheck size={14} strokeWidth={1.7} /> },
  { id: 'settings', title: 'Settings', subtitle: 'Workspace, team, billing', to: '/agent-studio/settings/profile', section: 'Navigate', icon: <SettingsIcon size={14} strokeWidth={1.7} />, shortcut: [','] },
];

const isApplePlatform = () =>
  typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);

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
  const location = useLocation();
  const can = useCan('agent_studio');
  const canWrite = can('studio:write');
  const { role } = useOrg();
  const badges = useNavBadges(nav);
  const { collapsed, toggleCollapsed, pinnedLevel1, pinLevel1 } = useSidebarPrefs(location.pathname);

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

  // ── Level derivation (pure, every render — cold-load safe) ──
  const level = resolveLevel(location.pathname, nav);
  const isBuilder = level.kind === 'builder';
  const domain = level.kind === 'section' ? level.domain : null;
  // The back-row pin shows level 1 on the SAME route (session chrome only).
  const showLevel1 = !isBuilder && (pinnedLevel1 || level.kind !== 'section' || level.level === 1);
  // Breadcrumb truth always follows the ROUTE (even under the level-1 pin —
  // orientation must never lie about where the user is).
  const activeDomain =
    level.kind === 'section' ? (resolveDomain(location.pathname, nav) ?? level.domain) : null;
  const activeItem =
    level.kind === 'section' && activeDomain !== null
      ? resolveItem(location.pathname, activeDomain)
      : null;

  // Focus on level/domain change (skip first paint: cold-load must not steal
  // focus from deep-link targets). The announcement below is DERIVED, not
  // stated — aria-live regions announce on content change, so no effect needed.
  const backRef = useRef<HTMLButtonElement | null>(null);
  const slideRef = useRef<HTMLDivElement | null>(null);
  const prevLevelKey = useRef<string | null>(null);
  const levelKey = isBuilder ? 'builder' : showLevel1 ? 'l1' : `l2:${activeDomain?.key ?? 'none'}`;
  useEffect(() => {
    if (prevLevelKey.current === null) {
      prevLevelKey.current = levelKey;
      return;
    }
    if (prevLevelKey.current === levelKey) return;
    prevLevelKey.current = levelKey;
    if (levelKey === 'l1' || levelKey === 'builder') {
      slideRef.current?.focus({ preventScroll: true });
    } else {
      backRef.current?.focus({ preventScroll: true });
    }
  }, [levelKey]);
  const announcement =
    levelKey === 'builder'
      ? 'Agent builder'
      : showLevel1
        ? 'Studio sections'
        : `${activeDomain?.label ?? 'Section'} section`;

  // Desktop Esc on level 2 (outside inputs) steps back to level 1.
  // Precedence: modal > mobile drawer > level-up (ledger §4.6).
  useEffect(() => {
    if (mobileOpen || showLevel1 || isBuilder) return;
    const onEsc = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName ?? '';
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      e.preventDefault();
      pinLevel1();
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [mobileOpen, showLevel1, isBuilder, pinLevel1]);

  const q = query.trim().toLowerCase();
  const filteredRecents = (recentChats ?? []).filter((c) => c.title.toLowerCase().includes(q)).slice(0, 6);
  const hasResults = filteredRecents.length > 0 || q.length === 0;

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
        icon: <MessageSquare size={14} strokeWidth={1.7} />,
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

  const closeMobile = () => setMobileOpen(false);
  const slideKey = isBuilder ? 'builder' : showLevel1 ? 'level-1' : `level-2:${domain?.key ?? 'none'}`;

  return (
    <ShellRoot $collapsed={collapsed} $builder={isBuilder}>
      {mobileOpen && <MobileOverlay onClick={closeMobile} aria-hidden="true" />}

      {!isBuilder && (
        <ShellSidebar
          $mobileOpen={mobileOpen}
          $collapsed={collapsed}
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
            <CollapseButton
              type="button"
              onClick={toggleCollapsed}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!collapsed}
            >
              {collapsed ? <ChevronsRight size={15} strokeWidth={1.8} /> : <ChevronsLeft size={15} strokeWidth={1.8} />}
            </CollapseButton>
            <MobileMenuButton
              $variant="close"
              onClick={closeMobile}
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

          <NavSection
            ref={slideRef}
            tabIndex={-1}
            aria-label={showLevel1 || domain === null ? 'Studio sections' : `${domain.label} section`}
          >
            <AnimatePresence mode="wait" initial={false}>
              <NavLevelSlide
                as={motion.div}
                key={slideKey}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2, ease: ease.premium }}
              >
                {showLevel1 || domain === null ? (
                  <SidebarDomains
                    config={nav}
                    activeKey={activeDomain?.key ?? null}
                    badges={badges}
                    query={query}
                    role={role ?? null}
                    onNavigate={closeMobile}
                  />
                ) : (
                  <SidebarSection
                    domain={domain}
                    activeTo={activeItem?.to ?? null}
                    badges={badges}
                    query={query}
                    role={role ?? null}
                    onNavigate={closeMobile}
                    onBack={pinLevel1}
                    backRef={backRef}
                  />
                )}
              </NavLevelSlide>
            </AnimatePresence>
          </NavSection>

          {showLevel1 && (
            <RecentSection>
              <RecentLabel>Recent chats</RecentLabel>
              {recentChats !== null && (
                <>
                  {q && !hasResults && <RecentLabel>No matches for “{query}”</RecentLabel>}
                  {filteredRecents.map((c) => (
                    <RecentItemLink key={c.id} to={c.to} onClick={closeMobile}>
                      <RecentItemTitle>{c.title}</RecentItemTitle>
                      {isGenericTitle(c.title) && c.updatedAt && (
                        <RecentItemDate>{formatRelativeDate(c.updatedAt)}</RecentItemDate>
                      )}
                    </RecentItemLink>
                  ))}
                  {recentChats.length === 0 && !q && (
                    <RecentEmpty to="/agent-studio/chat">Start your first chat →</RecentEmpty>
                  )}
                </>
              )}
            </RecentSection>
          )}

          <SidebarFooter>
            <UserCard>
              <UserAvatar aria-hidden="true">{user.initials}</UserAvatar>
              <UserMeta>
                <UserName>{workspace.name}</UserName>
                <UserTier>{workspace.plan}</UserTier>
              </UserMeta>
            </UserCard>
          </SidebarFooter>
          <span aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
            {announcement}
          </span>
        </ShellSidebar>
      )}

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
            {isBuilder ? (
              <TopbarBackLink to="/agent-studio/agents">← Agents</TopbarBackLink>
            ) : (
              <>
                {topbarOrg ?? <TopbarTitle>{workspace.name}</TopbarTitle>}
                <TopbarSubtitle aria-hidden="true">·</TopbarSubtitle>
                <TopbarSubtitle>Studio</TopbarSubtitle>
              </>
            )}
            {!isBuilder && activeDomain !== null && (
              <TopbarSubtitle>
                {activeDomain.label}
                {activeItem !== null ? ` / ${activeItem.label}` : ''}
              </TopbarSubtitle>
            )}
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
                title="Chat isn’t available in this workspace right now — check your product entitlement or ask an owner for help."
                aria-label="New chat (unavailable)"
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
