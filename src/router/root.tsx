import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { QueryClient } from '@tanstack/react-query';
import styled from 'styled-components';

// Components
import { Header, Footer } from '@components/organisms';
import { PageTransition } from '@components/shared';

interface RouterContext {
    queryClient: QueryClient;
}

const LayoutWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

// Create Root Route
export const rootRoute = createRootRouteWithContext<RouterContext>()({
    component: () => (
        <LayoutWrapper>
            <Header />
            <MainContent>
                <PageTransition>
                    <Outlet />
                </PageTransition>
            </MainContent>
            <Footer />
            {process.env.NODE_ENV === 'development' && <TanStackRouterDevtools />}
        </LayoutWrapper>
    ),
});
