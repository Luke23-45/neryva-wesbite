import styled from 'styled-components';

export const HeroWrapper = styled.section`
  padding: 180px 0 120px 0;
  background-color: ${({ theme }) => theme.colors.background.primary};
  display: flex;
  justify-content: center;
  position: relative;
  overflow: hidden;

  ${({ theme }) => theme.media.tablet} {
    padding: 140px 0 80px 0;
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

export const Eyebrow = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 13px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text.muted};
  margin-bottom: 32px;
`;

export const Title = styled.h1`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 72px;
  font-weight: 500;
  letter-spacing: -0.05em;
  line-height: 1.05;
  color: ${({ theme }) => theme.colors.text.strong};
  text-align: center;
  max-width: 900px;
  margin: 0 0 40px 0;

  ${({ theme }) => theme.media.tablet} {
    font-size: 56px;
  }
  ${({ theme }) => theme.media.mobile} {
    font-size: 44px;
  }
`;

export const Description = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 22px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text.secondary};
  text-align: center;
  max-width: 700px;
  margin: 0 0 64px 0;

  ${({ theme }) => theme.media.mobile} {
    font-size: 18px;
  }
`;

export const HeroCta = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 20px 48px;
  background-color: ${({ theme }) => theme.colors.text.strong};
  color: ${({ theme }) => theme.colors.background.primary};
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 16px;
  font-weight: 500;
  text-decoration: none;
  border-radius: 1px; /* Pristine sharpness */
  transition: transform 0.3s ease, background-color 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    background-color: ${({ theme }) => theme.colors.text.primary};
  }

  svg {
    transition: transform 0.3s ease;
  }

  &:hover svg {
    transform: translateX(4px);
  }
`;

export const DiagramContainer = styled.div`
  width: 100%;
  max-width: 1000px;
  margin-top: 100px;
  padding: 60px;
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  background-color: ${({ theme }) => theme.colors.background.secondary};
  display: flex;
  justify-content: center;
  align-items: center;

  svg {
    width: 100%;
    max-width: 800px;
    height: auto;
    stroke-width: 1px;
    color: ${({ theme }) => theme.colors.text.strong};
  }

  ${({ theme }) => theme.media.mobile} {
    padding: 32px;
    margin-top: 60px;
  }
`;
