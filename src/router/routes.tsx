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
import SolutionsPage from '@pages/solutions/SolutionsPage';
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
  path: '/products/enterprise-ai-assistant',
  component: EnterpriseAiAssistantPage,
});

export const aiEfficiencyDeploymentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/products/ai-efficiency-deployment',
  component: AiEfficiencyDeploymentPage,
});

export const solutionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/solutions',
  component: SolutionsPage,
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
];
