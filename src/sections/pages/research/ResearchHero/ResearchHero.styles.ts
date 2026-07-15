import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/* ── The Master Grid ── */
export const Wrapper = styled.section`
  background-color: ${({ theme }) => theme.colors.background.primary};
  color: ${({ theme }) => theme.colors.text.primary};
  
  /* 
   * ADVANCED CSS GRID:
   * Col 1: Left gutter (expands on large screens, min 32px)
   * Col 2: Left content area (max 480px to constrain text)
   * Col 3: Right content area (max 720px)
   * Col 4: Right gutter (expands on large screens, min 32px)
   * Total max inner width = 1200px.
   */
  display: grid;
  grid-template-columns: 
    minmax(32px, 1fr) 
    minmax(0, 480px) 
    minmax(0, 720px) 
    minmax(32px, 1fr);
  
  padding-top: 80px; /* Deep spacing below navigation */
  overflow: hidden; /* Prevents horizontal scroll from the bleed */

  ${({ theme }) => theme.media.tablet} {
    /* On mobile, collapse to a simple 3-column grid (Gutter, Content, Gutter) */
    grid-template-columns: 24px 1fr 24px;
    padding-top: 120px;
  }
`;

/* ── Top Header Area ── */
export const HeaderArea = styled.div`
  /* Spans the two inner columns (2 and 3) to remain perfectly centered */
  grid-column: 2 / 4;
  margin-bottom: 56px;
  animation: ${fadeIn} 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;

  ${({ theme }) => theme.media.tablet} {
    grid-column: 2 / 3;
    margin-bottom: 40px;
  }
`;

export const MassiveTitle = styled.h1`
  font-size: clamp(3rem, 6vw, 5.5rem);
  font-weight: 500;
  line-height: 1.05;
  letter-spacing: -0.03em; /* Tight, premium tracking */
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
  max-width: 1000px;
`;

/* ── Structural Divider ── */
export const DividerLine = styled.div`
  /* Spans entirely across the screen, edge-to-edge */
  grid-column: 1 / 5;
  height: 1px;
  background: ${({ theme }) => theme.colors.border};

  ${({ theme }) => theme.media.tablet} {
    grid-column: 1 / 4;
  }
`;

/* ── Left Column (Text & UI) ── */
export const LeftContent = styled.div`
  grid-column: 2 / 3;
  padding: 80px 80px 80px 0; /* Heavy padding for editorial breathing room */
  display: flex;
  flex-direction: column;
  justify-content: center;

  ${({ theme }) => theme.media.tablet} {
    grid-column: 2 / 3;
    padding: 48px 0;
  }
`;

export const ArrowStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 32px;
  color: ${({ theme }) => theme.colors.text.muted};
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

export const HeroDescription = styled.p`
  font-size: 22px;
  line-height: 1.5;
  font-weight: 400;
  color: ${({ theme }) => theme.colors.text.primary};
  letter-spacing: -0.01em;
  margin: 0 0 48px 0;

  ${({ theme }) => theme.media.tablet} {
    font-size: 18px;
    margin-bottom: 32px;
  }
`;

export const CTAButton = styled.button`
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 16px 28px;
  background: ${({ theme }) => theme.colors.text.primary};
  color: ${({ theme }) => theme.colors.background.primary};
  border: none;
  border-radius: 6px; /* Stark, sharp corners mirroring the reference */
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

/* ── Right Column (The Infinite Bleed) ── */
export const RightBleed = styled.div`
  /* CRITICAL: Spans from the center line (col 3) to the absolute right edge (col 5) */
  grid-column: 3 / 5;
  
  /* 
   * We retain the original dark theme specifically for this block 
   * so your HeroMosaic still looks incredible and luminous.
   */
  background-color: #06101e; 
  display: flex;
  align-items: center;
  justify-content: center;
  
  /* Creates an inner frame for the mosaic */
  padding: 80px 80px 80px 80px; 

  ${({ theme }) => theme.media.tablet} {
    /* On mobile, it bleeds across the entire screen horizontally */
    grid-column: 1 / 4; 
    padding: 64px 24px;
  }
`;

/* ── Inner container for the Mosaic to maintain its intended proportions ── */
export const MosaicContainer = styled.div`
  width: 100%;
  max-width: 600px; /* Constrains the graphic so it doesn't stretch infinitely */
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.4), 
              0 0 0 1px rgba(255, 255, 255, 0.05);
`;