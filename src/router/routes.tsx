import { lazy } from 'react';
import { createRoute, redirect } from '@tanstack/react-router';
import { rootRoute } from './root';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';

// Pages
import HomePage from '@pages/home/HomePage';
import ResearchPage from '@pages/research/ResearchPage';
import BlogPage from '@pages/resources/blog/BlogPage';
import AboutPage from '@pages/company/about/AboutPage';
import CareersPage from '@pages/company/careers/CareersPage';
import BlogDetailPage from '@pages/resources/blog/BlogDetailPage';
import EventsPage from '@pages/resources/events/EventsPage';
import ContactPage from '@pages/company/contact/ContactPage';
import EnterpriseAiAssistantPage from '@pages/products/enterprise_ai_assistant/EnterpriseAiAssistantPage';
import AiEfficiencyDeploymentPage from '@pages/products/ai_efficiency_deployment/AiEfficiencyDeploymentPage';
import SolutionsPage from '@pages/solutions/SolutionsPage';
import AuthPage from '@pages/auth/AuthPage';
import ResetPasswordPage from '@pages/auth/ResetPasswordPage';
import VerifyEmailPage from '@pages/auth/VerifyEmailPage';

// Platform console (engine-backed) — /platform/**
import PlatformShell from '@pages/platform/PlatformShell';
import AuthCallbackPage from '@pages/platform/AuthCallbackPage';
import WelcomePage from '@pages/platform/WelcomePage';
import InvitePage from '@pages/platform/InvitePage';
import ConnectorsOAuthPage from '@pages/platform/ConnectorsOAuthPage';
import PlatformHomePage from '@pages/platform/PlatformHomePage';
import OrgMembersPage from '@pages/platform/OrgMembersPage';
import ProjectsPage from '@pages/platform/ProjectsPage';
import ApiKeysPage from '@pages/platform/ApiKeysPage';
import { UsagePage, BillingPage } from '@pages/platform/UsageBillingPages';
import AuditPage from '@pages/platform/AuditPage';
import OrgSettingsPage from '@pages/platform/OrgSettingsPage';
import StatusPage from '@pages/platform/StatusPage';

