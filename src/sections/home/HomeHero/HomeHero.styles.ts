import styled from 'styled-components';

export const HeroWrapper = styled.section`
  display: flex;
  width: 100%;
  min-height: calc(100vh - 72px);
  background-color: #ffffff;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  
  @media (max-width: 900px) {
    flex-direction: column;
  }
`;

export const LeftColumn = styled.div`
  flex: 7;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #eaeaea;
`;

export const RightColumn = styled.div`
  flex: 3;
  display: flex;
  flex-direction: column;
  background-color: #f5f4f0;
`;

export const LeftTop = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  padding: 8rem 4rem;
  
  @media (max-width: 900px) {
    padding: 4rem 2rem;
  }
`;

export const Headline = styled.h1`
  font-size: clamp(4rem, 8vw, 7rem);
  font-weight: 500;
  line-height: 1.05;
  color: #000000;
  letter-spacing: -0.04em;
  margin: 0;
`;

export const LeftBottom = styled.div`
  flex: 1;
  position: relative;
  min-height: 400px;
  background-color: #ff4c00;
  overflow: hidden;
`;

export const RightTop = styled.div`
  flex: 1;
  display: flex;
  align-items: flex-end;
  padding: 4rem;
  
  @media (max-width: 900px) {
    padding: 4rem 2rem 2rem 2rem;
  }
`;

export const Description = styled.p`
  font-size: 1.25rem;
  line-height: 1.4;
  color: #000000;
  font-weight: 400;
  margin: 0;
  letter-spacing: -0.01em;
`;

export const RightBottom = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 4rem;
  
  @media (max-width: 900px) {
    padding: 2rem 2rem 4rem 2rem;
  }
`;

export const ArrowsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 4rem;
  color: #a0a0a0;
`;

export const NewsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const NewsLabel = styled.span`
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #888;
  font-family: monospace;
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
  font-size: 0.9rem;
  font-weight: 500;
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
    background-color: #000000;
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
  color: #000000;
`;