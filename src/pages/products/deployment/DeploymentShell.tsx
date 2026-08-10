import { Outlet } from '@tanstack/react-router';
import { DeployShell, type DeployNavItem, type RecentPipeline } from '@/sections/pages/products/deployment/DeployShell';
import navData from '@neryva_data/products/deployment/nav.json';

type NavJson = {
  nav: DeployNavItem[];
  user: { initials: string; name: string; tier: string; email: string };
  workspace: { name: string; plan: string };
  searchPlaceholder: string;
  recentPipelines: RecentPipeline[];
};

const data = navData as NavJson;

export default function DeploymentShellPage() {
  return (
    <DeployShell
      nav={data.nav}
      user={data.user}
      workspace={data.workspace}
      searchPlaceholder={data.searchPlaceholder}
      recentPipelines={data.recentPipelines}
    >
      <Outlet />
    </DeployShell>
  );
}
