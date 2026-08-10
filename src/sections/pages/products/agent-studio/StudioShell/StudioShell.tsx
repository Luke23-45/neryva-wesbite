import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useMatchRoute } from '@tanstack/react-router';
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
} from 'lucide-react';

export type StudioNavItem = {
  label: string;
  to: string;
  icon: 'dashboard' | 'chat' | 'agents' | 'conversations' | 'integrations' | 'settings';
};

export type RecentChat = { id: string; title: string };

type Props = {
  nav: StudioNavItem[];
  user: { initials: string; name: string; tier: string; email: string };
  workspace: { name: string; plan: string };
  searchPlaceholder: string;
  recentChats: RecentChat[];
  children: ReactNode;
};

const iconMap = {
  dashboard: LayoutDashboard,
  chat: MessageSquare,
  agents: Bot,
  conversations: MessagesSquare,
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
  children,
}: Props) {
  const [query, setQuery] = useState('');
  const matchRoute = useMatchRoute();

  return (
    <ShellRoot>
      <ShellSidebar
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
              <RecentItem key={c.id}>
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
            <UpgradeButton
              as={motion.button}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.985 }}
            >
              Upgrade
            </UpgradeButton>
          </UpgradeCard>
        </SidebarFooter>
      </ShellSidebar>

      <ShellBody>
        <Topbar>
          <TopbarLeft>
            <TopbarTitle>{workspace.name}</TopbarTitle>
            <TopbarSubtitle aria-hidden="true">·</TopbarSubtitle>
            <TopbarSubtitle>Studio</TopbarSubtitle>
            <TopbarSearchHint>
              <SearchIcon size={11} strokeWidth={1.7} />
              Press / to search
            </TopbarSearchHint>
          </TopbarLeft>
          <TopbarRight>
            <IconAction as={Link} to="/agent-studio/chat" aria-label="New chat">
              <Plus size={15} strokeWidth={1.8} />
            </IconAction>
            <IconAction aria-label="Notifications">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M6 8a6 6 0 1112 0c0 7 3 8 3 8H3s3-1 3-8z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                <path d="M10 21a2 2 0 004 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </IconAction>
            <IconAction aria-label="Account">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.6" />
                <path d="M4 21a8 8 0 0116 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </IconAction>
          </TopbarRight>
        </Topbar>
        <ContentArea>{children}</ContentArea>
      </ShellBody>
    </ShellRoot>
  );
}
