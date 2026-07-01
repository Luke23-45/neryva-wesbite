import { createRoute, redirect } from '@tanstack/react-router';
import { rootRoute } from './root';

// Pages
import HomePage from '@pages/HomePage';
import ResearchPage from '@pages/ResearchPage';
import ProgramDetailPage from '@pages/ProgramDetailPage';
import ResourcesPage from '@pages/ResourcesPage';
import BlogPage from '@pages/BlogPage';
import AboutPage from '@pages/AboutPage';
import CareersPage from '@pages/CareersPage';
// import ContactPage from '@pages/ContactPage';
// import NotFoundPage from '@pages/NotFoundPage';

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

// Programs layout route (parent for detail pages only)
export const programsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/programs',
});

// /programs redirects to the first program — no index page
export const programsIndexRoute = createRoute({
  getParentRoute: () => programsRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/programs/large-language-models' });
  },
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

// Resources child routes
export const blogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/resources/blog',
  component: BlogPage,
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

// export const contactRoute = createRoute({
//   getParentRoute: () => rootRoute,
//   path: '/contact',
//   component: ContactPage,
// });

// export const notFoundRoute = createRoute({
//   getParentRoute: () => rootRoute,
//   path: '*',
//   component: NotFoundPage,
// });

// ─── Route Tree ────────────────────────────────────────

export const routeDefinitions = [
  indexRoute,
  researchRoute,
  programsRoute.addChildren([
    programsIndexRoute,
    programDetailRoute,
  ]),
  resourcesRoute,
  blogRoute,
  aboutRoute,
  careersRoute,
  // contactRoute,
  // notFoundRoute,
];
