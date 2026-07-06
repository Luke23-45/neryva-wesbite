import styled from 'styled-components';

export const SectionWrapper = styled.section`
  padding: 160px 0;
  background-color: ${({ theme }) => theme.colors.background.primary};
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
  display: flex;
  justify-content: center;

  ${({ theme }) => theme.media.tablet} {
    padding: 100px 0;
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
    gap: 40px;
  }
`;

export const StickyColumn = styled.div`
  flex: 1;
  position: relative;
`;

export const StickyContent = styled.div`
  position: sticky;
  top: 120px;
  max-width: 500px;
`;

export const Eyebrow = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 13px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text.muted};
  margin-bottom: 24px;
`;

export const Title = styled.h2`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 40px;
  font-weight: 500;
  letter-spacing: -0.03em;
  color: ${({ theme }) => theme.colors.text.strong};
  margin: 0 0 24px 0;
  line-height: 1.2;

  ${({ theme }) => theme.media.mobile} {
    font-size: 32px;
  }
`;

export const Subtitle = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 18px;
  line-height: 1.6;
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
  border-radius: 1px;
  text-decoration: none;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0,0,0,0.03);
  }

  ${({ theme }) => theme.media.mobile} {
    padding: 32px;
  }
`;

export const ArtifactType = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.text.muted};
  text-transform: uppercase;
  display: block;
  margin-bottom: 16px;
`;

export const ArtifactTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 24px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.strong};
  margin: 0 0 32px 0;
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
    transition: transform 0.3s ease;
  }

  ${ArtifactCard}:hover & svg {
    transform: translateX(4px);
  }
`;
