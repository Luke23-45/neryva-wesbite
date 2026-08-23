import styled from 'styled-components';

export const DeploymentCapabilitiesSection = styled.section`
  padding: 40px 0;
  background-color: ${({ theme }) => theme.colors.background.primary};

  ${({ theme }) => theme.media.tablet} {
    padding: 80px 0;
  }
  margin-bottom: 50px;
`;

export const DeploymentCapabilitiesInnerContainer = styled.div`
  width: 100%;
  max-width: ${({ theme }) => theme.containers.wide};
  margin: 0 auto;
  padding: 0 40px;

  ${({ theme }) => theme.media.mobile} {
    padding: 0 24px;
  }
`;

export const DeploymentCapabilitiesAppsHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  max-width: 800px;
  margin-bottom: 40px;
`;

export const DeploymentCapabilitiesSectionHeading = styled.h2`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 56px;
  font-weight: 500;
  line-height: 1.05;
  letter-spacing: -0.04em;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;

  ${({ theme }) => theme.media.mobile} {
    font-size: 40px;
    letter-spacing: -0.03em;
  }
`;

export const DeploymentCapabilitiesAppsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  /* Top and Left borders applied to the container */
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  border-left: 1px solid ${({ theme }) => theme.colors.border};

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: repeat(2, 1fr);
  }

  ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 1fr;
  }
`;

export const DeploymentCapabilitiesAppCell = styled.div`
  display: flex;
  flex-direction: column;
  height: 420px;
  padding: 48px 32px;
  background: ${({ theme }) => theme.colors.background.primary};
  position: relative;
  transition: background-color 0.4s cubic-bezier(0.16, 1, 0.3, 1);

  /* Right and Bottom borders applied to each cell */
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  &:hover {
    background: ${({ theme }) => theme.colors.background.secondary};
  }

  ${({ theme }) => theme.media.tablet} {
    height: 320px;
  }
`;

export const DeploymentCapabilitiesCellIcon = styled.div`
  margin-bottom: 40px;
  color: ${({ theme }) => theme.colors.text.primary};

  svg {
    width: 44px;
    height: 44px;
    stroke-width: 1.5px;
  }
`;

export const DeploymentCapabilitiesCellTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 28px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin: 0;

  ${({ theme }) => theme.media.mobile} {
    font-size: 26px;
  }
`;

export const DeploymentCapabilitiesCellDesc = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.app.type.bodyLg};
  line-height: 1.6;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
  margin-top: auto;

  ${({ theme }) => theme.media.mobile} {
    font-size: ${({ theme }) => theme.app.type.body};
  }
`;
