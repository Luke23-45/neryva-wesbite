import styled from 'styled-components';

/* ─── Full-viewport split hero wrapper ─── */
export const HeroWrapper = styled.section`
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  overflow: hidden;

  /* The right side dark background split */
  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 50%;
    background-color: #111520; /* Deep navy/slate matching the image */
    z-index: 0;
  }

  ${({ theme }) => theme.media.tablet} {
    &::after {
      width: 100%;
      top: 50%;
    }
  }
`;

/* ─── Content grid: two-column split ─── */
export const ContentGrid = styled.div`
  position: relative;
  z-index: 1;
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s8};
  max-width: ${({ theme }) => theme.containers.wide};
  width: 100%;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.s10} ${({ theme }) => theme.spacing.s5};

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing.s7};
    padding: ${({ theme }) => theme.spacing.s9} ${({ theme }) => theme.spacing.s5};
  }

  ${({ theme }) => theme.media.mobile} {
    padding: 96px ${({ theme }) => theme.spacing.s4} ${({ theme }) => theme.spacing.s7};
  }
`;

/* ─── Left column: text content ─── */
export const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s4};
`;

/* ─── Eyebrow label ─── */
export const Eyebrow = styled.div`
  display: inline-flex;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.s1};

  span {
    font-family: ${({ theme }) => theme.typography.fonts.mono};
    font-size: ${({ theme }) => theme.typography.sizes.label};
    font-weight: ${({ theme }) => theme.typography.weights.medium};
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(0, 0, 0, 0.4);
  }
`;

/* ─── Main headline ─── */
export const Headline = styled.h1`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: clamp(2.5rem, 5vw, 3.75rem);
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  line-height: ${({ theme }) => theme.typography.lineHeights.heading};
  letter-spacing: -0.03em;
  color: #000000;
  margin: 0;

  ${({ theme }) => theme.media.mobile} {
    font-size: clamp(2rem, 8vw, 2.5rem);
  }
`;

/* ─── Downward arrows ─── */
export const DownArrows = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: rgba(0, 0, 0, 0.25);
  margin: ${({ theme }) => theme.spacing.s2} 0;
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

/* ─── Description text ─── */
export const Description = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.typography.sizes.bodyLg};
  line-height: ${({ theme }) => theme.typography.lineHeights.bodyLg};
  color: #000000;
  margin: 0;
  max-width: 520px;

  ${({ theme }) => theme.media.mobile} {
    font-size: ${({ theme }) => theme.typography.sizes.body};
  }
`;

/* ─── CTA button group ─── */
export const CtaGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s4};
  margin-top: ${({ theme }) => theme.spacing.s5};

  ${({ theme }) => theme.media.mobile} {
    flex-direction: column;
    align-items: flex-start;
    gap: ${({ theme }) => theme.spacing.s3};
  }
`;

/* ─── Primary CTA: solid black ─── */
export const CtaPrimary = styled.a`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s2};
  padding: ${({ theme }) => theme.spacing.s3} ${({ theme }) => theme.spacing.s5};
  background: #000000;
  color: #ffffff;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.typography.sizes.small};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  line-height: 1;
  text-decoration: none;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: opacity ${({ theme }) => theme.transitions.fast}, transform ${({ theme }) => theme.transitions.fast};

  &:hover {
    opacity: 0.88;
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent.lilac};
    outline-offset: 2px;
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

/* ─── Right column: visual area ─── */
export const RightColumn = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  min-height: 480px;

  ${({ theme }) => theme.media.tablet} {
    min-height: 360px;
  }

  ${({ theme }) => theme.media.mobile} {
    min-height: 280px;
  }
`;

