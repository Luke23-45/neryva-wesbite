import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  UpgradeButton,
  ContentArea,
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
} from 'lucide-react';
import { NotificationsPopover } from '../NotificationsPopover';
import { AccountMenu } from '../AccountMenu';
import { ChatHeader } from '../chat/ChatHeader';
import { UpgradeModal } from '../UpgradeModal';

export type StudioNavItem = {
  label: string;
  to: string;
  icon: 'dashboard' | 'chat' | 'agents' | 'conversations' | 'activity' | 'integrations' | 'settings';
};

export type RecentChat = { id: string; title: string };

type Props = {
  nav: StudioNavItem[];
  user: { initials: string; name: string; tier: string; email: string };
  workspace: { name: string; plan: string };
  searchPlaceholder: string;
  recentChats: RecentChat[];
  topbarExtra?: ReactNode;
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
} as const;

const premiumEase = [0.16, 1, 0.3, 1] as const;

export function StudioShell({
  nav,
  user,
  workspace,
  searchPlaceholder,
  recentChats,
  topbarExtra,
  children,
}: Props) {
  const [query, setQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const matchRoute = useMatchRoute();
  const location = useLocation();
  const onChat = location.pathname === '/agent-studio/chat' || location.pathname.startsWith('/agent-studio/chat/');

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
          <RecentLabel>Recent chats</RecentLabel>
          {recentChats
            .filter((c) => c.title.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 6)
            .map((c) => (
              <RecentItem
                key={c.id}
                onClick={() => setMobileOpen(false)}
              >
                <Link
                  to="/agent-studio/chat"
                  style={{ display: 'block', width: '100%' }}
                >
                  {c.title}
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
            <TopbarTitle>{workspace.name}</TopbarTitle>
            <TopbarSubtitle aria-hidden="true">·</TopbarSubtitle>
            <TopbarSubtitle>Studio</TopbarSubtitle>
            {topbarExtra ?? (onChat ? <ChatHeader /> : null)}
            <TopbarSearchHint>
              <SearchIcon size={11} strokeWidth={1.7} />
              Press / to search
            </TopbarSearchHint>
          </TopbarLeft>
          <TopbarRight>
            <IconAction as={Link} to="/agent-studio/chat" aria-label="New chat">
              <Plus size={15} strokeWidth={1.8} />
            </IconAction>
            <NotificationsPopover />
            <AccountMenu user={user} workspace={workspace} />
          </TopbarRight>
        </Topbar>
        <ContentArea>{children}</ContentArea>
      </ShellBody>
    </ShellRoot>
  );
}
