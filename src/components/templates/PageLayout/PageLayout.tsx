import { Outlet } from '@tanstack/react-router';
import styled from 'styled-components';
import { PageTransition } from '@components/shared';
import { Header, Footer } from '@components/organisms';

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

export const PageLayout = () => {
  return (
    <LayoutWrapper>
      <Header />
      <MainContent>
        <PageTransition>
          <Outlet />
        </PageTransition>
      </MainContent>
      <Footer />
    </LayoutWrapper>
  );
};
