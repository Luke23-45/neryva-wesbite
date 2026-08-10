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

// Agent Studio app shell (auth-gated) — uses the existing ChatWorkspace internally
import AgentStudioShell from '@pages/products/agent_studio/AgentStudioShell';
import AgentStudioChatPage from '@pages/products/agent_studio/AgentStudioChatPage';
import AgentStudioDashboardPage from '@pages/products/agent_studio/AgentStudioDashboardPage';
import AgentStudioAgentsPage from '@pages/products/agent_studio/AgentStudioAgentsPage';
import AgentStudioAgentDetailPage from '@pages/products/agent_studio/AgentStudioAgentDetailPage';
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

import { requireAuth } from '@components/ProtectedRoute';

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
  beforeLoad: requireAuth,
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

// ─── Deployment (auth-gated app shell) ────────────────
export const deploymentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/deployment',
  beforeLoad: requireAuth,
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
  agentStudioRoute.addChildren([
    agentStudioIndexRoute,
    agentStudioChatRoute,
    agentStudioDashboardRoute,
    agentStudioAgentsRoute.addChildren([agentStudioAgentDetailRoute]),
    agentStudioConversationsRoute,
    agentStudioActivityRoute,
    agentStudioIntegrationsRoute.addChildren([agentStudioWebhooksRoute]),
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
    deploymentSettingsRoute.addChildren([
      deploymentSettingsIndexRoute,
      deploymentSettingsGeneralRoute,
      deploymentSettingsEnvironmentsRoute,
      deploymentSettingsNotificationsRoute,
      deploymentSettingsAccessRoute,
    ]),
  ]),
];
