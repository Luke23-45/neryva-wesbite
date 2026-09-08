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

// Platform console (engine-backed) — /platform/**
import PlatformShell from '@pages/platform/PlatformShell';
import AuthCallbackPage from '@pages/platform/AuthCallbackPage';
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
import AgentStudioAgentsPage from '@pages/products/agent_studio/AgentStudioAgentsPage';
import AgentStudioAgentDetailPage from '@pages/products/agent_studio/AgentStudioAgentDetailPage';
import AgentStudioAgentEditPage from '@pages/products/agent_studio/AgentStudioAgentEditPage';
import AgentStudioConversationsPage from '@pages/products/agent_studio/AgentStudioConversationsPage';
import AgentStudioActivityPage from '@pages/products/agent_studio/AgentStudioActivityPage';
import AgentStudioIntegrationsPage from '@pages/products/agent_studio/AgentStudioIntegrationsPage';
import AgentStudioWebhooksPage from '@pages/products/agent_studio/AgentStudioWebhooksPage';
import AgentStudioSettingsIndexPage from '@pages/products/agent_studio/AgentStudioSettingsIndexPage';
import AgentStudioSettingsProfilePage from '@pages/products/agent_studio/AgentStudioSettingsProfilePage';
import AgentStudioSettingsWorkspacePage from '@pages/products/agent_studio/AgentStudioSettingsWorkspacePage';
import AgentStudioSettingsTeamPage from '@pages/products/agent_studio/AgentStudioSettingsTeamPage';
import AgentStudioSettingsBillingPage from '@pages/products/agent_studio/AgentStudioSettingsBillingPage';
import AgentStudioSettingsSecurityPage from '@pages/products/agent_studio/AgentStudioSettingsSecurityPage';
import AgentStudioSettingsApiKeysPage from '@pages/products/agent_studio/AgentStudioSettingsApiKeysPage';
import AgentStudioKnowledgePage from '@pages/products/agent_studio/AgentStudioKnowledgePage';
import AgentStudioModelsPage from '@pages/products/agent_studio/AgentStudioModelsPage';
import AgentStudioAnalyticsPage from '@pages/products/agent_studio/AgentStudioAnalyticsPage';
import AgentStudioCompliancePage from '@pages/products/agent_studio/AgentStudioCompliancePage';
import AgentStudioTemplatesPage from '@pages/products/agent_studio/AgentStudioTemplatesPage';
import AgentStudioApiPage from '@pages/products/agent_studio/AgentStudioApiPage';
import AgentStudioTeamsPage from '@pages/products/agent_studio/AgentStudioTeamsPage';
import AgentStudioUsagePage from '@pages/products/agent_studio/AgentStudioUsagePage';
import AgentStudioEvaluationsPage from '@pages/products/agent_studio/AgentStudioEvaluationsPage';

// Deployment app shell (auth-gated)
import DeploymentShell from '@pages/products/deployment/DeploymentShell';
import DeploymentDashboardPage from '@pages/products/deployment/DeploymentDashboardPage';
import DeploymentPipelinesPage from '@pages/products/deployment/DeploymentPipelinesPage';
import DeploymentPipelineDetailPage from '@pages/products/deployment/DeploymentPipelineDetailPage';
import DeploymentDeploymentsPage from '@pages/products/deployment/DeploymentDeploymentsPage';
import DeploymentDeployDetailPage from '@pages/products/deployment/DeploymentDeployDetailPage';
import DeploymentInfrastructurePage from '@pages/products/deployment/DeploymentInfrastructurePage';
import DeploymentLogsPage from '@pages/products/deployment/DeploymentLogsPage';
import DeploymentSettingsIndexPage from '@pages/products/deployment/DeploymentSettingsIndexPage';
import DeploymentSettingsGeneralPage from '@pages/products/deployment/DeploymentSettingsGeneralPage';
import DeploymentSettingsEnvironmentsPage from '@pages/products/deployment/DeploymentSettingsEnvironmentsPage';
import DeploymentSettingsNotificationsPage from '@pages/products/deployment/DeploymentSettingsNotificationsPage';
import DeploymentSettingsAccessPage from '@pages/products/deployment/DeploymentSettingsAccessPage';
import DeploymentAlertsPage from '@pages/products/deployment/DeploymentAlertsPage';
import DeploymentCostPage from '@pages/products/deployment/DeploymentCostPage';
import DeploymentSecretsPage from '@pages/products/deployment/DeploymentSecretsPage';
import DeploymentCompliancePage from '@pages/products/deployment/DeploymentCompliancePage';
import DeploymentWebhooksPage from '@pages/products/deployment/DeploymentWebhooksPage';
import DeploymentNetworkPage from '@pages/products/deployment/DeploymentNetworkPage';
import DeploymentScalingPage from '@pages/products/deployment/DeploymentScalingPage';
import DeploymentExperimentsPage from '@pages/products/deployment/DeploymentExperimentsPage';
import DeploymentTeamsPage from '@pages/products/deployment/DeploymentTeamsPage';
import DeploymentUsagePage from '@pages/products/deployment/DeploymentUsagePage';
import DeploymentReleasesPage from '@pages/products/deployment/DeploymentReleasesPage';

