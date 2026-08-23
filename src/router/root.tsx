import { Suspense } from 'react';
import { createRootRouteWithContext, Outlet, useLocation } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import styled from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';
import { Header } from '@/sections/common/layout/Header';
import { Footer } from '@/sections/common/layout/Footer';
import { PageHead } from '@components/common/PageHead';

interface RouterContext {
  queryClient: QueryClient;
}

const LayoutWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const MainContent = styled(motion.main)`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const pageTransition: any = {
  duration: 0.24,
  ease: [0.2, 0, 0, 1],
};

const APP_SHELL_PATHS = ['/agent-studio', '/deployment', '/platform'];

export const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: function RootLayout() {
    const location = useLocation();
    const isAppShell = APP_SHELL_PATHS.some((p) => location.pathname.startsWith(p));

    return (
      <LayoutWrapper>
        {/* Site-wide default SEO — overridden per-page by each page's own <PageHead> */}
        <PageHead />
        {!isAppShell && <Header />}
        <AnimatePresence mode="wait">
          <MainContent
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            <Suspense fallback={<div>Loading...</div>}>
              <Outlet />
            </Suspense>
          </MainContent>
        </AnimatePresence>
        {!isAppShell && <Footer />}
        {/* {import.meta.env.DEV && <TanStackRouterDevtools />} */}
      </LayoutWrapper>
    );
  },
});
