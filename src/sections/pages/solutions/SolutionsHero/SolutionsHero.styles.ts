import styled from 'styled-components';

/**
 * ════════════════════════════════════════════════════════════════════
 *  SolutionsHero
 *  Premium, editorial hero for the Solutions landing page.
 *
 *  Pattern mirrors the gold-standard ResearchHero: a 12-col CSS grid
 *  with two distinct content tracks (text + visual) sharing a hairline
 *  divider, with strict typographic rhythm.
 * ════════════════════════════════════════════════════════════════════
 */

export const HeroWrapper = styled.section`
  /* Two-track, edge-to-edge layout. Both columns stretch to the full
     viewport height so the divider line runs the full height. */
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: calc(100vh - 80px);
  background-color: ${({ theme }) => theme.colors.background.primary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: 1fr;
    min-height: auto;
  }
`;

/* ── Text track ─────────────────────────────────────────────────── */
export const ContentColumn = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 120px 88px;

  /* The hairline that defines the split — taller on desktop, collapses
     to a horizontal divider on mobile so the editorial feel survives. */
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  position: relative;

  ${({ theme }) => theme.media.desktop} {
    padding: 100px 64px;
  }

  ${({ theme }) => theme.media.tablet} {
    border-right: none;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    padding: 72px 40px 64px;
  }

  ${({ theme }) => theme.media.mobile} {
    padding: 56px 24px 48px;
  }
`;

/* ── Visual track ───────────────────────────────────────────────── */
export const VisualColumn = styled.div`
  /* Sits inside its half, full-bleed. Position context for the SVG. */
  position: relative;
  overflow: hidden;
  background-color: ${({ theme }) => theme.colors.background.secondary};

  /* Layered ambient light — two off-centre radial gradients use the
     brand palette at low opacity to give the schematic a subtle,
     premium warmth without competing with the left-side text. */
  background-image:
    radial-gradient(ellipse 60% 50% at 22% 12%, rgba(192, 132, 252, 0.10), transparent 60%),
    radial-gradient(ellipse 70% 55% at 80% 88%, rgba(5, 227, 164, 0.06), transparent 65%);

  ${({ theme }) => theme.media.tablet} {
    min-height: 480px;
  }

  ${({ theme }) => theme.media.mobile} {
    min-height: 360px;
  }
`;

/* ── Eyebrow — small mono caps with a leading rule ───────────────── */
export const Eyebrow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s3};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.typography.sizes.small};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0 0 ${({ theme }) => theme.spacing.s5} 0;

  /* The leading rule — sets the eyebrow as a tight, telegraphed line
     that reads like a Bloomberg-terminal section header. */
  &::before {
    content: '';
    display: inline-block;
    width: 28px;
    height: 1px;
    background-color: ${({ theme }) => theme.colors.text.muted};
    flex-shrink: 0;
  }
`;

/* ── Title — display magnitude with tight, premium tracking ─────── */
export const Title = styled.h1`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: clamp(3rem, 6vw, 5.25rem);
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  line-height: 1.04;
  letter-spacing: -0.035em;
  color: ${({ theme }) => theme.colors.text.primary};
  max-width: 820px;
  margin: 0 0 ${({ theme }) => theme.spacing.s6} 0;

  ${({ theme }) => theme.media.mobile} {
    font-size: clamp(2.5rem, 9vw, 3.25rem);
    letter-spacing: -0.03em;
  }
`;

/* ── Description — first-thing-readable body copy ──────────────── */
export const Description = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 20px;
  line-height: 1.55;
  font-weight: ${({ theme }) => theme.typography.weights.regular};
  letter-spacing: -0.01em;
  color: ${({ theme }) => theme.colors.text.primary};
  max-width: 540px;
  margin: 0;

  ${({ theme }) => theme.media.mobile} {
    font-size: 17px;
    line-height: 1.6;
  }
`;

/* ── Scroll indicator — minimalist "explore" CTA ──────────────── */
export const ScrollIndicator = styled.a`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s3};
  margin-top: ${({ theme }) => theme.spacing.s8};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.typography.sizes.small};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text.primary};
  text-decoration: none;
  cursor: pointer;

  /* Lift, arrow nudge, color transitions. */
  transition:
    color ${({ theme }) => theme.transitions.fast} ease,
    gap ${({ theme }) => theme.transitions.fast} ease;

  svg {
    width: 16px;
    height: 16px;
    transition: transform ${({ theme }) => theme.transitions.fast} ease;
  }

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
    gap: ${({ theme }) => theme.spacing.s4};

    /* The arrow nudges toward the destination — telegraphed motion. */
    svg {
      transform: translateX(2px);
    }
  }

  ${({ theme }) => theme.media.mobile} {
    margin-top: ${({ theme }) => theme.spacing.s7};
  }
`;
