import { lazy } from 'react';
import { createRoute, redirect } from '@tanstack/react-router';
import { rootRoute } from './root';

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
import AgentStudioConversationsPage from '@pages/products/agent_studio/AgentStudioConversationsPage';
import AgentStudioActivityPage from '@pages/products/agent_studio/AgentStudioActivityPage';
import AgentStudioIntegrationsPage, { AgentStudioIntegrationsLayout } from '@pages/products/agent_studio/AgentStudioIntegrationsPage';
import AgentStudioIntegrationsLinkPage from '@pages/products/agent_studio/AgentStudioIntegrationsLinkPage';
import AgentStudioIntegrationsOAuthAppNewPage from '@pages/products/agent_studio/AgentStudioIntegrationsOAuthAppNewPage';
import AgentStudioWebhooksPage from '@pages/products/agent_studio/AgentStudioWebhooksPage';
import AgentStudioSettingsIndexPage from '@pages/products/agent_studio/AgentStudioSettingsIndexPage';
import AgentStudioSettingsProfilePage from '@pages/products/agent_studio/AgentStudioSettingsProfilePage';
import AgentStudioSettingsWorkspacePage from '@pages/products/agent_studio/AgentStudioSettingsWorkspacePage';
import AgentStudioSettingsTeamPage from '@pages/products/agent_studio/AgentStudioSettingsTeamPage';
import AgentStudioSettingsBillingPage from '@pages/products/agent_studio/AgentStudioSettingsBillingPage';
import AgentStudioSettingsSecurityPage from '@pages/products/agent_studio/AgentStudioSettingsSecurityPage';
import AgentStudioSettingsApiKeysPage from '@pages/products/agent_studio/AgentStudioSettingsApiKeysPage';
import AgentStudioSettingsApiKeyNewPage from '@pages/products/agent_studio/AgentStudioSettingsApiKeyNewPage';
import AgentStudioSettingsTwoFactorSetupPage from '@pages/products/agent_studio/AgentStudioSettingsTwoFactorSetupPage';
import AgentStudioKnowledgePage from '@pages/products/agent_studio/AgentStudioKnowledgePage';
import AgentStudioKnowledgeUploadPage, {
  AgentStudioKnowledgeLayout,
} from '@pages/products/agent_studio/AgentStudioKnowledgeUploadPage';
import AgentStudioModelsPage, { AgentStudioModelsLayout } from '@pages/products/agent_studio/AgentStudioModelsPage';
import AgentStudioModelsCredentialsNewPage from '@pages/products/agent_studio/AgentStudioModelsCredentialsNewPage';
import AgentStudioModelsCredentialsRotatePage from '@pages/products/agent_studio/AgentStudioModelsCredentialsRotatePage';
import AgentStudioToolsPage, { AgentStudioToolsLayout } from '@pages/products/agent_studio/AgentStudioToolsPage';
import AgentStudioToolsNewPage from '@pages/products/agent_studio/AgentStudioToolsNewPage';
import AgentStudioToolsEditPage from '@pages/products/agent_studio/AgentStudioToolsEditPage';
import AgentStudioMemoryPage from '@pages/products/agent_studio/AgentStudioMemoryPage';
import AgentStudioDatasetsPage from '@pages/products/agent_studio/AgentStudioDatasetsPage';
import AgentStudioBlocksPage from '@pages/products/agent_studio/AgentStudioBlocksPage';
import AgentStudioChannelsPage, { AgentStudioChannelsLayout } from '@pages/products/agent_studio/AgentStudioChannelsPage';
import AgentStudioChannelsConnectPage from '@pages/products/agent_studio/AgentStudioChannelsConnectPage';
import AgentStudioChannelsDetailPage from '@pages/products/agent_studio/AgentStudioChannelsDetailPage';
import AgentStudioChannelsWebhookSetupPage from '@pages/products/agent_studio/AgentStudioChannelsWebhookSetupPage';
import AgentStudioApprovalsPage from '@pages/products/agent_studio/AgentStudioApprovalsPage';
import AgentStudioAnalyticsPage from '@pages/products/agent_studio/AgentStudioAnalyticsPage';
import AgentStudioCompliancePage from '@pages/products/agent_studio/AgentStudioCompliancePage';
import AgentStudioTemplatesPage from '@pages/products/agent_studio/AgentStudioTemplatesPage';
import AgentStudioApiPage from '@pages/products/agent_studio/AgentStudioApiPage';
import AgentStudioTeamsPage, { AgentStudioTeamsLayout } from '@pages/products/agent_studio/AgentStudioTeamsPage';
import AgentStudioTeamsInvitePage from '@pages/products/agent_studio/AgentStudioTeamsInvitePage';
import AgentStudioTeamsGroupNewPage from '@pages/products/agent_studio/AgentStudioTeamsGroupNewPage';
import AgentStudioTeamsServiceAccountNewPage from '@pages/products/agent_studio/AgentStudioTeamsServiceAccountNewPage';
import AgentStudioUsagePage from '@pages/products/agent_studio/AgentStudioUsagePage';
import AgentStudioEvaluationsPage, { AgentStudioEvaluationsLayout } from '@pages/products/agent_studio/AgentStudioEvaluationsPage';
import AgentStudioEvaluationsCasesNewPage from '@pages/products/agent_studio/AgentStudioEvaluationsCasesNewPage';

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

