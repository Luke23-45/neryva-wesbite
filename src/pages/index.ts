import { lazy } from 'react';

// Lazy load pages
export const Home = lazy(() => import('./Home'));
export const Research = lazy(() => import('./Research'));
export const OpenSource = lazy(() => import('./OpenSource'));
export const Mission = lazy(() => import('./Mission'));
export const About = lazy(() => import('./About'));
export const Contact = lazy(() => import('./Contact'));
export const NotFound = lazy(() => import('./NotFound'));
export const Verification = lazy(() => import('./Verification'));
