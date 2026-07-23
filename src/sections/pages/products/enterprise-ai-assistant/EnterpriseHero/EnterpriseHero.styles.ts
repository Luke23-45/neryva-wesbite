import styled from 'styled-components';

/* ─── Master Container — stacks rows vertically, 1px gap between them ─── */
export const HeroWrapper = styled.section`
  position: relative;
  width: 100%;
  background-color: ${({ theme }) => theme.colors.border};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;
  gap: 1px;
`;

/* ─── Row 1: existing 65/35 split ─── */
export const Row1 = styled.div`
  display: grid;
  grid-template-columns: 65fr 35fr;
  gap: 1px;
  background-color: ${({ theme }) => theme.colors.border};

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: 1fr;
  }
`;

/* ─── Row 2: 40/60 split ─── */
export const Row2 = styled.div`
  display: grid;
  grid-template-columns: 45fr 55fr;
  gap: 1px;
  background-color: ${({ theme }) => theme.colors.border};

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: 1fr;
  }
`;

/* ─── Row 1: Left Cell (Massive Typography) ─── */
export const CellTopLeft = styled.div`
  background: #ffffff; /* Bright white base */
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  /* Massive breathing room, aligned precisely with standard premium margins */
  padding: 150px 80px 48px 80px;

  ${({ theme }) => theme.media.tablet} {
    padding: 140px 40px 40px 40px;
  }
  
  ${({ theme }) => theme.media.mobile} {
    padding: 120px 24px 32px 24px;
  }
`;

/* Editorial Breadcrumb / Eyebrow */
export const Eyebrow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 25px;

  span {
    font-family: ${({ theme }) => theme.typography.fonts.mono};
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: ${({ theme }) => theme.colors.text.muted};
  }

  ${({ theme }) => theme.media.mobile} {
    margin-bottom: 24px;
  }
`;

export const Headline = styled.h1`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
font-size: clamp(2.25rem, 4.5vw, 4rem);
  font-weight: 500;
  line-height: 1.05;
  letter-spacing: -0.04em; /* Tight, premium tracking */
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
  white-space: pre-line;
`;

/* ─── Row 1: Right Cell (Editorial Sidebar) ─── */
export const CellTopRight = styled.div`
  background: #fcfcfc; /* Barely off-white for structural contrast */
  display: flex;
  flex-direction: column;
  justify-content: flex-end; /* Baselines align mathematically with the Headline */
  padding: 160px 64px 48px 64px;

  ${({ theme }) => theme.media.tablet} {
    padding: 40px;
    background: #ffffff;
  }
  
  ${({ theme }) => theme.media.mobile} {
    padding: 32px 24px;
  }
`;

export const SidebarMetric = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 16px;
  line-height: 1.5;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
`;

/* ─── Row 2: Left Cell (Narrative + CTA) ─── */
export const CellBottomLeft = styled.div`
  background: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: center; /* PERFECT VERTICAL CENTERING */
  padding: 80px; /* Equal padding ensures the mathematical center is visually accurate */

  ${({ theme }) => theme.media.tablet} {
    padding: 64px 40px;
  }

  ${({ theme }) => theme.media.mobile} {
    padding: 48px 24px;
  }
`;

export const Description = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 20px;
  line-height: 1.6;
  font-weight: 400;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0 0 40px 0;
  max-width: 600px; /* Forces optimal reading width regardless of window size */

  ${({ theme }) => theme.media.mobile} {
    font-size: 18px;
    margin-bottom: 32px;
  }
`;

export const CtaGroup = styled.div`
  display: flex;
  align-items: center;
`;


/* ─── Row 2: Right Cell (Dark Visual Panel) ─── */
export const CellBottomRight = styled.div`
  background: #090e15; /* Reintroduced the deep structural navy/black for contrast */
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;

  ${({ theme }) => theme.media.tablet} {
    min-height: 400px;
  }

  ${({ theme }) => theme.media.mobile} {
    min-height: 320px;
  }
`;