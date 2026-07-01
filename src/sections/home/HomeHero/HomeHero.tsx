import React from 'react';
import { ArrowDown } from 'lucide-react';
import styled from 'styled-components';
import {
  HeroWrapper,
  LeftColumn,
  RightColumn,
  LeftTop,
  LeftBottom,
  RightTop,
  RightBottom,
  Headline,
  Description,
  Crosshair,
  SmallTextLabel,
  NewsSection,
  NewsLabel,
  NewsCard,
  NewsImage,
  NewsTitle,
  NewsArrow,
  ArrowsContainer
} from './HomeHero.styles';

const PixelGridContainer = styled.div`
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  display: grid;
  z-index: 1;
`;

const PixelCell = styled.div<{ color: string }>`
  background-color: ${props => props.color};
`;

const GRID_COLS = 8;
const GRID_ROWS = 4;
const gridColors = [
  '#ff4c00', '#ff4c00', '#ff4c00', '#ff4c00', '#e60000', '#e60000', '#ff4c00', '#ff4c00',
  '#ff4c00', '#ff4c00', '#ff8c00', '#e60000', '#e60000', '#e60000', '#e60000', '#e60000',
  '#ff4c00', '#ff4c00', '#e60000', '#cc0000', '#cc0000', '#e60000', '#e60000', '#e60000',
  '#ff4c00', '#e60000', '#e60000', '#cc0000', '#e60000', '#ff4c00', '#ff8c00', '#ff4c00',
];

const NewsImageGradient = () => (
  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #ff7eb3 0%, #ff758c 50%, #4facfe 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
      <path d="M12 2L2 22h20L12 2zm0 4l6 12H6l6-12z" />
    </svg>
  </div>
);

export function HomeHero() {
  return (
    <HeroWrapper>
      <LeftColumn>
        <LeftTop>
          <Headline>
            Frontier AI.<br />
            In your hands.
          </Headline>
        </LeftTop>
        <LeftBottom>
          <PixelGridContainer style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`, gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)` }}>
            {gridColors.map((color, i) => (
              <PixelCell key={i} color={color} />
            ))}
          </PixelGridContainer>
          
          <Crosshair style={{ top: '2rem', left: '8rem', zIndex: 2 }} />

          <div style={{ position: 'absolute', bottom: '2rem', left: '2rem', zIndex: 2, display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <SmallTextLabel>FRONTIER AI</SmallTextLabel>
            <Crosshair style={{ position: 'relative' }} />
          </div>

          <div style={{ position: 'absolute', top: '2rem', right: '4rem', zIndex: 2, display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <Crosshair style={{ position: 'relative' }} />
            <SmallTextLabel>IN YOUR HANDS</SmallTextLabel>
          </div>

          <Crosshair style={{ bottom: '2rem', right: '8rem', zIndex: 2 }} />

          <div style={{ position: 'absolute', bottom: '1.5rem', right: '1.5rem', zIndex: 2 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="6" width="4" height="4" fill="black"/>
              <rect x="16" y="6" width="4" height="4" fill="black"/>
              <rect x="8" y="10" width="8" height="8" fill="black"/>
              <rect x="10" y="14" width="4" height="2" fill="white"/>
            </svg>
          </div>
        </LeftBottom>
      </LeftColumn>
      <RightColumn>
        <RightTop>
          <Description>
            We help organizations build<br />
            tailored AI systems to solve the<br />
            world's hardest problems.
          </Description>
        </RightTop>
        <RightBottom>
          <ArrowsContainer>
            <ArrowDown size={14} strokeWidth={2} />
            <ArrowDown size={14} strokeWidth={2} />
            <ArrowDown size={14} strokeWidth={2} />
          </ArrowsContainer>
          <NewsSection>
            <NewsLabel>FEATURED NEWS</NewsLabel>
            <NewsCard>
              <NewsImage background="transparent">
                <NewsImageGradient />
              </NewsImage>
              <NewsTitle>Introducing Mistral OCR 4</NewsTitle>
              <NewsArrow>
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                   <path d="M9 18l6-6-6-6" />
                 </svg>
              </NewsArrow>
            </NewsCard>
          </NewsSection>
        </RightBottom>
      </RightColumn>
    </HeroWrapper>
  );
}