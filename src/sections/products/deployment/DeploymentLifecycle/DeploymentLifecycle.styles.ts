import styled from 'styled-components';

export const SectionWrapper = styled.section`
  padding: 120px 0;
  background-color: ${({ theme }) => theme.colors.background.secondary};
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
  display: flex;
  justify-content: center;

  ${({ theme }) => theme.media.tablet} {
    padding: 80px 0;
  }
`;

export const InnerContainer = styled.div`
  width: 100%;
  max-width: 1200px;
  padding: 0 ${({ theme }) => theme.spacing.s5};
  display: flex;
  flex-direction: column;
`;

export const HeaderContent = styled.div`
  margin-bottom: 80px;
  max-width: 700px;
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
  font-size: 20px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
`;

export const StepsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 40px;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
  padding-top: 60px;

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: 1fr;
    gap: 60px;
  }
`;

export const StepCard = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
`;

export const StepNumber = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text.muted};
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  width: 40px;
`;

export const StepTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 24px;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: ${({ theme }) => theme.colors.text.strong};
  margin: 0 0 16px 0;
  line-height: 1.3;
`;

export const StepDescription = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 16px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
`;
