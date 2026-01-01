import { createRoute } from '@tanstack/react-router';
import { rootRoute } from './root';

// Pages
import Home from '@pages/Home';
import About from '@pages/About';
import Mission from '@pages/Mission';
import Contact from '@pages/Contact';
import OpenSource from '@pages/OpenSource';
import Research from '@pages/Research';
import Verification from '@pages/Verification';

// Individual Routes
export const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: Home,
});

export const aboutRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/about',
    component: About,
});

export const missionRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/mission',
    component: Mission,
});

export const contactRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/contact',
    component: Contact,
});

export const openSourceRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/open-source',
    component: OpenSource,
});

export const verificationRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/verification',
    component: Verification,
});

// Research Group
export const researchRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/research',
});

export const researchIndexRoute = createRoute({
    getParentRoute: () => researchRoute,
    path: '/',
    component: Research,
});

export const researchPillarRoute = createRoute({
    getParentRoute: () => researchRoute,
    path: '/$pillar',
    component: Research,
});

// Export all routes as a flat array for easier management in individual page-level split scenarios if needed later
export const routeDefinitions = [
    indexRoute,
    aboutRoute,
    missionRoute,
    contactRoute,
    openSourceRoute,
    verificationRoute,
    researchRoute.addChildren([
        researchIndexRoute,
        researchPillarRoute,
    ]),
];