// Agent Studio app shell (auth-gated) — uses the existing ChatWorkspace internally
import AgentStudioShell from '@pages/products/agent_studio/AgentStudioShell';
import AgentStudioChatPage from '@pages/products/agent_studio/AgentStudioChatPage';
import AgentStudioDashboardPage from '@pages/products/agent_studio/AgentStudioDashboardPage';
import AgentStudioAgentsPage, {
  AgentStudioAgentsLayout,
} from '@pages/products/agent_studio/AgentStudioAgentsPage';
import AgentStudioAgentsOverviewPage from '@pages/products/agent_studio/AgentStudioAgentsOverviewPage';
import AgentStudioAgentDetailPage from '@pages/products/agent_studio/AgentStudioAgentDetailPage';
import AgentStudioAgentEditPage from '@pages/products/agent_studio/AgentStudioAgentEditPage';
import AgentStudioAgentBuilderNewPage from '@pages/products/agent_studio/AgentStudioAgentBuilderNewPage';
import AgentStudioAgentBuilderPage from '@pages/products/agent_studio/AgentStudioAgentBuilderPage';
import AgentStudioAgentsBlockNewPage from '@pages/products/agent_studio/AgentStudioAgentsBlockNewPage';
import AgentStudioAgentsVersionImportPage from '@pages/products/agent_studio/AgentStudioAgentsVersionImportPage';
import AgentStudioAgentsRollbackPage from '@pages/products/agent_studio/AgentStudioAgentsRollbackPage';
import AgentStudioAgentsClonePage from '@pages/products/agent_studio/AgentStudioAgentsClonePage';
import AgentStudioComplianceExportsNewPage from '@pages/products/agent_studio/AgentStudioComplianceExportsNewPage';
import AgentStudioComplianceHoldsNewPage from '@pages/products/agent_studio/AgentStudioComplianceHoldsNewPage';
import AgentStudioCompliancePurgesNewPage from '@pages/products/agent_studio/AgentStudioCompliancePurgesNewPage';
import AgentStudioTemplatesInstallPage from '@pages/products/agent_studio/AgentStudioTemplatesInstallPage';
import AgentStudioTemplatesDetailPage from '@pages/products/agent_studio/AgentStudioTemplatesDetailPage';
import AgentStudioConversationsPage from '@pages/products/agent_studio/AgentStudioConversationsPage';
import AgentStudioActivityPage from '@pages/products/agent_studio/AgentStudioActivityPage';
import AgentStudioIntegrationsPage, { AgentStudioIntegrationsLayout } from '@pages/products/agent_studio/AgentStudioIntegrationsPage';
import AgentStudioIntegrationsLinkPage from '@pages/products/agent_studio/AgentStudioIntegrationsLinkPage';
import AgentStudioIntegrationsOAuthAppNewPage from '@pages/products/agent_studio/AgentStudioIntegrationsOAuthAppNewPage';
import AgentStudioWebhooksPage, { AgentStudioWebhooksLayout } from '@pages/products/agent_studio/AgentStudioWebhooksPage';
import AgentStudioWebhooksNewPage from '@pages/products/agent_studio/AgentStudioWebhooksNewPage';
import AgentStudioWebhooksEditPage from '@pages/products/agent_studio/AgentStudioWebhooksEditPage';
import AgentStudioSettingsIndexPage from '@pages/products/agent_studio/AgentStudioSettingsIndexPage';
import AgentStudioSettingsProfilePage from '@pages/products/agent_studio/AgentStudioSettingsProfilePage';
import AgentStudioSettingsWorkspacePage from '@pages/products/agent_studio/AgentStudioSettingsWorkspacePage';
import AgentStudioSettingsTeamPage from '@pages/products/agent_studio/AgentStudioSettingsTeamPage';
import AgentStudioSettingsBillingPage from '@pages/products/agent_studio/AgentStudioSettingsBillingPage';
import AgentStudioSettingsPricingPage from '@pages/products/agent_studio/AgentStudioSettingsPricingPage';
import AgentStudioSettingsSecurityPage from '@pages/products/agent_studio/AgentStudioSettingsSecurityPage';
import AgentStudioSettingsApiKeysPage from '@pages/products/agent_studio/AgentStudioSettingsApiKeysPage';
import AgentStudioSettingsApiKeyNewPage from '@pages/products/agent_studio/AgentStudioSettingsApiKeyNewPage';
import AgentStudioSettingsTwoFactorSetupPage from '@pages/products/agent_studio/AgentStudioSettingsTwoFactorSetupPage';
import AgentStudioKnowledgePage from '@pages/products/agent_studio/AgentStudioKnowledgePage';
import AgentStudioKnowledgeUploadPage, {
  AgentStudioKnowledgeLayout,
} from '@pages/products/agent_studio/AgentStudioKnowledgeUploadPage';
import AgentStudioKnowledgeVersionUploadPage from '@pages/products/agent_studio/AgentStudioKnowledgeVersionUploadPage';
import AgentStudioKnowledgePreviewPage from '@pages/products/agent_studio/AgentStudioKnowledgePreviewPage';
import AgentStudioKnowledgeStoragePage from '@pages/products/agent_studio/AgentStudioKnowledgeStoragePage';
import AgentStudioKnowledgeUsagePage from '@pages/products/agent_studio/AgentStudioKnowledgeUsagePage';
import AgentStudioKnowledgeHealthPage from '@pages/products/agent_studio/AgentStudioKnowledgeHealthPage';
import AgentStudioKnowledgeScopesPage from '@pages/products/agent_studio/AgentStudioKnowledgeScopesPage';
import AgentStudioKnowledgeScopeNewPage from '@pages/products/agent_studio/AgentStudioKnowledgeScopeNewPage';
import AgentStudioKnowledgeScopeEditPage from '@pages/products/agent_studio/AgentStudioKnowledgeScopeEditPage';
import AgentStudioKnowledgeScopeSimulatePage from '@pages/products/agent_studio/AgentStudioKnowledgeScopeSimulatePage';
import AgentStudioKnowledgeDiagnosticsPage from '@pages/products/agent_studio/AgentStudioKnowledgeDiagnosticsPage';
import AgentStudioKnowledgeCuratePage from '@pages/products/agent_studio/AgentStudioKnowledgeCuratePage';
import AgentStudioKnowledgeEvalPage from '@pages/products/agent_studio/AgentStudioKnowledgeEvalPage';
import AgentStudioKnowledgeEvalDatasetPage from '@pages/products/agent_studio/AgentStudioKnowledgeEvalDatasetPage';
import AgentStudioKnowledgeRecallGapsPage from '@pages/products/agent_studio/AgentStudioKnowledgeRecallGapsPage';
import AgentStudioKnowledgeRecommendationsPage from '@pages/products/agent_studio/AgentStudioKnowledgeRecommendationsPage';
import AgentStudioProvidersCatalogPage from '@pages/products/agent_studio/AgentStudioProvidersCatalogPage';
import AgentStudioProvidersMyProvidersPage from '@pages/products/agent_studio/AgentStudioProvidersMyProvidersPage';
import AgentStudioProvidersModelsPage from '@pages/products/agent_studio/AgentStudioProvidersModelsPage';
import AgentStudioProvidersSpendPage from '@pages/products/agent_studio/AgentStudioProvidersSpendPage';
import AgentStudioProvidersCustomPage from '@pages/products/agent_studio/AgentStudioProvidersCustomPage';
import AgentStudioToolsPage, { AgentStudioToolsLayout } from '@pages/products/agent_studio/AgentStudioToolsPage';
import AgentStudioToolsNewPage from '@pages/products/agent_studio/AgentStudioToolsNewPage';
import AgentStudioToolsEditPage from '@pages/products/agent_studio/AgentStudioToolsEditPage';
import AgentStudioToolsInstantiatePage from '@pages/products/agent_studio/AgentStudioToolsInstantiatePage';
import AgentStudioMemoryPage, { AgentStudioMemoryLayout } from '@pages/products/agent_studio/AgentStudioMemoryPage';
import AgentStudioDatasetsPage from '@pages/products/agent_studio/AgentStudioDatasetsPage';
import AgentStudioBlocksPage, { AgentStudioBlocksLayout } from '@pages/products/agent_studio/AgentStudioBlocksPage';
import AgentStudioLibrariesBlocksNewPage from '@pages/products/agent_studio/AgentStudioLibrariesBlocksNewPage';
import AgentStudioLibrariesMemoryNewPage from '@pages/products/agent_studio/AgentStudioLibrariesMemoryNewPage';
import AgentStudioLibrariesMemoryDetailPage from '@pages/products/agent_studio/AgentStudioLibrariesMemoryDetailPage';
import AgentStudioLibrariesMemoryEditPage from '@pages/products/agent_studio/AgentStudioLibrariesMemoryEditPage';
import AgentStudioLibrariesMemoryTimelinePage from '@pages/products/agent_studio/AgentStudioLibrariesMemoryTimelinePage';
import AgentStudioChannelsPage, { AgentStudioChannelsLayout } from '@pages/products/agent_studio/AgentStudioChannelsPage';
import AgentStudioChannelsConnectPage from '@pages/products/agent_studio/AgentStudioChannelsConnectPage';
import AgentStudioChannelsDetailPage from '@pages/products/agent_studio/AgentStudioChannelsDetailPage';
import AgentStudioChannelsWebhookSetupPage from '@pages/products/agent_studio/AgentStudioChannelsWebhookSetupPage';
import AgentStudioApprovalsPage from '@pages/products/agent_studio/AgentStudioApprovalsPage';
import AgentStudioAnalyticsPage from '@pages/products/agent_studio/AgentStudioAnalyticsPage';
import AgentStudioCompliancePage, {
  AgentStudioComplianceLayout,
} from '@pages/products/agent_studio/AgentStudioCompliancePage';
import AgentStudioTemplatesPage, {
  AgentStudioTemplatesLayout,
} from '@pages/products/agent_studio/AgentStudioTemplatesPage';
import AgentStudioApiPage from '@pages/products/agent_studio/AgentStudioApiPage';
import AgentStudioTeamsPage, { AgentStudioTeamsLayout } from '@pages/products/agent_studio/AgentStudioTeamsPage';
import AgentStudioTeamsInvitePage from '@pages/products/agent_studio/AgentStudioTeamsInvitePage';
import AgentStudioTeamsGroupNewPage from '@pages/products/agent_studio/AgentStudioTeamsGroupNewPage';
import AgentStudioTeamsServiceAccountNewPage from '@pages/products/agent_studio/AgentStudioTeamsServiceAccountNewPage';
import AgentStudioUsagePage from '@pages/products/agent_studio/AgentStudioUsagePage';
import AgentStudioEvaluationsPage, { AgentStudioEvaluationsLayout } from '@pages/products/agent_studio/AgentStudioEvaluationsPage';
import AgentStudioEvaluationsCasesNewPage from '@pages/products/agent_studio/AgentStudioEvaluationsCasesNewPage';
import AgentStudioEvaluationsDatasetNewPage from '@pages/products/agent_studio/AgentStudioEvaluationsDatasetNewPage';
import AgentStudioEvaluationsRunNewPage from '@pages/products/agent_studio/AgentStudioEvaluationsRunNewPage';
import AgentStudioEvaluationsDatasetCasesPage from '@pages/products/agent_studio/AgentStudioEvaluationsDatasetCasesPage';

