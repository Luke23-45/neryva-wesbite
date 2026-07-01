import styled from 'styled-components';

export const Wrapper = styled.section`
  padding: 120px 0;
  background-color: ${({ theme }) => theme.colors.background.secondary};

  ${({ theme }) => theme.media.mobile} {
    padding: 80px 0;
  }
`;

export const Inner = styled.div`
  max-width: ${({ theme }) => theme.containers.page};
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing.s5};

  ${({ theme }) => theme.media.mobile} {
    padding: 0 ${({ theme }) => theme.spacing.s4};
  }
`;

export const HeaderSection = styled.div`
  max-width: 600px;
  margin: 0 0 72px 0;
`;

export const SectionLabel = styled.span`
  display: inline-block;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text.muted};
  margin-bottom: 20px;
`;

export const Title = styled.h2`
  font-size: clamp(2.75rem, 5vw, 4.5rem);
  font-weight: 500;
  line-height: 1.0;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
  letter-spacing: -0.04em;
`;

export const BentoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: ${({ theme }) => theme.spacing.s10};

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: 1fr;
  }
`;

export const BentoCard = styled.div`
  background: ${({ theme }) => theme.colors.background.primary};
  border-radius: 28px;
  padding: 48px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.03),
    0 8px 32px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    transform: translateY(-5px);
    box-shadow:
      0 4px 12px rgba(0, 0, 0, 0.04),
      0 16px 48px rgba(0, 0, 0, 0.08);
  }

  ${({ theme }) => theme.media.mobile} {
    padding: 36px;
    border-radius: 24px;
  }
`;

export const CardIconWrapper = styled.div`
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 36px;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);

  ${BentoCard}:hover & {
    transform: scale(1.04);
  }
`;

export const CardTitle = styled.h3`
  font-size: 1.375rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 14px 0;
  letter-spacing: -0.02em;
`;

export const CardDescription = styled.p`
  font-size: 1rem;
  line-height: 1.65;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
  letter-spacing: -0.005em;
`;

export const FooterAction = styled.div`
  display: flex;
  justify-content: flex-start;
`;
