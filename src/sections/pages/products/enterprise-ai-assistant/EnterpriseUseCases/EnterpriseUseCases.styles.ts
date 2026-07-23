import styled from 'styled-components';
import { motion } from 'framer-motion';

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
  margin-bottom: 40px;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.accent.azure}, ${({ theme }) => theme.colors.accent.emerald});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

export const Title = styled.h2`
  font-size: 56px;
  font-weight: 500;
  line-height: 1.1;
  letter-spacing: -0.03em;
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

/* Defined BEFORE BentoCell so the styled-components interpolation
   inside BentoCell's hover selector can resolve it without hitting TDZ. */
export const IconBox = styled.div<{ $colorType?: 'azure' | 'emerald' | 'lilac' | 'amethyst' }>`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: auto;

  color: ${({ theme, $colorType }) =>
    $colorType ? theme.colors.accent[`${$colorType}Text`] : theme.colors.text.primary};

  svg {
    width: 48px;
    height: 48px;
    stroke-width: 1.5px;
  }
`;

/* ─── BENTO CELLS ─── */
export const BentoCell = styled.div<{ $layoutArea: string; $isActive: boolean }>`
  background-color: ${({ $isActive }) => ($isActive ? '#FFFFFF' : '#f5f4ef')};
  display: flex;
  flex-direction: column;
  position: relative;

  /* Maps to exactly the string in the JSON payload (e.g., '1 / 1 / 3 / 2') */
  grid-area: ${({ $layoutArea }) => $layoutArea};

  /* Sophisticated elevation and micro-interaction on hover */
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.06);
    z-index: 1; /* Elevate slightly over adjacent cells */
  }

  ${({ theme }) => theme.media.tablet} {
    grid-area: auto; /* Cancel specific positions, forces linear stacking */
  }
`;

/* ─── CELL INNER PADDING WRAPPER ───.
   Padding lives here so the absolutely-positioned ProgressBar
   can sit flush against the cell's outer edges, including over the padding zone. */
export const CellInner = styled.div`
  padding: 40px;
  display: flex;
  flex-direction: column;
  flex: 1;

  ${({ theme }) => theme.media.tablet} {
    padding: 32px;
  }
`;

/* ─── ACTIVE-CARD PROGRESS BAR ───.
   3px medium-height bar anchored at the cell's top edge.
   Track is a faint neutral; the fill carries a premium fire-to-gold gradient
   so the active card visibly "glows" as the bar sweeps across. */
export const ProgressBarTrack = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background-color: rgba(0, 0, 0, 0.06);
  overflow: hidden;
`;

export const ProgressBarFill = styled(motion.div)`
  height: 100%;
  width: 100%;
  background: linear-gradient(
    90deg,
    #DC2626 0%,
    #EA580C 50%,
    #F59E0B 100%
  );
  transform-origin: left center;
`;

export const AppTitle = styled.h3`
  font-size: 24px;
  font-weight: 500;
  letter-spacing: -0.03em;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 24px 0 12px 0;
`;

export const AppDesc = styled.p`
  font-size: 15px;
  line-height: 1.7;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
  max-width: 90%;
`;
