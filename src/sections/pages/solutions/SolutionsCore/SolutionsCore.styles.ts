import styled from 'styled-components';

export const CoreWrapper = styled.section`
  padding: ${({ theme }) => theme.spacing.s10} 0;
  background-color: ${({ theme }) => theme.colors.background.primary};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s11};

  ${({ theme }) => theme.media.tablet} {
    padding: ${({ theme }) => theme.spacing.s9} 0;
    gap: ${({ theme }) => theme.spacing.s9};
  }
`;

/* ── Individual Product Area (Stacked Layout) ── */
export const ProductSection = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 40px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 64px;
`;

/* ── Top Header Area ── */
export const SectionHeader = styled.div`
  max-width: 680px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  text-align: center;
`;

export const SectionFooter = styled.div`
  display: flex;
  justify-content: center;
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
  margin: 0;
`;

export const CTAButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 48px;
  padding: 0 24px;
  background: ${({ theme }) => theme.colors.text.primary};
  color: ${({ theme }) => theme.colors.background.primary};
  border: none;
  border-radius: 6px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  overflow: hidden;
`;

export const ButtonLabelText = styled.span`
  white-space: nowrap;
`;

export const IconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

/**
 * ── The Bento Grid ──
 *
 * This is NOT a uniform `repeat(N, 1fr)` grid. Reading the reference
 * screenshot pixel-by-pixel shows three distinct zones sitting on the
 * SAME row lines:
 *
 *   [ side col ] [ gap ] [ ...middle columns, flush together... ] [ gap ] [ side col ]
 *
 * Inside the middle zone, and inside each side column, adjacent cells
 * touch (their 1px dashed borders collapse via the `margin: -1px 0 0 -1px`
 * trick below) — that's the "graph paper" look. But the two side columns
 * float apart from the middle block with a real, visible gap. A single
 * `grid-template-columns: repeat(4, 1fr)` with one `gap` value can only
 * ever produce ONE of those two behaviors, never both at once — that
 * mismatch is why the previous attempt didn't match the reference.
 *
 * The fix: model the gap itself as two real grid tracks (`9%` each,
 * matching the ~9% ratio measured in the reference), so cells can opt in
 * or out of touching their neighbour just by which line they start/end on.
 *
 * Column line numbers (for $middleColumns = 2):
 *   1        2       3      4      5       6        7
 *   |--side--|--gap--|--mid--|--mid--|--gap--|--side--|
 */
export const BentoGrid = styled.div<{ $middleColumns: number; $rows: number }>`
  position: relative;
  display: grid;
  grid-template-columns:
    1fr
    5%
    repeat(${({ $middleColumns }) => $middleColumns}, 1fr)
    5%
    1fr;
  grid-template-rows: repeat(${({ $rows }) => $rows}, minmax(180px, auto));

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

/* ── Content cell (white, holds icon/title/description) ── */
export const GridCell = styled.div<{
  $col: string;
  $row: string;
}>`
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px dashed ${({ theme }) => theme.colors.border};
  margin: -1px 0 0 -1px; /* Collapses double borders with neighbours in the same zone */
  padding: 32px;
  display: flex;
  flex-direction: column;
  grid-column: ${({ $col }) => $col};
  grid-row: ${({ $row }) => $row};
  transition: background-color 0.3s ease;
  z-index: 1;
  position: relative;

  &:hover {
    background: rgba(0, 0, 0, 0.015);
    z-index: 2;
  }

  ${({ theme }) => theme.media.tablet} {
    grid-column: auto;
    grid-row: auto;
    padding: 32px;
  }
`;

/* ── Decorative beige filler — completes a side column visually ── */
export const DecorativeCell = styled.div<{ $col: string; $row: string }>`
  background: #f4f3f0;
  border: 1px dashed ${({ theme }) => theme.colors.border};
  margin: -1px 0 0 -1px;
  grid-column: ${({ $col }) => $col};
  grid-row: ${({ $row }) => $row};
  z-index: 1;
  position: relative;

  ${({ theme }) => theme.media.tablet} {
    display: none; /* Hide decorative spacers below desktop, save vertical space */
  }
`;

/* Small square dot marking a grid-line corner. Placed as a child of the
   cell whose corner it marks (that cell already has position: relative). */
export const CornerDot = styled.div<{ $corner: 'tl' | 'tr' | 'bl' | 'br' }>`
  position: absolute;
  width: 6px;
  height: 6px;
  background: ${({ theme }) => theme.colors.text.primary};
  z-index: 20;
  pointer-events: none;

  ${({ $corner }) =>
    $corner === 'tl'
      ? `top: 0; left: 0; transform: translate(-50%, -50%);`
      : $corner === 'tr'
        ? `top: 0; right: 0; transform: translate(50%, -50%);`
        : $corner === 'bl'
          ? `bottom: 0; left: 0; transform: translate(-50%, 50%);`
          : `bottom: 0; right: 0; transform: translate(50%, 50%);`}

  ${({ theme }) => theme.media.tablet} {
    display: none;
  }
`;

/* Invisible placeholder that lives in the blank row of a gap track, purely
   so a Diamond can be centered inside the real gap width (9%, not a fixed
   px value) regardless of viewport size. */
export const GapAnchor = styled.div<{ $col: string; $row: string }>`
  position: relative;
  grid-column: ${({ $col }) => $col};
  grid-row: ${({ $row }) => $row};

  ${({ theme }) => theme.media.tablet} {
    display: none;
  }
`;

/**
 * Floating diamond accent — the "Mistral signature detail".
 * Two placement modes, matched to what the reference actually shows:
 *  - "gap": centered in a GapAnchor, sitting exactly on the line between
 *     the blank row and the first occupied row of a side column.
 *  - "corner": pinned to the outer bottom corner of a cell, poking half
 *     outside the grid into the margin (used for the far corner accent).
 */
export const Diamond = styled.div<{ $placement: 'gap-bottom' | 'gap-top' | 'corner' }>`
  position: absolute;
  width: 24px;
  height: 24px;
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px dashed ${({ theme }) => theme.colors.border};
  z-index: 10;

  ${({ $placement }) => {
    switch ($placement) {
      /* Anchor sits in the blank row; diamond hangs off its BOTTOM edge —
         use when the blank row is ABOVE the filled cells (blank row 1). */
      case 'gap-bottom':
        return `top: 100%; left: 50%; transform: translate(-50%, -50%) rotate(45deg);`;
      /* Mirror case: blank row is BELOW the filled cells, so the diamond
         sits off the anchor's TOP edge instead. */
      case 'gap-top':
        return `bottom: 100%; left: 50%; transform: translate(-50%, 50%) rotate(45deg);`;
      /* Pinned to a cell's own outer bottom corner, poking outside the grid. */
      case 'corner':
      default:
        return `bottom: 0; right: 0; transform: translate(50%, 50%) rotate(45deg);`;
    }
  }}

  ${({ theme }) => theme.media.tablet} {
    display: none;
  }
`;

/* ── Card Typography ── */
export const IconBox = styled.div<{ $color: string }>`
  width: 32px;
  height: 32px;
  background: ${({ $color }) => $color};
  border-radius: 4px;
  margin-bottom: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
`;

export const CardTitle = styled.h3<{ $pushToBottom?: boolean }>`
  font-size: 20px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
  letter-spacing: -0.01em;
  margin: ${({ $pushToBottom }) => ($pushToBottom ? 'auto 0 12px 0' : '0 0 12px 0')};
`;

export const CardDesc = styled.p`
  font-size: 14px;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
`;