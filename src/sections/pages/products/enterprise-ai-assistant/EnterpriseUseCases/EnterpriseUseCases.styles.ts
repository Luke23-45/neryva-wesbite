import styled from 'styled-components';

export const UseCasesSection = styled.section`
  padding: 120px 0;
  background-color: ${({ theme }) => theme.colors.background.primary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  ${({ theme }) => theme.media.tablet} {
    padding: 80px 0;
  }
`;

export const InnerContainer = styled.div`
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 40px;

  ${({ theme }) => theme.media.mobile} {
    padding: 0 24px;
  }
`;

/* ─── HEADER ─── */
export const HeaderBlock = styled.div`
  max-width: 600px;
  margin-bottom: 40px;
  display: flex;
  flex-direction: column;
`;

export const Subtitle = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: ${({ theme }) => theme.colors.text.muted};
  margin-bottom: 40px;
`;

export const Title = styled.h2`
  font-size: 56px;
  font-weight: 500;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: ${({ theme }) => theme.colors.text.primary};

  ${({ theme }) => theme.media.mobile} {
    font-size: 32px;
  }
`;

export const Description = styled.p`
  font-size: 18px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
`;

/* ─── MASTER BENTO GRID ─── */
export const BentoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: 280px; /* Force rows to have immense architectural weight */
  
  /* PERFECT 1PX BORDER TRICK */
  background-color: ${({ theme }) => theme.colors.border}; 
  gap: 1px;
  border: 1px solid ${({ theme }) => theme.colors.border};

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: 1fr;
    /* Reset heights and auto-rows on tablet for natural stacking */
    grid-auto-rows: minmax(200px, auto); 
  }
`;

/* ─── BENTO CELLS ─── */
export const BentoCell = styled.div<{ $layoutArea: string }>`
  background-color: ${({ theme }) => theme.colors.background.primary};
  padding: 40px;
  display: flex;
  flex-direction: column;
  
  /* Maps to exactly the string in the JSON payload (e.g., '1 / 1 / 3 / 2') */
  grid-area: ${({ $layoutArea }) => $layoutArea};

  /* Smooth subtle background transition to emulate hardware surface hover */
  transition: background-color 0.4s ease;
  &:hover {
    background-color: rgba(0, 0, 0, 0.015);
  }

  ${({ theme }) => theme.media.tablet} {
    grid-area: auto; /* Cancel specific positions, forces linear stacking */
    padding: 32px;
  }
`;

export const IconBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  /* Monolithic high-contrast styling */
  background: ${({ theme }) => theme.colors.text.primary};
  color: ${({ theme }) => theme.colors.background.primary};
  border-radius: 6px;
  margin-bottom: auto; /* This forces the text to drop to the bottom! */

  svg {
    width: 20px;
    height: 20px;
    stroke-width: 1.5px;
  }
`;

export const AppTitle = styled.h3`
  font-size: 24px;
  font-weight: 500;
  letter-spacing: -0.02em;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 24px 0 12px 0;
`;

export const AppDesc = styled.p`
  font-size: 15px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
  max-width: 90%;
`;