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
  max-width: 1000px;
  padding: 0 ${({ theme }) => theme.spacing.s5};
  display: flex;
  flex-direction: column;
`;

export const HeaderContent = styled.div`
  margin-bottom: 80px;
  max-width: 700px;
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
  line-height: 1.1;

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

export const WorkflowsList = styled.div`
  display: flex;
  flex-direction: column;
`;

export const WorkflowItem = styled.div`
  display: flex;
  gap: 64px;
  padding: 64px 0;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};

  ${({ theme }) => theme.media.tablet} {
    flex-direction: column;
    gap: 24px;
    padding: 48px 0;
  }
`;

export const WorkflowNumber = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 16px;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.text.muted};
  flex-shrink: 0;
  width: 100px;
`;

export const WorkflowContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 600px;
`;

export const WorkflowTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 24px;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: ${({ theme }) => theme.colors.text.strong};
  margin: 0;
`;

export const WorkflowDescription = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 16px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
`;
