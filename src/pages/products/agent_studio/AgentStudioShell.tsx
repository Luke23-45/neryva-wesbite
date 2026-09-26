/**
 * The studio shell composition (frontend-engine-integration-plan F-2):
 * the static nav/copy still comes from `nav.json`, but identity is now the
 * real OP session (name/email via userinfo), the workspace title is the
 * active organization, recent chats are real conversations, and the shell
 * carries the platform-status strip, the entitlement banner, and the
 * step-up modal. The plan/tier labels stay static by design — how plans
 * render is a deferred decision (ledger D-1).
 */
import { Outlet } from '@tanstack/react-router';
import { StudioShell, type NavConfig } from '@/sections/pages/products/agent-studio/StudioShell';
import { SessionGate } from '@components/platform/SessionGate';
import { EntitlementBanner } from '@components/platform/Entitlement';
import { OrgSwitcher } from '@components/platform/OrgSwitcher';
import { StepUpModal } from '@components/platform/StepUpModal';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { useSessionStore } from '@lib/engine/auth';
import { useOrg } from '@/Context/OrgContext';
import { useConversations } from '@hooks/studio/useStudioConversations';
import { StatusBanner } from '@/sections/pages/products/agent-studio/StatusBanner';
import navData from '@neryva_data/products/agent_studio/nav.json';

type NavJson = {
  domains: NavConfig['domains'];
  user: { initials: string; name: string; tier: string; email: string };
  workspace: { name: string; plan: string };
  searchPlaceholder: string;
};

const data = navData as NavJson;
const navConfig: NavConfig = { domains: data.domains };

function initialsOf(name: string | null, email: string | null, fallback: string): string {
  const source = name?.trim() || email?.split('@')[0] || '';
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return fallback;
}

export default function AgentStudioShellPage() {
  const status = useSessionStore((s) => s.status);
  const account = useSessionStore((s) => s.account);
  const { orgId, name: orgName } = useOrg();

  // Recent chats (S-4): real conversations, newest first, sliced in the shell.
  // null keeps the sidebar quiet until the list resolves.
  const conversations = useConversations({ enabled: status === 'authenticated' });
  const recentChats = conversations.data
    ? conversations.data.slice(0, 5).map((c) => ({
        id: c.id,
        title: c.title,
        to: `/agent-studio/conversations?chat=${encodeURIComponent(c.id)}`,
        updatedAt: c.updatedAt,
      }))
    : null;

  const user = {
    initials: initialsOf(account?.name ?? null, account?.email ?? null, data.user.initials),
    name: account?.name ?? data.user.name,
    tier: data.user.tier, // D-1: plan display rendering is deferred
    email: account?.email ?? data.user.email,
  };
  const workspace = {
    name: orgName ?? data.workspace.name,
    plan: data.workspace.plan, // D-1: plan display rendering is deferred
  };

  if (status === 'authenticated' && !orgId) {
    // J1-05 (systemic D1-01): the ['org','home'] query has not resolved yet
    // (cold load / deep link / refresh lands here before org context does).
    // Studio pages read the active org during render — useOrgRequired()
    // throws "No active organization", and the router's error boundary is
    // sticky, so the crash was permanent until reload. Per-page guards would
    // just move the hole; this one gate sits above the <Outlet/> and covers
    // every /agent-studio/* route (chat, dashboard, agents, conversations,
    // activity, integrations, webhooks, settings/*). Skeletons — never the
    // outlet. The engine autocreates a personal org on first login, so a null
    // orgId here is only ever mid-propagation, never a real empty state.
    return (
      <SessionGate>
        <StudioShell
          nav={navConfig}
          user={user}
          workspace={workspace}
          searchPlaceholder={data.searchPlaceholder}
          recentChats={null}
          topbarOrg={<OrgSwitcher />}
          banner={
            <>
              <StatusBanner />
              <EntitlementBanner product="agent_studio" displayName="Agent Studio" />
            </>
          }
        >
          <div style={{ padding: 24, maxWidth: 1120 }}>
            <Skeleton $h="28px" $w="260px" />
            <div style={{ height: 16 }} />
            <Skeleton $h="180px" $r="12px" />
            <div style={{ height: 16 }} />
            <Skeleton $h="14px" />
            <Skeleton $h="14px" $w="70%" />
          </div>
        </StudioShell>
        <StepUpModal />
      </SessionGate>
    );
  }

  return (
    <SessionGate>
      <StudioShell
        nav={navConfig}
        user={user}
        workspace={workspace}
        searchPlaceholder={data.searchPlaceholder}
        recentChats={recentChats}
        topbarOrg={<OrgSwitcher />}
        banner={
          <>
            <StatusBanner />
            <EntitlementBanner product="agent_studio" displayName="Agent Studio" />
          </>
        }
      >
        <Outlet />
      </StudioShell>
      <StepUpModal />
    </SessionGate>
  );
}