// NOTE (parked): the /deployment app shell lives unrouted under
// `src/future/deployment/` — reference template, no approved architecture
// yet. Its ~25 routes were removed here; re-add them from the parked tree
// when the product is rebuilt (see src/future/deployment/README.md).

import { requireEngineSession, requireOnboardedSession } from '@lib/engine/session-gate';

// Lazy-loaded secret page (separate JS chunk)
const SecretPage = lazy(() => import('@pages/secret/SecretPage'));

// ─── Routes ────────────────────────────────────────────

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
});

export const researchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/research',
  component: ResearchPage,
});

export const blogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/resources/blog',
  component: BlogPage,
});

export const blogDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/resources/blog/$slug',
  component: BlogDetailPage,
});

export const eventsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/resources/events',
  component: EventsPage,
});

export const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/company/about',
  component: AboutPage,
});

export const careersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/company/careers',
  component: CareersPage,
});

export const contactRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/contact',
  component: ContactPage,
});

export const enterpriseAiAssistantRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/products/neryva-agent-studio',
  component: EnterpriseAiAssistantPage,
});

export const aiEfficiencyDeploymentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/products/ai-deployment',
  component: AiEfficiencyDeploymentPage,
});

export const solutionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/solutions',
  component: SolutionsPage,
});

// ── Platform console (/platform) — the engine-backed area ──────────────────

export const authCallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/platform/auth/callback',
  component: AuthCallbackPage,
});

// First-run welcome (ledger F1): top-level so it owns its session logic —
// never under a guarded shell. Accepts the post-continue target as ?return=.
export const welcomeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/platform/welcome',
  validateSearch: (search: Record<string, unknown>) => ({
    return: typeof search.return === 'string' ? search.return : undefined,
  }),
  component: WelcomePage,
});

// Invite acceptance (ledger F2): top-level AND public-shell — anonymous
// visitors must see the invite preview before signing in, so guarded shells
// (and their sign-in cards) must never wrap it. The engine emails exactly
// this shape: /platform/invites/:inviteId?token= (token in body on API calls).
export const inviteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/platform/invites/$inviteId',
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === 'string' ? search.token : undefined,
  }),
  component: InvitePage,
});

// Connector OAuth landing (team_setup_ledger.md F-A8): the engine's public
// callback 302s to /platform/org/:orgId/connectors?oauth= — top-level like
// the invite page, since the provider redirects an anonymous browser here.
// It adopts the callback org and hands off to the connectors surface.
export const connectorsOAuthRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/platform/org/$orgId/connectors',
  validateSearch: (search: Record<string, unknown>) => ({
    oauth: typeof search.oauth === 'string' ? search.oauth : undefined,
    account: typeof search.account === 'string' ? search.account : undefined,
  }),
  component: ConnectorsOAuthPage,
});

// The console area. Guarded by the ONBOARDING gate only: anonymous visitors
// are PlatformShell's business (it renders the sign-in card), while an
// authenticated account that still owes /platform/welcome is redirected there
// with its deep link preserved (F1-7). /platform/welcome, /platform/invites/*
// and the OP callback are top-level routes, so this can never self-redirect.
export const platformRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/platform',
  beforeLoad: () => requireOnboardedSession(),
  component: PlatformShell,
});

export const platformIndexRoute = createRoute({
  getParentRoute: () => platformRoute,
  path: '/',
  component: PlatformHomePage,
});

export const platformMembersRoute = createRoute({
  getParentRoute: () => platformRoute,
  path: '/organization/members',
  component: OrgMembersPage,
});

export const platformProjectsRoute = createRoute({
  getParentRoute: () => platformRoute,
  path: '/projects',
  component: ProjectsPage,
});

export const platformApiKeysRoute = createRoute({
  getParentRoute: () => platformRoute,
  path: '/api-keys',
  component: ApiKeysPage,
});

export const platformUsageRoute = createRoute({
  getParentRoute: () => platformRoute,
  path: '/usage',
  component: UsagePage,
});

export const platformBillingRoute = createRoute({
  getParentRoute: () => platformRoute,
  path: '/billing',
  component: BillingPage,
});

export const platformAuditRoute = createRoute({
  getParentRoute: () => platformRoute,
  path: '/audit',
  component: AuditPage,
});

export const platformSettingsRoute = createRoute({
  getParentRoute: () => platformRoute,
  path: '/settings',
  component: OrgSettingsPage,
});

export const platformStatusRoute = createRoute({
  getParentRoute: () => platformRoute,
  path: '/status',
  component: StatusPage,
});

export const secretRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/secret',
  component: SecretPage,
});

export const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth',
  component: AuthPage,
});

// Password reset (P1-06): top-level AND public-shell — anonymous visitors
// follow emailed links here, so guarded shells (and their sign-in cards)
// must never wrap it. Without ?token= it renders the reset-request form
// (the /auth "Forgot password?" entry point targets this); with
// ?token=<action-token> it renders the set-new-password form. The token
// travels in the POST body only — validateSearch just makes it readable.
export const resetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reset-password',
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === 'string' ? search.token : undefined,
  }),
  component: ResetPasswordPage,
});

// Email verification (P1-06, same bug class): the engine emails
// /verify-email?token=<action-token> — anonymous, top-level, same rules as
// the reset route above.
export const verifyEmailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/verify-email',
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === 'string' ? search.token : undefined,
  }),
  component: VerifyEmailPage,
});

// ─── Agent Studio (auth-gated app shell) ────────────────
//
// All routes share a single dark chrome via the <AgentStudioShell/> layout
// which renders the sidebar/topbar and an <Outlet/> for the page.

/**
 * P1 flow-chrome: shown while the shell's async beforeLoad gate runs. A
 * cold unauthenticated load spends the silent-auth iframe window (up to
 * ~12s on a dead session) inside requireEngineSession — with no pending UI
 * the shell sat on a blank white page until the /auth redirect fired. Same
 * skeleton the SessionGate renders while the session is unknown: loading
 * chrome in the gate window, never blank.
 */
function AgentStudioGatePending() {
  return (
    <div style={{ padding: 24, maxWidth: 720 }} aria-label="Loading agent studio">
      <Skeleton $h="22px" $w="240px" />
      <Skeleton $h="14px" />
      <Skeleton $h="14px" $w="70%" />
    </div>
  );
}

export const agentStudioRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/agent-studio',
  beforeLoad: async () => {
    // Session first (anonymous → branded /auth), then the first-run gate
    // (F1-7): an account that still owes /platform/welcome lands there with
    // this deep link preserved as ?return=.
    await requireEngineSession();
    await requireOnboardedSession();
  },
  pendingComponent: AgentStudioGatePending,
  component: AgentStudioShell,
});

export const agentStudioIndexRoute = createRoute({
  getParentRoute: () => agentStudioRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/agent-studio/chat' });
  },
  component: () => null,
});