import { requireEngineSession } from '@lib/engine/session-gate';

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

export const platformRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/platform',
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

// ─── Agent Studio (auth-gated app shell) ────────────────
//
// All routes share a single dark chrome via the <AgentStudioShell/> layout
// which renders the sidebar/topbar and an <Outlet/> for the page.

export const agentStudioRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/agent-studio',
  beforeLoad: () => requireEngineSession(),
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
  component: AgentStudioIntegrationsPage,
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

export const agentStudioKnowledgeRoute = createRoute({
  getParentRoute: () => agentStudioRoute,
  path: '/knowledge',
  component: AgentStudioKnowledgePage,
});

export const agentStudioModelsRoute = createRoute({
  getParentRoute: () => agentStudioRoute,
  path: '/models',
  component: AgentStudioModelsPage,
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
  component: AgentStudioTeamsPage,
});

export const agentStudioUsageRoute = createRoute({
  getParentRoute: () => agentStudioRoute,
  path: '/usage',
  component: AgentStudioUsagePage,
});

export const agentStudioEvaluationsRoute = createRoute({
  getParentRoute: () => agentStudioRoute,
  path: '/evaluations',
  component: AgentStudioEvaluationsPage,
});

// ─── Deployment (auth-gated app shell) ────────────────
export const deploymentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/deployment',
  beforeLoad: () => requireEngineSession(),
  component: DeploymentShell,
});

export const deploymentIndexRoute = createRoute({
  getParentRoute: () => deploymentRoute,
  path: '/',
  beforeLoad: () => { throw redirect({ to: '/deployment/dashboard' }); },
  component: () => null,
});

export const deploymentDashboardRoute = createRoute({
  getParentRoute: () => deploymentRoute,
  path: '/dashboard',
  component: DeploymentDashboardPage,
});

export const deploymentPipelinesRoute = createRoute({
  getParentRoute: () => deploymentRoute,
  path: '/pipelines',
  component: DeploymentPipelinesPage,
});

export const deploymentPipelineDetailRoute = createRoute({
  getParentRoute: () => deploymentPipelinesRoute,
  path: '/$pipelineId',
  component: DeploymentPipelineDetailPage,
});

export const deploymentDeploymentsRoute = createRoute({
  getParentRoute: () => deploymentRoute,
  path: '/deployments',
  component: DeploymentDeploymentsPage,
});

export const deploymentDeployDetailRoute = createRoute({
  getParentRoute: () => deploymentDeploymentsRoute,
  path: '/$deployId',
  component: DeploymentDeployDetailPage,
});

export const deploymentInfrastructureRoute = createRoute({
  getParentRoute: () => deploymentRoute,
  path: '/infrastructure',
  component: DeploymentInfrastructurePage,
});

export const deploymentLogsRoute = createRoute({
  getParentRoute: () => deploymentRoute,
  path: '/logs',
  component: DeploymentLogsPage,
});

export const deploymentSettingsRoute = createRoute({
  getParentRoute: () => deploymentRoute,
  path: '/settings',
  component: DeploymentSettingsIndexPage,
});

export const deploymentSettingsIndexRoute = createRoute({
  getParentRoute: () => deploymentSettingsRoute,
  path: '/',
  beforeLoad: () => { throw redirect({ to: '/deployment/settings/general' }); },
  component: () => null,
});

export const deploymentSettingsGeneralRoute = createRoute({
  getParentRoute: () => deploymentSettingsRoute,
  path: '/general',
  component: DeploymentSettingsGeneralPage,
});

export const deploymentSettingsEnvironmentsRoute = createRoute({
  getParentRoute: () => deploymentSettingsRoute,
  path: '/environments',
  component: DeploymentSettingsEnvironmentsPage,
});

