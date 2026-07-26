import styled from 'styled-components';

export const DeploymentHeroWrapper = styled.section`
  position: relative;
  width: 100%;
  background-color: ${({ theme }) => theme.colors.border};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;
  gap: 1px;
`;

export const DeploymentHeroRow1 = styled.div`
  display: grid;
  grid-template-columns: 65fr 35fr;
  gap: 1px;
  background-color: ${({ theme }) => theme.colors.border};

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: 1fr;
  }
`;

export const DeploymentHeroRow2 = styled.div`
  display: grid;
  grid-template-columns: 45fr 55fr;
  gap: 1px;
  background-color: ${({ theme }) => theme.colors.border};

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: 1fr;
  }
`;

export const DeploymentHeroCellTopLeft = styled.div`
  background: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 150px 80px 48px max(24px, calc((100vw - ${({ theme }) => theme.containers.wide}) / 2 + 24px));

  ${({ theme }) => theme.media.tablet} {
    padding: 140px 40px 40px max(24px, calc((100vw - ${({ theme }) => theme.containers.wide}) / 2 + 24px));
  }

  ${({ theme }) => theme.media.mobile} {
    padding: 120px 24px 32px 24px;
  }
`;

export const DeploymentHeroEyebrow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 25px;

  span {
    font-family: ${({ theme }) => theme.typography.fonts.mono};
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: ${({ theme }) => theme.colors.text.muted};
  }

  ${({ theme }) => theme.media.mobile} {
    margin-bottom: 24px;
  }
`;

export const DeploymentHeroHeadline = styled.h1`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: clamp(2.25rem, 4.5vw, 4rem);
  font-weight: 500;
  line-height: 1.05;
  letter-spacing: -0.04em;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
  white-space: pre-line;
`;

export const DeploymentHeroCellTopRight = styled.div`
  background: #fcfcfc;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 160px 64px 48px 64px;

  ${({ theme }) => theme.media.tablet} {
    padding: 40px;
    background: #ffffff;
  }

  ${({ theme }) => theme.media.mobile} {
    padding: 32px 24px;
  }
`;

export const DeploymentHeroSidebarMetric = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 16px;
  line-height: 1.5;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
`;

export const DeploymentHeroCellBottomLeft = styled.div`
  background: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 80px 80px 80px max(24px, calc((100vw - ${({ theme }) => theme.containers.wide}) / 2 + 24px));

  ${({ theme }) => theme.media.tablet} {
    padding: 64px max(24px, calc((100vw - ${({ theme }) => theme.containers.wide}) / 2 + 24px));
  }

  ${({ theme }) => theme.media.mobile} {
    padding: 48px 24px;
  }
`;

export const DeploymentHeroDescription = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 20px;
  line-height: 1.6;
  font-weight: 400;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0 0 40px 0;
  max-width: 600px;

  ${({ theme }) => theme.media.mobile} {
    font-size: 18px;
    margin-bottom: 32px;
  }
`;

export const DeploymentHeroCtaGroup = styled.div`
  display: flex;
  align-items: center;
`;

export const DeploymentHeroCtaPrimary = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 16px 28px;
  background: ${({ theme }) => theme.colors.text.primary};
  color: ${({ theme }) => theme.colors.background.primary};
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 15px;
  font-weight: 500;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
  transition: opacity 0.2s ease, transform 0.2s ease;

  &:hover {
    opacity: 0.92;
    transform: translateY(-1px);
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

export const DeploymentHeroCellBottomRight = styled.div`
  background: #090e15;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;

  ${({ theme }) => theme.media.tablet} {
    min-height: 400px;
  }

  ${({ theme }) => theme.media.mobile} {
    min-height: 320px;
  }
`;