export const agentStudioChatRoute = createRoute({
  getParentRoute: () => agentStudioRoute,
  path: '/chat',
  component: AgentStudioChatPage,
});

export const agentStudioDashboardRoute = createRoute({
  getParentRoute: () => agentStudioRoute,
  path: '/dashboard',
  component: AgentStudioDashboardPage,
});

export const agentStudioAgentsRoute = createRoute({
  getParentRoute: () => agentStudioRoute,
  path: '/agents',
  component: AgentStudioAgentsLayout,
});

// Index: the agents list. Child routes (detail/edit/build/new/overview)
// render through the layout's <Outlet/> (A2-20).
export const agentStudioAgentsIndexRoute = createRoute({
  getParentRoute: () => agentStudioAgentsRoute,
  path: '/',
  component: AgentStudioAgentsPage,
});

// The detail page is five intent-grouped tabs (1.23). The tab is local
// state, not a search param on purpose: declaring `validateSearch` on this
// route makes TanStack require `search` on every sibling/child in the
// branch (/agents/new, /$agentId/build, …) and that regression is not worth
// linkable tabs. Deep-linkable tabs need validateSearch across the whole
// /agent-studio branch first.
export const agentStudioAgentDetailRoute = createRoute({
  getParentRoute: () => agentStudioAgentsRoute,
  path: '/$agentId',
  component: AgentStudioAgentDetailPage,
});

export const agentStudioAgentEditRoute = createRoute({
  getParentRoute: () => agentStudioAgentsRoute,
  path: '/$agentId/edit',
  component: AgentStudioAgentEditPage,
});

// Governance: set a control block on an agent (A-11). Static tail segments
// win over the `/$agentId` dynamic sibling, so /block/new never resolves
// as an agent id.
export const agentStudioAgentBlockNewRoute = createRoute({
  getParentRoute: () => agentStudioAgentsRoute,
  path: '/$agentId/block/new',
  component: AgentStudioAgentsBlockNewPage,
});

// Governance: import an agent definition (A-13).
export const agentStudioAgentVersionImportRoute = createRoute({
  getParentRoute: () => agentStudioAgentsRoute,
  path: '/$agentId/versions/import',
  component: AgentStudioAgentsVersionImportPage,
});

// Governance: roll back to a prior agent version (A-14).
export const agentStudioAgentRollbackRoute = createRoute({
  getParentRoute: () => agentStudioAgentsRoute,
  path: '/$agentId/versions/rollback',
  component: AgentStudioAgentsRollbackPage,
});

// Builder entry (BUILD_PLAN.md §B): static segment wins over the
// `/$agentId` dynamic sibling, so /new never resolves as an id.
  export const agentStudioAgentsNewRoute = createRoute({
    getParentRoute: () => agentStudioAgentsRoute,
    path: '/new',
    validateSearch: (search: Record<string, unknown>) => ({
      // Edit-through-create: ?edit=<assistantId> reopens this page
      // prefilled with the agent's identity; saving updates (PATCH)
      // instead of creating. Absent = blank creation.
      edit: typeof search.edit === 'string' ? search.edit : undefined,
    }),
    component: AgentStudioAgentBuilderNewPage,
  });

export const agentStudioAgentBuildRoute = createRoute({
  getParentRoute: () => agentStudioAgentsRoute,
  path: '/$agentId/build',
  // C15 operate re-entry: ?slot=<spine-or-kind> resumes the builder on a
  // slot (unknown values are ignored, never an error).
  // Guided setup flow: ?setup=1 continues the post-creation walkthrough
  // (Back / Continue stepper in the bottom bar).
  validateSearch: (search: Record<string, unknown>) => ({
    slot: typeof search.slot === 'string' ? search.slot : undefined,
    setup: search.setup === '1' ? '1' : undefined,
  }),
  component: AgentStudioAgentBuilderPage,
});

// Agents Overview (SIDEBAR_LEDGER.md P2): static child — static segments win
// over the `/$agentId` dynamic sibling, so /overview never resolves as an id.
export const agentStudioAgentsOverviewRoute = createRoute({
  getParentRoute: () => agentStudioAgentsRoute,
  path: '/overview',
  component: AgentStudioAgentsOverviewPage,
});

// Clone an agent from the list, detail, or builder origin (Phase 3
// zero-content-modals). Static /clone wins over the `/$agentId` dynamic
// sibling, so /clone never resolves as an id.
export const agentStudioAgentsCloneRoute = createRoute({
  getParentRoute: () => agentStudioAgentsRoute,
  path: '/clone',
  validateSearch: (search: Record<string, unknown>) => ({
    sourceId: typeof search.sourceId === 'string' ? search.sourceId : undefined,
    returnTo: typeof search.returnTo === 'string' ? search.returnTo : undefined,
  }),
  component: AgentStudioAgentsClonePage,
});

export const agentStudioConversationsRoute = createRoute({
  getParentRoute: () => agentStudioRoute,
  path: '/conversations',
  component: AgentStudioConversationsPage,
});

export const agentStudioActivityRoute = createRoute({
  getParentRoute: () => agentStudioRoute,
  path: '/activity',
  component: AgentStudioActivityPage,
});

export const agentStudioIntegrationsRoute = createRoute({
  getParentRoute: () => agentStudioRoute,
  path: '/integrations',
  component: AgentStudioIntegrationsLayout,
});

export const agentStudioIntegrationsIndexRoute = createRoute({
  getParentRoute: () => agentStudioIntegrationsRoute,
  path: '/',
  component: AgentStudioIntegrationsPage,
});

export const agentStudioIntegrationsLinkRoute = createRoute({
  getParentRoute: () => agentStudioIntegrationsRoute,
  path: '/link/$provider',
  component: AgentStudioIntegrationsLinkPage,
});

export const agentStudioIntegrationsOAuthAppNewRoute = createRoute({
  getParentRoute: () => agentStudioIntegrationsRoute,
  path: '/oauth-apps/new',
  component: AgentStudioIntegrationsOAuthAppNewPage,
});

export const agentStudioWebhooksRoute = createRoute({
  getParentRoute: () => agentStudioIntegrationsRoute,
  path: '/webhooks',
  component: AgentStudioWebhooksLayout,
});

export const agentStudioWebhooksIndexRoute = createRoute({
  getParentRoute: () => agentStudioWebhooksRoute,
  path: '/',
  component: AgentStudioWebhooksPage,
});

// Webhook create/edit as dedicated sections (Phase 3 zero-content-modals).
export const agentStudioWebhooksNewRoute = createRoute({
  getParentRoute: () => agentStudioWebhooksRoute,
  path: '/new',
  component: AgentStudioWebhooksNewPage,
});

export const agentStudioWebhooksEditRoute = createRoute({
  getParentRoute: () => agentStudioWebhooksRoute,
  path: '/$webhookId/edit',
  component: AgentStudioWebhooksEditPage,
});

