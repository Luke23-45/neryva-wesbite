import styled from 'styled-components';

export const HeroWrapper = styled.section`
  position: relative;
  padding: 200px 0 140px;
  background-color: #050505;
  display: flex;
  justify-content: center;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 80% 50% at 50% -20%, rgba(5, 227, 164, 0.08) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 80% 80%, rgba(37, 99, 235, 0.04) 0%, transparent 50%);
    pointer-events: none;
  }

  ${({ theme }) => theme.media.tablet} {
    padding: 160px 0 100px;
  }

  ${({ theme }) => theme.media.mobile} {
    padding: 140px 0 80px;
  }
`;

export const InnerContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 1200px;
  padding: 0 ${({ theme }) => theme.spacing.s5};
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const Eyebrow = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #05E3A4;
  margin-bottom: 40px;
  opacity: 0.9;
`;

export const Title = styled.h1`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: clamp(40px, 6vw, 80px);
  font-weight: 500;
  letter-spacing: -0.04em;
  line-height: 1.02;
  color: #F8FAFC;
  text-align: center;
  max-width: 900px;
  margin: 0 0 40px;

  ${({ theme }) => theme.media.mobile} {
    font-size: 40px;
    letter-spacing: -0.03em;
  }
`;

export const Description = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 19px;
  line-height: 1.65;
  color: #94A3B8;
  text-align: center;
  max-width: 640px;
  margin: 0 0 56px;

  ${({ theme }) => theme.media.mobile} {
    font-size: 17px;
  }
`;

export const HeroCta = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 16px 40px;
  background-color: #05E3A4;
  color: #050505;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 15px;
  font-weight: 500;
  letter-spacing: -0.01em;
  text-decoration: none;
  border-radius: 2px;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    background-color: #34EABB;
    box-shadow: 0 0 40px rgba(5, 227, 164, 0.2);
    transform: translateY(-1px);
  }

  svg {
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  &:hover svg {
    transform: translateX(3px);
  }
`;

export const DiagramContainer = styled.div`
  width: 100%;
  max-width: 960px;
  margin-top: 120px;
  padding: 56px 64px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);
  border-radius: 2px;
  display: flex;
  justify-content: center;
  align-items: center;

  svg {
    width: 100%;
    max-width: 800px;
    height: auto;
    color: #CBD5E1;
  }

  ${({ theme }) => theme.media.mobile} {
    padding: 32px 24px;
    margin-top: 80px;
  }
`;
