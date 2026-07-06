import styled from 'styled-components';

export const SectionWrapper = styled.section`
  padding: 160px 0;
  background-color: #FFFFFF;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
  display: flex;
  justify-content: center;

  ${({ theme }) => theme.media.tablet} {
    padding: 120px 0;
  }

  ${({ theme }) => theme.media.mobile} {
    padding: 96px 0;
  }
`;

export const InnerContainer = styled.div`
  width: 100%;
  max-width: 1200px;
  padding: 0 ${({ theme }) => theme.spacing.s5};
  display: flex;
  gap: 80px;

  ${({ theme }) => theme.media.tablet} {
    flex-direction: column;
    gap: 48px;
  }
`;

export const StickyColumn = styled.div`
  flex: 1;
  position: relative;
`;

export const StickyContent = styled.div`
  position: sticky;
  top: 120px;
  max-width: 480px;

  ${({ theme }) => theme.media.tablet} {
    position: static;
  }
`;

export const Eyebrow = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text.muted};
  margin-bottom: 24px;
`;

export const Title = styled.h2`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: clamp(28px, 3.5vw, 40px);
  font-weight: 500;
  letter-spacing: -0.035em;
  color: ${({ theme }) => theme.colors.text.strong};
  margin: 0 0 24px;
  line-height: 1.15;

  ${({ theme }) => theme.media.mobile} {
    font-size: 28px;
    letter-spacing: -0.03em;
  }
`;

export const Subtitle = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 16px;
  line-height: 1.7;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
`;

export const ArtifactsColumn = styled.div`
  flex: 1.2;
  display: flex;
  flex-direction: column;
`;

export const ArtifactCard = styled.a`
  display: block;
  background-color: ${({ theme }) => theme.colors.background.secondary};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  padding: 48px;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 48px;
    right: 48px;
    height: 1px;
    background-color: ${({ theme }) => theme.colors.borderLight};
  }

  &:hover {
    background-color: #FFFFFF;
    border-color: ${({ theme }) => theme.colors.border};
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.04);
  }

  &:last-child::after {
    display: none;
  }

  ${({ theme }) => theme.media.mobile} {
    padding: 32px;
  }
`;

export const ArtifactType = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.1em;
  color: ${({ theme }) => theme.colors.text.muted};
  text-transform: uppercase;
  display: block;
  margin-bottom: 20px;
`;

export const ArtifactTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 20px;
  font-weight: 500;
  letter-spacing: -0.02em;
  color: ${({ theme }) => theme.colors.text.strong};
  margin: 0 0 32px;
  line-height: 1.4;
`;

export const ArtifactAction = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.strong};

  svg {
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  ${ArtifactCard}:hover & svg {
    transform: translateX(4px);
  }
`;
