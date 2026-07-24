import styled from 'styled-components';

export const CtaWrapper = styled.section`
  position: relative;
  width: 100%;
  margin-top: 110px;
  /* Blazing Signature Orange */
  background-color: #FF5A20; 
  
  /* CRITICAL: Hardware Grain Texture Overlay. This is the difference between HTML and "Material" */
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.12'/%3E%3C/svg%3E");
  background-repeat: repeat;

  /* Immense cinematic breathing room */
  padding: 90px 0;
  display: flex;
  justify-content: center;

  ${({ theme }) => theme.media.tablet} {
    padding: 100px 0;
  }
`;

export const InnerGrid = styled.div`
  width: 100%;
  max-width: 1536px;
  padding: 0 40px;
  
  /* Hardware weight-balancing layout */
  display: flex;
  justify-content: space-between;
  align-items: flex-end; /* Pins buttons mathematically to the baseline of the typography block */

  ${({ theme }) => theme.media.tablet} {
    flex-direction: column;
    align-items: flex-start;
    gap: 64px;
    padding: 0 24px;
  }
`;

/* ── LEFT: MONUMENTAL TYPOGRAPHY ── */
export const TextColumn = styled.div`
  max-width: 860px; /* Constrains title line-breaks identically to the reference */
  display: flex;
  flex-direction: column;
`;

export const Eyebrow = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.95);
`;

export const Title = styled.h2`
  padding-top: 15px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 2.4rem;
  font-weight: 500;
  letter-spacing: -0.03em;
  line-height: 1.05;
  color: #FFFFFF;
  margin: 0;
  max-width: 70%;

  ${({ theme }) => theme.media.mobile} {
    font-size: clamp(2.5rem, 8vw, 3rem);
    line-height: 1.1;
  }
`;

/* ── RIGHT: STRUCTURAL BUTTONS ── */
export const ButtonGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;

  ${({ theme }) => theme.media.mobile} {
    width: 100%;
    flex-direction: column;
    gap: 12px;
  }
`;

/* Strict, geometric hardware-style toggle mapping */
export const CtaAction = styled.a<{ $variant: 'white' | 'black' }>`
  display: inline-flex;
  align-items: center;
  /* Target the embedded pixel arrow SVG to mimic hover physics safely */
  svg {
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  
  &:hover svg {
    transform: translateX(4px);
  }
`;