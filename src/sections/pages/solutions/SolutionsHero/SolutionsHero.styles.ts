import styled from 'styled-components';

export const HeroWrapper = styled.section`
  position: relative;
  min-height: 90vh; /* Deep full-screen canvas */
  width: 100%;
  display: flex;
  background-color: #fafaf9; /* A supremely premium, ultra-light warm white/eggshell */
  overflow: hidden;

  /* 
   * THE STATE-OF-THE-ART TOUCH: 
   * Very faint architectural vertical grid lines running through the entire background.
   * Matches the visual reference background exactly.
   */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background-image: linear-gradient(to right, rgba(0, 0, 0, 0.03) 1px, transparent 1px);
    background-size: 16.666vw 100%; /* Six architectural columns */
  }

  ${({ theme }) => theme.media.tablet} {
    min-height: auto;
    flex-direction: column;
    padding-bottom: 80px;
    background-size: 25vw 100%;
  }
`;

export const InnerGrid = styled.div`
  width: 100%;
  max-width: ${({ theme }) => theme.containers.wide};
  margin: 0 auto;
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 50fr 50fr; /* 55% Text dominance on left */

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: 1fr;
  }
`;

/* ─── LEFT: TYPOGRAPHICAL MATRIX ─── */
export const ContentColumn = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 60px 80px 160px 40px; 
  /* Left padding explicitly respects the grid logic */

  ${({ theme }) => theme.media.tablet} {
    padding: 120px 24px 80px 24px;
  }
`;

export const Eyebrow = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.5); /* Precise faded tone */
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 25px; 
`;

export const Title = styled.h1`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  
  /* Uncompromising, brutal scale based exactly on the image */
  font-size: 3.8rem;
  font-weight: 500;
  
  /* CRITICAL FOR "NO SLOP" DESIGN: Extreme leading and kerning bounds */
  line-height: 1.0; 
  letter-spacing: -0.04em; 
  
  color: #000000;
  margin: 0;
  max-width: 960px;
  white-space: pre-wrap; /* Forces the newline breaks exactly from JSON */

  ${({ theme }) => theme.media.tablet} {
    font-size: clamp(2.5rem, 8vw, 4rem);
    letter-spacing: -0.02em;
    line-height: 1.05;
  }
`;

export const TripleArrowCluster = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px; /* Strict tiny gap */
  margin: 60px 0; /* Massive breathing room as seen in image */
  color: rgba(0, 0, 0, 0.25);
  
  svg {
    width: 14px;
    height: 14px;
    stroke-width: 2px;
  }
`;

export const Description = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  
  /* Notice the heavy scale compared to traditional P tags */
  font-size: 20px;
  font-weight: 500;
  line-height: 1.5;
  letter-spacing: -0.02em; 
  
  color: #111111;
  margin: 0 0 25px 0;
  max-width: 780px;

  ${({ theme }) => theme.media.tablet} {
    font-size: 20px;
    margin-bottom: 40px;
  }
  ${({ theme }) => theme.media.mobile} {
    font-size: 18px;
  }
`;

export const SolidCta = styled.a`
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  
  background-color: #050505;
  color: #ffffff;
  
  padding: 18px 24px;
  border-radius: 6px;
  
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 16px;
  font-weight: 600;
  line-height: 1;
  text-decoration: none;
  cursor: pointer;
  overflow: hidden;

  &:hover {
    color: #ffffff;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

export const ButtonLabelText = styled.span`
  white-space: nowrap;
`;

export const IconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

/* ─── RIGHT: VISUAL AREA ─── */
export const VisualColumn = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Visual sits perfectly flushed inside the right 45% grid limit */
  
  ${({ theme }) => theme.media.tablet} {
    min-height: 480px;
  }
`;