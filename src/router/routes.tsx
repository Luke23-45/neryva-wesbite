import { createRoute } from '@tanstack/react-router';
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
import EnergyPage from '@pages/solutions/energy/EnergyPage';
import EngineeringPage from '@pages/solutions/engineering/EngineeringPage';
import HealthcarePage from '@pages/solutions/healthcare/HealthcarePage';
import RoboticsPage from '@pages/solutions/robotics/RoboticsPage';
import NotFoundPage from '@pages/_shared/NotFoundPage';

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

// Resources child routes
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

// Lab child routes
export const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/lab/about',
  component: AboutPage,
});

export const careersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/lab/careers',
  component: CareersPage,
});

export const contactRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/contact',
  component: ContactPage,
});

export const enterpriseAiAssistantRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/products/enterprise-ai-assistant',
  component: EnterpriseAiAssistantPage,
});

export const aiEfficiencyDeploymentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/products/ai-efficiency-deployment',
  component: AiEfficiencyDeploymentPage,
});

export const energyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/solutions/energy',
  component: EnergyPage,
});

export const engineeringRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/solutions/engineering',
  component: EngineeringPage,
});

export const healthcareRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/solutions/healthcare',
  component: HealthcarePage,
});

export const roboticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/solutions/robotics',
  component: RoboticsPage,
});

export const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '*',
  component: NotFoundPage,
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
  energyRoute,
  engineeringRoute,
  healthcareRoute,
  roboticsRoute,
  notFoundRoute,
];
