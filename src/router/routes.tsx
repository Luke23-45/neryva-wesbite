import { createRoute } from '@tanstack/react-router';
import { rootRoute } from './root';

// Pages
import HomePage from '@pages/HomePage';
import ResearchPage from '@pages/ResearchPage';
import ProgramsPage from '@pages/ProgramsPage';
import ProgramDetailPage from '@pages/ProgramDetailPage';
import ResourcesPage from '@pages/ResourcesPage';
import LabPage from '@pages/LabPage';
import ContactPage from '@pages/ContactPage';
import NotFoundPage from '@pages/NotFoundPage';

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

// Programs layout route (parent for index and detail)
export const programsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/programs',
});

export const programsIndexRoute = createRoute({
  getParentRoute: () => programsRoute,
  path: '/',
  component: ProgramsPage,
});

export const programDetailRoute = createRoute({
  getParentRoute: () => programsRoute,
  path: '/$slug',
  component: ProgramDetailPage,
});

export const resourcesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/resources',
  component: ResourcesPage,
});

export const labRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/lab',
  component: LabPage,
});

export const contactRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/contact',
  component: ContactPage,
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
  programsRoute.addChildren([
    programsIndexRoute,
    programDetailRoute,
  ]),
  resourcesRoute,
  labRoute,
  contactRoute,
  notFoundRoute,
];