export const agentStudioSettingsRoute = createRoute({
  getParentRoute: () => agentStudioRoute,
  path: '/settings',
  component: AgentStudioSettingsIndexPage,
});

export const agentStudioSettingsIndexRoute = createRoute({
  getParentRoute: () => agentStudioSettingsRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/agent-studio/settings/profile' });
  },
  component: () => null,
});

export const agentStudioSettingsProfileRoute = createRoute({
  getParentRoute: () => agentStudioSettingsRoute,
  path: '/profile',
  component: AgentStudioSettingsProfilePage,
});

export const agentStudioSettingsWorkspaceRoute = createRoute({
  getParentRoute: () => agentStudioSettingsRoute,
  path: '/workspace',
  component: AgentStudioSettingsWorkspacePage,
});

export const agentStudioSettingsTeamRoute = createRoute({
  getParentRoute: () => agentStudioSettingsRoute,
  path: '/team',
  component: AgentStudioSettingsTeamPage,
});

export const agentStudioSettingsBillingRoute = createRoute({
  getParentRoute: () => agentStudioSettingsRoute,
  path: '/billing',
  component: AgentStudioSettingsBillingPage,
});

export const agentStudioSettingsPricingRoute = createRoute({
  getParentRoute: () => agentStudioSettingsRoute,
  path: '/pricing',
  component: AgentStudioSettingsPricingPage,
});

export const agentStudioSettingsSecurityRoute = createRoute({
  getParentRoute: () => agentStudioSettingsRoute,
  path: '/security',
  component: AgentStudioSettingsSecurityPage,
});

export const agentStudioSettingsApiKeysRoute = createRoute({
  getParentRoute: () => agentStudioSettingsRoute,
  path: '/api-keys',
  component: AgentStudioSettingsApiKeysPage,
});

export const agentStudioSettingsApiKeyNewRoute = createRoute({
  getParentRoute: () => agentStudioSettingsRoute,
  path: '/api-keys/new',
  component: AgentStudioSettingsApiKeyNewPage,
});

export const agentStudioSettingsTwoFactorSetupRoute = createRoute({
  getParentRoute: () => agentStudioSettingsRoute,
  path: '/security/two-factor/setup',
  component: AgentStudioSettingsTwoFactorSetupPage,
});

export const agentStudioKnowledgeRoute = createRoute({
  getParentRoute: () => agentStudioRoute,
  path: '/knowledge',
  component: AgentStudioKnowledgeLayout,
});

export const agentStudioKnowledgeIndexRoute = createRoute({
  getParentRoute: () => agentStudioKnowledgeRoute,
  path: '/',
  component: AgentStudioKnowledgePage,
});

export const agentStudioKnowledgeUploadRoute = createRoute({
  getParentRoute: () => agentStudioKnowledgeRoute,
  path: '/upload',
  component: AgentStudioKnowledgeUploadPage,
});

// Document version upload as a dedicated section (Phase 3
// zero-content-modals).
export const agentStudioKnowledgeVersionUploadRoute = createRoute({
  getParentRoute: () => agentStudioKnowledgeRoute,
  path: '/$docId/versions/upload',
  component: AgentStudioKnowledgeVersionUploadPage,
});

// Document preview as a dedicated section (Phase 3 zero-content-modals).
export const agentStudioKnowledgePreviewRoute = createRoute({
  getParentRoute: () => agentStudioKnowledgeRoute,
  path: '/$docId/preview',
  component: AgentStudioKnowledgePreviewPage,
});

export const agentStudioKnowledgeStorageRoute = createRoute({
  getParentRoute: () => agentStudioKnowledgeRoute,
  path: '/storage',
  component: AgentStudioKnowledgeStoragePage,
});

export const agentStudioKnowledgeUsageRoute = createRoute({
  getParentRoute: () => agentStudioKnowledgeRoute,
  path: '/usage',
  component: AgentStudioKnowledgeUsagePage,
});

export const agentStudioKnowledgeHealthRoute = createRoute({
  getParentRoute: () => agentStudioKnowledgeRoute,
  path: '/health',
  component: AgentStudioKnowledgeHealthPage,
});

// Knowledge scopes — list, builder, simulator (dedicated pages, no tabs).
export const agentStudioKnowledgeScopesRoute = createRoute({
  getParentRoute: () => agentStudioKnowledgeRoute,
  path: '/scopes',
  component: AgentStudioKnowledgeScopesPage,
});

export const agentStudioKnowledgeScopeNewRoute = createRoute({
  getParentRoute: () => agentStudioKnowledgeRoute,
  path: '/scopes/new',
  component: AgentStudioKnowledgeScopeNewPage,
});

export const agentStudioKnowledgeScopeEditRoute = createRoute({
  getParentRoute: () => agentStudioKnowledgeRoute,
  path: '/scopes/$slug/edit',
  component: AgentStudioKnowledgeScopeEditPage,
});

export const agentStudioKnowledgeScopeSimulateRoute = createRoute({
  getParentRoute: () => agentStudioKnowledgeRoute,
  path: '/scopes/$slug/simulate',
  component: AgentStudioKnowledgeScopeSimulatePage,
});

export const agentStudioKnowledgeDiagnosticsRoute = createRoute({
  getParentRoute: () => agentStudioKnowledgeRoute,
  path: '/$docId/diagnostics',
  component: AgentStudioKnowledgeDiagnosticsPage,
});

export const agentStudioKnowledgeCurateRoute = createRoute({
  getParentRoute: () => agentStudioKnowledgeRoute,
  path: '/$docId/curate',
  component: AgentStudioKnowledgeCuratePage,
});

export const agentStudioKnowledgeEvalRoute = createRoute({
  getParentRoute: () => agentStudioKnowledgeRoute,
  path: '/eval',
  component: AgentStudioKnowledgeEvalPage,
});

export const agentStudioKnowledgeEvalDatasetRoute = createRoute({
  getParentRoute: () => agentStudioKnowledgeRoute,
  path: '/eval/$datasetId',
  component: AgentStudioKnowledgeEvalDatasetPage,
});

export const agentStudioKnowledgeRecallGapsRoute = createRoute({
  getParentRoute: () => agentStudioKnowledgeRoute,
  path: '/recall-gaps',
  component: AgentStudioKnowledgeRecallGapsPage,
});

export const agentStudioKnowledgeRecommendationsRoute = createRoute({
  getParentRoute: () => agentStudioKnowledgeRoute,
  path: '/recommendations',
  component: AgentStudioKnowledgeRecommendationsPage,
});

// Old Models surface (B8 kill-switch, Phase 5): the three legacy routes are
// redirects into the routed providers surface. Builder/agents-detail links
// that still point at the old paths land here and are forwarded.
export const agentStudioModelsRoute = createRoute({
  getParentRoute: () => agentStudioRoute,
  path: '/models',
  beforeLoad: () => {
    throw redirect({ to: '/agent-studio/providers/models' });
  },
  component: () => null,
});

