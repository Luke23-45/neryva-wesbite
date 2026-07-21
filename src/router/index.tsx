import { createRouter } from '@tanstack/react-router';
import { rootRoute } from './root';
import { routeDefinitions } from './routes';
import NotFoundPage from '@pages/_shared/notfound/NotFoundPage';

// Create Route Tree
const routeTree = rootRoute.addChildren(routeDefinitions);

// Create Router Instance
export const router = createRouter({
    routeTree,
    defaultNotFoundComponent: NotFoundPage,
    context: {
        queryClient: undefined!, // This will be passed in main.tsx
    },
});

// Register Router for type safety
declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}
