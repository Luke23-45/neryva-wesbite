import styled from 'styled-components';

export const HeroWrapper = styled.section`
  display: flex;
  width: 100%;
  min-height: calc(84vh - 72px);
  background-color: #ffffff;
  font-family: ${({ theme }) => theme.typography.fonts.sans};

  
  @media (max-width: 900px) {
    flex-direction: column;
    min-height: auto;
  }
`;

export const LeftColumn = styled.div`
  flex: 7;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #eaeaea;
    padding-top:1.5rem;
`;

export const RightColumn = styled.div`
  flex: 3;
  display: flex;
  flex-direction: column;
  background-color: #f5f4f0;
    padding-top:1.5rem;
`;

export const LeftTop = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  /* Aligns left padding with the wide container */
  padding: 5.5rem 4rem 4.5rem max(24px, calc((100vw - ${({ theme }) => theme.containers.wide}) / 2 + 24px));
  
  @media (max-width: 900px) {
    padding: 3.5rem 2rem 3rem;
  }
`;

export const Headline = styled.h1`
  max-width: 13.5ch;
  font-size: 6.2rem;
  font-weight: 500;
  line-height: 0.96;
  color: #000000;
  letter-spacing: -0.055em;
  margin: 0;
  text-wrap: balance;
`;

export const LeftBottom = styled.div`
  flex: 1;
  position: relative;
  min-height: 340px;
  background-color: #ff4c00;
  overflow: hidden;
`;

export const RightTop = styled.div`
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0.5rem 3rem 2.5rem;
  padding-bottom:3.3rem;

  border-bottom: 1px solid rgba(126, 126, 126, 0.5);

  @media (max-width: 900px) {
    padding: 2.5rem 2rem 1.5rem;
  }
`;

export const Description = styled.p`
  font-size: 1.4rem;
  line-height: 1.36;
  color: #000000;
  font-weight: 500;
  margin: 0;
  letter-spacing: -0.03em;

`;

export const RightBottom = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 2.5rem 4rem 3rem;
  
  @media (max-width: 900px) {
    padding: 1.5rem 2rem 3rem;
  }
`;

export const ArrowsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  margin-bottom: 2.5rem;
  color: #a0a0a0;
`;

export const NewsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

export const NewsLabel = styled.span`
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #888;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
`;

export const NewsCard = styled.div`
  display: flex;
  align-items: center;
  background: #ffffff;
  border: 1px solid #eaeaea;
  padding: 0;
  cursor: pointer;
  transition: border-color 0.2s ease;
  
  &:hover {
    border-color: #ccc;
  }
`;

export const NewsImage = styled.div<{ background: string }>`
  width: 60px;
  height: 60px;
  background: ${props => props.background};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-right: 1px solid #eaeaea;
`;

export const NewsTitle = styled.div`
  flex: 1;
  padding: 0 1rem;
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: #000000;
`;

export const NewsArrow = styled.div`
  width: 40px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-left: 1px solid #eaeaea;
  color: #000000;
`;

export const Crosshair = styled.div`
  width: 10px;
  height: 10px;
  position: absolute;

  &::before, &::after {
    content: '';
    position: absolute;
    background-color: rgba(255, 255, 255, 0.6);
  }
  
  &::before {
    top: 4px; left: 0; width: 10px; height: 2px;
  }
  &::after {
    top: 0; left: 4px; width: 2px; height: 10px;
  }
`;

export const SmallTextLabel = styled.span`
  font-family: monospace;
  font-size: 0.7rem;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.8);
`;