export const agentStudioModelsCredentialsNewRoute = createRoute({
  getParentRoute: () => agentStudioRoute,
  path: '/models/credentials/new',
  beforeLoad: () => {
    throw redirect({ to: '/agent-studio/providers/my-providers' });
  },
  component: () => null,
});

export const agentStudioModelsCredentialsRotateRoute = createRoute({
  getParentRoute: () => agentStudioRoute,
  path: '/models/credentials/$credentialId/rotate',
  beforeLoad: () => {
    throw redirect({ to: '/agent-studio/providers/my-providers' });
  },
  component: () => null,
});

// Providers (routed, no tabs): each subsection is a dedicated page —
// catalog, my-providers, models, spend — all direct children of
// agentStudioRoute (no layout); each page is self-contained; the custom
// form is a dedicated full page, never a modal.
export const agentStudioProvidersRoute = createRoute({
  getParentRoute: () => agentStudioRoute,
  path: '/providers',
  beforeLoad: ({ search }) => {
    // Forward the query string — the builder's ModelPicker deep-links here
    // with ?returnTo, and the catalog page honors it.
    throw redirect({ to: '/agent-studio/providers/catalog', search });
  },
  component: () => null,
});

export const agentStudioProvidersCatalogRoute = createRoute({
  getParentRoute: () => agentStudioRoute,
  path: '/providers/catalog',
  component: AgentStudioProvidersCatalogPage,
});

export const agentStudioProvidersMyProvidersRoute = createRoute({
  getParentRoute: () => agentStudioRoute,
  path: '/providers/my-providers',
  component: AgentStudioProvidersMyProvidersPage,
});

export const agentStudioProvidersModelsRoute = createRoute({
  getParentRoute: () => agentStudioRoute,
  path: '/providers/models',
  component: AgentStudioProvidersModelsPage,
});

export const agentStudioProvidersSpendRoute = createRoute({
  getParentRoute: () => agentStudioRoute,
  path: '/providers/spend',
  component: AgentStudioProvidersSpendPage,
});

export const agentStudioProvidersCustomNewRoute = createRoute({
  getParentRoute: () => agentStudioRoute,
  path: '/providers/custom/new',
  component: AgentStudioProvidersCustomPage,
});

export const agentStudioProvidersCustomEditRoute = createRoute({
  getParentRoute: () => agentStudioRoute,
  path: '/providers/custom/$credentialId/edit',
  component: AgentStudioProvidersCustomPage,
});

export const agentStudioToolsRoute = createRoute({
  getParentRoute: () => agentStudioRoute,
  path: '/tools',
  component: AgentStudioToolsLayout,
});

export const agentStudioToolsIndexRoute = createRoute({
  getParentRoute: () => agentStudioToolsRoute,
  path: '/',
  component: AgentStudioToolsPage,
});

export const agentStudioToolsNewRoute = createRoute({
  getParentRoute: () => agentStudioToolsRoute,
  path: '/new',
  component: AgentStudioToolsNewPage,
});

export const agentStudioToolsEditRoute = createRoute({
  getParentRoute: () => agentStudioToolsRoute,
  path: '/$toolId/edit',
  component: AgentStudioToolsEditPage,
});

// Instantiate a tool from a template as a dedicated section (Phase 3
// zero-content-modals). Static /instantiate is unambiguous against the
// `/$toolId/edit` sibling.
export const agentStudioToolsInstantiateRoute = createRoute({
  getParentRoute: () => agentStudioToolsRoute,
  path: '/instantiate',
  component: AgentStudioToolsInstantiatePage,
});

// Libraries additions (SIDEBAR_LEDGER.md P3): additive leaf routes, no moves.
export const agentStudioMemoryRoute = createRoute({
  getParentRoute: () => agentStudioRoute,
  path: '/memory',
  component: AgentStudioMemoryLayout,
});

export const agentStudioMemoryIndexRoute = createRoute({
  getParentRoute: () => agentStudioMemoryRoute,
  path: '/',
  component: AgentStudioMemoryPage,
});

// Memory create/detail/edit as dedicated sections (Phase 3
// zero-content-modals), registered as children of the existing /memory route.
export const agentStudioMemoryNewRoute = createRoute({
  getParentRoute: () => agentStudioMemoryRoute,
  path: '/new',
  component: AgentStudioLibrariesMemoryNewPage,
});

export const agentStudioMemoryDetailRoute = createRoute({
  getParentRoute: () => agentStudioMemoryRoute,
  path: '/$memoryId',
  component: AgentStudioLibrariesMemoryDetailPage,
});

export const agentStudioMemoryEditRoute = createRoute({
  getParentRoute: () => agentStudioMemoryRoute,
  path: '/$memoryId/edit',
  component: AgentStudioLibrariesMemoryEditPage,
});

export const agentStudioMemoryTimelineRoute = createRoute({
  getParentRoute: () => agentStudioMemoryRoute,
  path: '/$memoryId/timeline',
  component: AgentStudioLibrariesMemoryTimelinePage,
});

export const agentStudioDatasetsRoute = createRoute({
  getParentRoute: () => agentStudioRoute,
  path: '/datasets',
  component: AgentStudioDatasetsPage,
});

export const agentStudioBlocksRoute = createRoute({
  getParentRoute: () => agentStudioRoute,
  path: '/blocks',
  component: AgentStudioBlocksLayout,
});

export const agentStudioBlocksIndexRoute = createRoute({
  getParentRoute: () => agentStudioBlocksRoute,
  path: '/',
  component: AgentStudioBlocksPage,
});

// Set a control block as a dedicated section (Phase 3 zero-content-modals),
// registered as a child of the existing /blocks route.
export const agentStudioBlocksNewRoute = createRoute({
  getParentRoute: () => agentStudioBlocksRoute,
  path: '/new',
  component: AgentStudioLibrariesBlocksNewPage,
});

export const agentStudioChannelsRoute = createRoute({
  getParentRoute: () => agentStudioRoute,
  path: '/channels',
  // C14 publish exit: the success screen links here with ?returnTo=<detail
  // URL> + ?assistantId=<id> so connect-then-return never dead-ends. Both
  // optional — the library works standalone without them. Validated on the
  // layout so every child route inherits the contract.
  validateSearch: (search: Record<string, unknown>) => ({
    returnTo: typeof search.returnTo === 'string' ? search.returnTo : undefined,
    assistantId: typeof search.assistantId === 'string' ? search.assistantId : undefined,
  }),
  component: AgentStudioChannelsLayout,
});

export const agentStudioChannelsIndexRoute = createRoute({
  getParentRoute: () => agentStudioChannelsRoute,
  path: '/',
  component: AgentStudioChannelsPage,
});

