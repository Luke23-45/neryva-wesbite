import styled from 'styled-components';

export const SectionWrapper = styled.section`
  padding: 160px 0;
  background-color: ${({ theme }) => theme.colors.background.secondary};
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
  max-width: 1000px;
  padding: 0 ${({ theme }) => theme.spacing.s5};
  display: flex;
  flex-direction: column;
`;

export const HeaderContent = styled.div`
  margin-bottom: 80px;
  max-width: 680px;
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
  margin: 0;
  line-height: 1.1;

  ${({ theme }) => theme.media.mobile} {
    font-size: 28px;
    letter-spacing: -0.03em;
  }
`;

export const WorkflowsList = styled.div`
  display: flex;
  flex-direction: column;
`;

export const WorkflowItem = styled.div`
  display: flex;
  gap: 64px;
  padding: 56px 0;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
  transition: background-color 0.3s ease;

  &:last-child {
    border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  }

  ${({ theme }) => theme.media.tablet} {
    flex-direction: column;
    gap: 20px;
    padding: 40px 0;
  }
`;

export const WorkflowNumber = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.text.muted};
  flex-shrink: 0;
  width: 80px;
  padding-top: 2px;
`;

export const WorkflowContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 600px;
`;

export const WorkflowTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 22px;
  font-weight: 500;
  letter-spacing: -0.02em;
  color: ${({ theme }) => theme.colors.text.strong};
  margin: 0;
`;

export const WorkflowDescription = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 15px;
  line-height: 1.7;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
`;
