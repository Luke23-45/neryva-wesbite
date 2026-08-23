import { Outlet } from '@tanstack/react-router';
import { StudioShell, type StudioNavGroup, type RecentChat } from '@/sections/pages/products/agent-studio/StudioShell';
import navData from '@neryva_data/products/agent_studio/nav.json';

type NavJson = {
  nav: StudioNavGroup[];
  user: { initials: string; name: string; tier: string; email: string };
  workspace: { name: string; plan: string };
  searchPlaceholder: string;
  recentChats: RecentChat[];
};

const data = navData as NavJson;

export default function AgentStudioShellPage() {
  return (
    <StudioShell
      nav={data.nav}
      user={data.user}
      workspace={data.workspace}
      searchPlaceholder={data.searchPlaceholder}
      recentChats={data.recentChats}
    >
      <Outlet />
    </StudioShell>
  );
}