export const agentStudioChannelsConnectRoute = createRoute({
  getParentRoute: () => agentStudioChannelsRoute,
  path: '/connect',
  component: AgentStudioChannelsConnectPage,
});

export const agentStudioChannelsDetailRoute = createRoute({
  getParentRoute: () => agentStudioChannelsRoute,
  path: '/$accountId',
  component: AgentStudioChannelsDetailPage,
});

export const agentStudioChannelsWebhookSetupRoute = createRoute({
  getParentRoute: () => agentStudioChannelsRoute,
  path: '/$accountId/webhook-setup',
  component: AgentStudioChannelsWebhookSetupPage,
});

export const agentStudioApprovalsRoute = createRoute({
  getParentRoute: () => agentStudioRoute,
  path: '/approvals',
  component: AgentStudioApprovalsPage,
});

export const agentStudioAnalyticsRoute = createRoute({
  getParentRoute: () => agentStudioRoute,
  path: '/analytics',
  component: AgentStudioAnalyticsPage,
});

export const agentStudioComplianceRoute = createRoute({
  getParentRoute: () => agentStudioRoute,
  path: '/compliance',
  component: AgentStudioComplianceLayout,
});

export const agentStudioComplianceIndexRoute = createRoute({
  getParentRoute: () => agentStudioComplianceRoute,
  path: '/',
  component: AgentStudioCompliancePage,
});

// DSR export request (X-1).
export const agentStudioComplianceExportsNewRoute = createRoute({
  getParentRoute: () => agentStudioComplianceRoute,
  path: '/exports/new',
  component: AgentStudioComplianceExportsNewPage,
});

// Place a legal hold (X-4).
export const agentStudioComplianceHoldsNewRoute = createRoute({
  getParentRoute: () => agentStudioComplianceRoute,
  path: '/holds/new',
  component: AgentStudioComplianceHoldsNewPage,
});

// Request a data purge (X-6).
export const agentStudioCompliancePurgesNewRoute = createRoute({
  getParentRoute: () => agentStudioComplianceRoute,
  path: '/purges/new',
  component: AgentStudioCompliancePurgesNewPage,
});

export const agentStudioTemplatesRoute = createRoute({
  getParentRoute: () => agentStudioRoute,
  path: '/templates',
  component: AgentStudioTemplatesLayout,
});

export const agentStudioTemplatesIndexRoute = createRoute({
  getParentRoute: () => agentStudioTemplatesRoute,
  path: '/',
  component: AgentStudioTemplatesPage,
});

// Template install wizard (R-1).
export const agentStudioTemplatesInstallRoute = createRoute({
  getParentRoute: () => agentStudioTemplatesRoute,
  path: '/$templateId/install',
  component: AgentStudioTemplatesInstallPage,
});

// Template gallery detail as a dedicated section (Phase 3
// zero-content-modals). `/$templateId` sits beside `/$templateId/install`
// with no collision (static tail segment).
export const agentStudioTemplatesDetailRoute = createRoute({
  getParentRoute: () => agentStudioTemplatesRoute,
  path: '/$templateId',
  validateSearch: (search: Record<string, unknown>) => ({
    returnTo: typeof search.returnTo === 'string' ? search.returnTo : undefined,
    autoLand: typeof search.autoLand === 'string' ? search.autoLand : undefined,
  }),
  component: AgentStudioTemplatesDetailPage,
});

export const agentStudioApiRoute = createRoute({
  getParentRoute: () => agentStudioRoute,
  path: '/api',
  component: AgentStudioApiPage,
});

export const agentStudioTeamsRoute = createRoute({
  getParentRoute: () => agentStudioRoute,
  path: '/teams',
  component: AgentStudioTeamsLayout,
});

export const agentStudioTeamsIndexRoute = createRoute({
  getParentRoute: () => agentStudioTeamsRoute,
  path: '/',
  component: AgentStudioTeamsPage,
});

export const agentStudioTeamsInviteRoute = createRoute({
  getParentRoute: () => agentStudioTeamsRoute,
  path: '/invite',
  component: AgentStudioTeamsInvitePage,
});

export const agentStudioTeamsGroupNewRoute = createRoute({
  getParentRoute: () => agentStudioTeamsRoute,
  path: '/groups/new',
  component: AgentStudioTeamsGroupNewPage,
});

export const agentStudioTeamsServiceAccountNewRoute = createRoute({
  getParentRoute: () => agentStudioTeamsRoute,
  path: '/service-accounts/new',
  component: AgentStudioTeamsServiceAccountNewPage,
});

export const agentStudioUsageRoute = createRoute({
  getParentRoute: () => agentStudioRoute,
  path: '/usage',
  component: AgentStudioUsagePage,
});

export const agentStudioEvaluationsRoute = createRoute({
  getParentRoute: () => agentStudioRoute,
  path: '/evaluations',
  // E-2 return contract: the per-dataset and results-drawer "Add cases"
  // entries thread ?returnTo=<originating context>; validated on the layout
  // so the cases-new child inherits the contract (C14 pattern).
  validateSearch: (search: Record<string, unknown>) => ({
    returnTo: typeof search.returnTo === 'string' ? search.returnTo : undefined,
  }),
  component: AgentStudioEvaluationsLayout,
});

export const agentStudioEvaluationsIndexRoute = createRoute({
  getParentRoute: () => agentStudioEvaluationsRoute,
  path: '/',
  component: AgentStudioEvaluationsPage,
});

export const agentStudioEvaluationsDatasetCasesNewRoute = createRoute({
  getParentRoute: () => agentStudioEvaluationsRoute,
  path: '/datasets/$datasetId/cases/new',
  component: AgentStudioEvaluationsCasesNewPage,
});

// Dataset create, run start, and cases manager as dedicated sections
// (Phase 3 zero-content-modals). ?returnTo is validated on the evaluations
// layout above (C14 pattern). /datasets/new and /datasets/$datasetId/cases
// cannot collide (different segment counts).
export const agentStudioEvaluationsDatasetNewRoute = createRoute({
  getParentRoute: () => agentStudioEvaluationsRoute,
  path: '/datasets/new',
  component: AgentStudioEvaluationsDatasetNewPage,
});

export const agentStudioEvaluationsRunNewRoute = createRoute({
  getParentRoute: () => agentStudioEvaluationsRoute,
  path: '/runs/new',
  component: AgentStudioEvaluationsRunNewPage,
});

export const agentStudioEvaluationsDatasetCasesRoute = createRoute({
  getParentRoute: () => agentStudioEvaluationsRoute,
  path: '/datasets/$datasetId/cases',
  component: AgentStudioEvaluationsDatasetCasesPage,
});

