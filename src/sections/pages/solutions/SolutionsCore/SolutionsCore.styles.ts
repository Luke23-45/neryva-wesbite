import styled from 'styled-components';

export const CoreWrapper = styled.section`
  padding: 160px 0;
  background-color: ${({ theme }) => theme.colors.background.primary};
  display: flex;
  flex-direction: column;
  gap: 160px; /* Massive spacing between major sections */

  ${({ theme }) => theme.media.tablet} {
    padding: 80px 0;
    gap: 96px;
  }
`;

/* ── Individual Product Area (Stacked Layout) ── */
export const ProductSection = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 40px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 64px; /* Space between Header and Grid */
`;

/* ── Top Header Area ── */
export const SectionHeader = styled.div`
  max-width: 680px; /* Constrains text width for perfect editorial readability */
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export const SectionTitle = styled.h2`
  font-size: 42px;
  line-height: 1.1;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
  letter-spacing: -0.03em;
  margin: 0;

  ${({ theme }) => theme.media.mobile} {
    font-size: 32px;
  }
`;

export const SectionDesc = styled.p`
  font-size: 18px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0 0 16px 0;
`;

export const CTAButton = styled.button`
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 14px 24px;
  background: ${({ theme }) => theme.colors.text.primary};
  color: ${({ theme }) => theme.colors.background.primary};
  border: none;
  border-radius: 6px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s ease, transform 0.2s ease;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
`;

/* ── The Master Full-Width Bento Grid ── */
export const BentoGrid = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(3, 240px); /* Explicit 3-row grid matching Mistral reference */

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: none;
    grid-auto-rows: minmax(200px, auto);
  }

  ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 1fr;
    grid-template-rows: none;
    grid-auto-rows: minmax(180px, auto);
  }
`;

export const GridCell = styled.div<{ $area: string }>`
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px dashed ${({ theme }) => theme.colors.border};
  margin: -1px 0 0 -1px; /* Collapses double borders seamlessly */
  padding: 40px;
  display: flex;
  flex-direction: column;
  grid-area: ${({ $area }) => $area};
  transition: background-color 0.3s ease;
  z-index: 1;
  position: relative;

  &:hover {
    background: rgba(0, 0, 0, 0.015);
    z-index: 2; /* Brings border to top on hover */
  }

  ${({ theme }) => theme.media.tablet} {
    grid-area: auto;
    padding: 32px;
  }
`;

export const DecorativeCell = styled.div<{ $area: string }>`
  background: #F4F3F0; /* Premium editorial beige from the Mistral reference */
  border: 1px dashed ${({ theme }) => theme.colors.border};
  margin: -1px 0 0 -1px;
  grid-area: ${({ $area }) => $area};
  z-index: 1;
  position: relative;

  ${({ theme }) => theme.media.tablet} {
    display: none; /* Hide decorative spacers on mobile to save vertical space */
  }
`;

/* Corner dots at grid line intersections — the Mistral signature detail */
export const CornerDot = styled.div<{ $top: string; $left: string }>`
  position: absolute;
  top: ${({ $top }) => $top};
  left: ${({ $left }) => $left};
  width: 6px;
  height: 6px;
  background: ${({ theme }) => theme.colors.text.primary};
  transform: translate(-50%, -50%);
  z-index: 20;
  pointer-events: none;

  ${({ theme }) => theme.media.tablet} {
    display: none;
  }
`;

/* Floating Decorative Diamonds at Intersections */
export const Diamond = styled.div<{ $top?: string; $left?: string; $right?: string; $bottom?: string }>`
  position: absolute;
  top: ${({ $top }) => $top || 'auto'};
  bottom: ${({ $bottom }) => $bottom || 'auto'};
  left: ${({ $left }) => $left || 'auto'};
  right: ${({ $right }) => $right || 'auto'};
  width: 24px;
  height: 24px;
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px dashed ${({ theme }) => theme.colors.border};
  transform: translate(-50%, -50%) rotate(45deg);
  z-index: 10;

  ${({ theme }) => theme.media.tablet} {
    display: none;
  }
`;

/* Internal beige decorative area for tall/spanning cards */
export const InternalDecor = styled.div`
  background: #F4F3F0;
  width: 100%;
  flex-shrink: 0;

  ${({ theme }) => theme.media.tablet} {
    min-height: 60px;
  }
`;

/* ── Card Typography ── */
export const IconBox = styled.div<{ $color: string }>`
  width: 32px;
  height: 32px;
  background: ${({ $color }) => $color};
  border-radius: 4px;
  margin-bottom: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
`;

export const CardTitle = styled.h3`
  font-size: 22px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
  letter-spacing: -0.01em;
  margin: auto 0 12px 0; /* Pushes text to the bottom of the card */
`;

export const CardDesc = styled.p`
  font-size: 15px;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
`;
