import styled from 'styled-components';

export const SectionWrapper = styled.section`
  padding: 160px 0;
  background-color: ${({ theme }) => theme.colors.background.secondary};
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
  display: flex;
  justify-content: center;

  ${({ theme }) => theme.media.tablet} {
    padding: 100px 0;
  }
`;

export const InnerContainer = styled.div`
  width: 100%;
  max-width: 800px;
  padding: 0 ${({ theme }) => theme.spacing.s5};
  display: flex;
  flex-direction: column;
`;

export const HeaderContent = styled.div`
  margin-bottom: 60px;
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
  font-size: 32px;
  font-weight: 500;
  letter-spacing: -0.02em;
  color: ${({ theme }) => theme.colors.text.strong};
  margin: 0 0 16px 0;
`;

export const Subtitle = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 18px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
`;

export const ArtifactsList = styled.div`
  display: flex;
  flex-direction: column;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
`;

export const ArtifactRow = styled.a`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  text-decoration: none;
  transition: padding-left 0.3s ease, padding-right 0.3s ease;

  &:hover {
    padding-left: 16px;
    padding-right: 16px;
    background-color: ${({ theme }) => theme.colors.background.primary};
  }

  ${({ theme }) => theme.media.mobile} {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    
    &:hover {
      padding-left: 0;
      padding-right: 0;
      background-color: transparent;
    }
  }
`;

export const ArtifactInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const ArtifactType = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.text.muted};
  text-transform: uppercase;
`;

export const ArtifactTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 20px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.strong};
  margin: 0;
  line-height: 1.4;
`;

export const ArtifactAction = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text.secondary};
  
  svg {
    transition: transform 0.3s ease;
  }

  ${ArtifactRow}:hover & svg {
    transform: translateX(4px);
    color: ${({ theme }) => theme.colors.text.strong};
  }
`;