// ─── Deployment (PARKED — see note at the imports above) ────────────────
// The /deployment shell (dashboard, pipelines, deployments, settings, …)
// lives unrouted under src/future/deployment/. Nothing below this line may
// reference it until the product is rebuilt with an approved architecture.

// ─── Route Tree ────────────────────────────────────────

export const routeDefinitions = [
  indexRoute,
  researchRoute,
  blogRoute,
  blogDetailRoute,
  eventsRoute,
  aboutRoute,
  careersRoute,
  contactRoute,
  enterpriseAiAssistantRoute,
  aiEfficiencyDeploymentRoute,
  solutionsRoute,
  secretRoute,
  authRoute,
  resetPasswordRoute,
  verifyEmailRoute,
  // The OP callback + the /platform console are declared on the root route
  // and live at the top level of the tree — the callback must never sit
  // under a guarded shell, and /platform renders its own sign-in state.
  // The welcome + invite pages join them here for the same reason: welcome
  // redirects non-fresh visitors itself, and invite previews anonymously.
  authCallbackRoute,
  welcomeRoute,
  inviteRoute,
  connectorsOAuthRoute,
  platformRoute.addChildren([
    platformIndexRoute,
    platformMembersRoute,
    platformProjectsRoute,
    platformApiKeysRoute,
    platformUsageRoute,
    platformBillingRoute,
    platformAuditRoute,
    platformSettingsRoute,
    platformStatusRoute,
  ]),
  agentStudioRoute.addChildren([
    agentStudioIndexRoute,
    agentStudioChatRoute,
    agentStudioDashboardRoute,
    agentStudioAgentsRoute.addChildren([
      agentStudioAgentsIndexRoute,
      agentStudioAgentsOverviewRoute,
      agentStudioAgentsNewRoute,
      agentStudioAgentDetailRoute,
      agentStudioAgentBuildRoute,
      agentStudioAgentEditRoute,
      agentStudioAgentBlockNewRoute,
      agentStudioAgentVersionImportRoute,
      agentStudioAgentRollbackRoute,
      agentStudioAgentsCloneRoute,
    ]),
    agentStudioKnowledgeRoute.addChildren([
      agentStudioKnowledgeIndexRoute,
      agentStudioKnowledgeUploadRoute,
      agentStudioKnowledgeVersionUploadRoute,
      agentStudioKnowledgePreviewRoute,
      agentStudioKnowledgeStorageRoute,
      agentStudioKnowledgeUsageRoute,
      agentStudioKnowledgeHealthRoute,
      agentStudioKnowledgeDiagnosticsRoute,
      agentStudioKnowledgeCurateRoute,
      agentStudioKnowledgeScopesRoute,
      agentStudioKnowledgeScopeNewRoute,
      agentStudioKnowledgeScopeEditRoute,
      agentStudioKnowledgeScopeSimulateRoute,
      agentStudioKnowledgeEvalRoute,
      agentStudioKnowledgeEvalDatasetRoute,
      agentStudioKnowledgeRecallGapsRoute,
      agentStudioKnowledgeRecommendationsRoute,
    ]),
    // Old Models surface (B8 kill-switch): direct redirects to the unified
    // providers surface — no layout, no children.
    agentStudioModelsRoute,
    agentStudioModelsCredentialsNewRoute,
    agentStudioModelsCredentialsRotateRoute,
    agentStudioProvidersRoute,
    agentStudioProvidersCatalogRoute,
    agentStudioProvidersMyProvidersRoute,
    agentStudioProvidersModelsRoute,
    agentStudioProvidersSpendRoute,
    agentStudioProvidersCustomNewRoute,
    agentStudioProvidersCustomEditRoute,
    agentStudioToolsRoute.addChildren([
      agentStudioToolsIndexRoute,
      agentStudioToolsNewRoute,
      agentStudioToolsEditRoute,
      agentStudioToolsInstantiateRoute,
    ]),
    agentStudioMemoryRoute.addChildren([
      agentStudioMemoryIndexRoute,
      agentStudioMemoryNewRoute,
      agentStudioMemoryDetailRoute,
      agentStudioMemoryEditRoute,
      agentStudioMemoryTimelineRoute,
    ]),
    agentStudioDatasetsRoute,
    agentStudioChannelsRoute.addChildren([
      agentStudioChannelsIndexRoute,
      agentStudioChannelsConnectRoute,
      agentStudioChannelsDetailRoute,
      agentStudioChannelsWebhookSetupRoute,
    ]),
    agentStudioApprovalsRoute,
    agentStudioConversationsRoute,
    agentStudioActivityRoute,
    agentStudioAnalyticsRoute,
    agentStudioIntegrationsRoute.addChildren([
      agentStudioIntegrationsIndexRoute,
      agentStudioIntegrationsLinkRoute,
      agentStudioIntegrationsOAuthAppNewRoute,
      agentStudioWebhooksRoute.addChildren([
        agentStudioWebhooksIndexRoute,
        agentStudioWebhooksNewRoute,
        agentStudioWebhooksEditRoute,
      ]),
    ]),
    agentStudioTemplatesRoute.addChildren([
      agentStudioTemplatesIndexRoute,
      agentStudioTemplatesInstallRoute,
      agentStudioTemplatesDetailRoute,
    ]),
    agentStudioApiRoute,
    agentStudioTeamsRoute.addChildren([
      agentStudioTeamsIndexRoute,
      agentStudioTeamsInviteRoute,
      agentStudioTeamsGroupNewRoute,
      agentStudioTeamsServiceAccountNewRoute,
    ]),
    agentStudioUsageRoute,
    agentStudioEvaluationsRoute.addChildren([
      agentStudioEvaluationsIndexRoute,
      agentStudioEvaluationsDatasetCasesNewRoute,
      agentStudioEvaluationsDatasetNewRoute,
      agentStudioEvaluationsRunNewRoute,
      agentStudioEvaluationsDatasetCasesRoute,
    ]),
    agentStudioComplianceRoute.addChildren([
      agentStudioComplianceIndexRoute,
      agentStudioComplianceExportsNewRoute,
      agentStudioComplianceHoldsNewRoute,
      agentStudioCompliancePurgesNewRoute,
    ]),
    agentStudioBlocksRoute.addChildren([
      agentStudioBlocksIndexRoute,
      agentStudioBlocksNewRoute,
    ]),
    agentStudioSettingsRoute.addChildren([
      agentStudioSettingsIndexRoute,
      agentStudioSettingsProfileRoute,
      agentStudioSettingsWorkspaceRoute,
      agentStudioSettingsTeamRoute,
      agentStudioSettingsBillingRoute,
      agentStudioSettingsPricingRoute,
      agentStudioSettingsSecurityRoute,
      agentStudioSettingsApiKeysRoute,
      agentStudioSettingsApiKeyNewRoute,
      agentStudioSettingsTwoFactorSetupRoute,
    ]),
  ]),
];
