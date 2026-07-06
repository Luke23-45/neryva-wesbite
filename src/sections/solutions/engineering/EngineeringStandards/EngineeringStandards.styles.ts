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
  flex-direction: column;
  align-items: center;
`;

export const HeaderContent = styled.div`
  text-align: center;
  max-width: 680px;
  margin-bottom: 80px;
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

export const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  width: 100%;
  background-color: ${({ theme }) => theme.colors.borderLight};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: 1fr;
    gap: 0;
  }
`;

export const StandardCard = styled.div`
  background-color: #FFFFFF;
  padding: 56px 48px;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.background.secondary};
  }

  ${({ theme }) => theme.media.mobile} {
    padding: 40px 32px;
  }
`;

export const CardIconWrapper = styled.div`
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.text.strong};
  margin-bottom: 36px;

  svg {
    width: 100%;
    height: 100%;
    stroke-width: 1;
  }
`;

export const CardTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 20px;
  font-weight: 500;
  letter-spacing: -0.02em;
  color: ${({ theme }) => theme.colors.text.strong};
  margin: 0 0 16px;
`;

export const CardDescription = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 15px;
  line-height: 1.65;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
`;