export const deploymentSettingsNotificationsRoute = createRoute({
  getParentRoute: () => deploymentSettingsRoute,
  path: '/notifications',
  component: DeploymentSettingsNotificationsPage,
});

export const deploymentSettingsAccessRoute = createRoute({
  getParentRoute: () => deploymentSettingsRoute,
  path: '/access',
  component: DeploymentSettingsAccessPage,
});

export const deploymentAlertsRoute = createRoute({
  getParentRoute: () => deploymentRoute,
  path: '/alerts',
  component: DeploymentAlertsPage,
});

export const deploymentCostRoute = createRoute({
  getParentRoute: () => deploymentRoute,
  path: '/cost',
  component: DeploymentCostPage,
});

export const deploymentSecretsRoute = createRoute({
  getParentRoute: () => deploymentRoute,
  path: '/secrets',
  component: DeploymentSecretsPage,
});

export const deploymentComplianceRoute = createRoute({
  getParentRoute: () => deploymentRoute,
  path: '/compliance',
  component: DeploymentCompliancePage,
});

export const deploymentWebhooksRoute = createRoute({
  getParentRoute: () => deploymentRoute,
  path: '/webhooks',
  component: DeploymentWebhooksPage,
});

export const deploymentNetworkRoute = createRoute({
  getParentRoute: () => deploymentRoute,
  path: '/network',
  component: DeploymentNetworkPage,
});

export const deploymentScalingRoute = createRoute({
  getParentRoute: () => deploymentRoute,
  path: '/scaling',
  component: DeploymentScalingPage,
});

export const deploymentExperimentsRoute = createRoute({
  getParentRoute: () => deploymentRoute,
  path: '/experiments',
  component: DeploymentExperimentsPage,
});

export const deploymentTeamsRoute = createRoute({
  getParentRoute: () => deploymentRoute,
  path: '/teams',
  component: DeploymentTeamsPage,
});

export const deploymentUsageRoute = createRoute({
  getParentRoute: () => deploymentRoute,
  path: '/usage',
  component: DeploymentUsagePage,
});

export const deploymentReleasesRoute = createRoute({
  getParentRoute: () => deploymentRoute,
  path: '/releases',
  component: DeploymentReleasesPage,
});

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
  // The OP callback + the /platform console are declared on the root route
  // and live at the top level of the tree — the callback must never sit
  // under a guarded shell, and /platform renders its own sign-in state.
  authCallbackRoute,
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
    agentStudioAgentsRoute.addChildren([agentStudioAgentDetailRoute, agentStudioAgentEditRoute]),
    agentStudioKnowledgeRoute,
    agentStudioModelsRoute,
    agentStudioConversationsRoute,
    agentStudioActivityRoute,
    agentStudioAnalyticsRoute,
    agentStudioIntegrationsRoute.addChildren([agentStudioWebhooksRoute]),
    agentStudioTemplatesRoute,
    agentStudioApiRoute,
    agentStudioTeamsRoute,
    agentStudioUsageRoute,
    agentStudioEvaluationsRoute,
    agentStudioComplianceRoute,
    agentStudioSettingsRoute.addChildren([
      agentStudioSettingsIndexRoute,
      agentStudioSettingsProfileRoute,
      agentStudioSettingsWorkspaceRoute,
      agentStudioSettingsTeamRoute,
      agentStudioSettingsBillingRoute,
      agentStudioSettingsSecurityRoute,
      agentStudioSettingsApiKeysRoute,
    ]),
  ]),
  deploymentRoute.addChildren([
    deploymentIndexRoute,
    deploymentDashboardRoute,
    deploymentPipelinesRoute.addChildren([deploymentPipelineDetailRoute]),
    deploymentDeploymentsRoute.addChildren([deploymentDeployDetailRoute]),
    deploymentInfrastructureRoute,
    deploymentLogsRoute,
    deploymentAlertsRoute,
    deploymentCostRoute,
    deploymentSecretsRoute,
    deploymentComplianceRoute,
    deploymentWebhooksRoute,
    deploymentNetworkRoute,
    deploymentScalingRoute,
    deploymentExperimentsRoute,
    deploymentTeamsRoute,
    deploymentUsageRoute,
    deploymentReleasesRoute,
    deploymentSettingsRoute.addChildren([
      deploymentSettingsIndexRoute,
      deploymentSettingsGeneralRoute,
      deploymentSettingsEnvironmentsRoute,
      deploymentSettingsNotificationsRoute,
      deploymentSettingsAccessRoute,
    ]),
  ]),
];
