import { ArrowDown } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { PixelGrid } from '@assets/visual/home/hero/PixelGrid';
import heroData from '@neryva_data/home/sections/hero.json';
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
            {heroData.hero.headline.line1}<br />
            {heroData.hero.headline.line2}
          </Headline>
        </LeftTop>
        <LeftBottom>
          <PixelGrid />

          <Crosshair style={{ top: '2rem', left: '8rem', zIndex: 2 }} />

          <div style={{ position: 'absolute', bottom: '2rem', left: '2rem', zIndex: 2, display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <SmallTextLabel>{heroData.hero.labels.bottomLeft}</SmallTextLabel>
            <Crosshair style={{ position: 'relative' }} />
          </div>

          <div style={{ position: 'absolute', top: '2rem', right: '4rem', zIndex: 2, display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <Crosshair style={{ position: 'relative' }} />
            <SmallTextLabel>{heroData.hero.labels.topRight}</SmallTextLabel>
          </div>

          <Crosshair style={{ bottom: '2rem', right: '8rem', zIndex: 2 }} />

          <div style={{ position: 'absolute', bottom: '1.5rem', right: '1.5rem', zIndex: 2 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="6" width="4" height="4" fill="rgba(255, 255, 255, 0.8)" />
              <rect x="16" y="6" width="4" height="4" fill="rgba(255, 255, 255, 0.8)" />
              <rect x="8" y="10" width="8" height="8" fill="rgba(255, 255, 255, 0.8)" />
              <rect x="10" y="14" width="4" height="2" fill="white" />
            </svg>
          </div>
        </LeftBottom>
      </LeftColumn>
      <RightColumn>
        <RightTop>
          <Description>
            {heroData.hero.description}
          </Description>
        </RightTop>
        <RightBottom>
          <ArrowsContainer>
            <ArrowDown size={14} strokeWidth={2} />
            <ArrowDown size={14} strokeWidth={2} />
            <ArrowDown size={14} strokeWidth={2} />
          </ArrowsContainer>
          <NewsSection>
            <NewsLabel>{heroData.hero.featured.label}</NewsLabel>
            <NewsCard as={Link} to={heroData.hero.featured.href}>
              <NewsImage background="transparent">
                <NewsImageGradient />
              </NewsImage>
              <NewsTitle>{heroData.hero.featured.title}</NewsTitle>
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