// Builder entry (BUILD_PLAN.md §B): static segment wins over the
// `/$agentId` dynamic sibling, so /new never resolves as an id.
export const agentStudioAgentsNewRoute = createRoute({
  getParentRoute: () => agentStudioAgentsRoute,
  path: '/new',
  component: AgentStudioAgentBuilderNewPage,
});

export const agentStudioAgentBuildRoute = createRoute({
  getParentRoute: () => agentStudioAgentsRoute,
  path: '/$agentId/build',
  // C15 operate re-entry: ?slot=<spine-or-kind> resumes the builder on a
  // slot (unknown values are ignored, never an error).
  validateSearch: (search: Record<string, unknown>) => ({
    slot: typeof search.slot === 'string' ? search.slot : undefined,
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
  component: AgentStudioWebhooksPage,
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

export const agentStudioModelsRoute = createRoute({
  getParentRoute: () => agentStudioRoute,
  path: '/models',
  component: AgentStudioModelsLayout,
});

export const agentStudioModelsIndexRoute = createRoute({
  getParentRoute: () => agentStudioModelsRoute,
  path: '/',
  component: AgentStudioModelsPage,
});

export const agentStudioModelsCredentialsNewRoute = createRoute({
  getParentRoute: () => agentStudioModelsRoute,
  path: '/credentials/new',
  component: AgentStudioModelsCredentialsNewPage,
});

export const agentStudioModelsCredentialsRotateRoute = createRoute({
  getParentRoute: () => agentStudioModelsRoute,
  path: '/credentials/$credentialId/rotate',
  component: AgentStudioModelsCredentialsRotatePage,
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

// Libraries additions (SIDEBAR_LEDGER.md P3): additive leaf routes, no moves.
export const agentStudioMemoryRoute = createRoute({
  getParentRoute: () => agentStudioRoute,
  path: '/memory',
  component: AgentStudioMemoryPage,
});

export const agentStudioDatasetsRoute = createRoute({
  getParentRoute: () => agentStudioRoute,
  path: '/datasets',
  component: AgentStudioDatasetsPage,
});

export const agentStudioBlocksRoute = createRoute({
  getParentRoute: () => agentStudioRoute,
  path: '/blocks',
  component: AgentStudioBlocksPage,
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
  component: AgentStudioCompliancePage,
});

export const agentStudioTemplatesRoute = createRoute({
  getParentRoute: () => agentStudioRoute,
  path: '/templates',
  component: AgentStudioTemplatesPage,
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
    ]),
    agentStudioKnowledgeRoute.addChildren([
      agentStudioKnowledgeIndexRoute,
      agentStudioKnowledgeUploadRoute,
    ]),
    agentStudioModelsRoute.addChildren([
      agentStudioModelsIndexRoute,
      agentStudioModelsCredentialsNewRoute,
      agentStudioModelsCredentialsRotateRoute,
    ]),
    agentStudioToolsRoute.addChildren([
      agentStudioToolsIndexRoute,
      agentStudioToolsNewRoute,
      agentStudioToolsEditRoute,
    ]),
    agentStudioMemoryRoute,
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
      agentStudioWebhooksRoute,
    ]),
    agentStudioTemplatesRoute,
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
    ]),
    agentStudioComplianceRoute,
    agentStudioBlocksRoute,
    agentStudioSettingsRoute.addChildren([
      agentStudioSettingsIndexRoute,
      agentStudioSettingsProfileRoute,
      agentStudioSettingsWorkspaceRoute,
      agentStudioSettingsTeamRoute,
      agentStudioSettingsBillingRoute,
      agentStudioSettingsSecurityRoute,
      agentStudioSettingsApiKeysRoute,
      agentStudioSettingsApiKeyNewRoute,
      agentStudioSettingsTwoFactorSetupRoute,
    ]),
  ]),
];
