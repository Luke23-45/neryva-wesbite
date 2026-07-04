import styled from 'styled-components';

/* ─── Full-viewport dark hero wrapper ─── */
export const HeroWrapper = styled.section`
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #070B14;
  overflow: hidden;
`;

/* ─── Mesh gradient atmosphere overlay ─── */
export const MeshOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 80% 60% at 15% 20%, rgba(192, 132, 252, 0.08) 0%, transparent 60%),
    radial-gradient(ellipse 70% 50% at 85% 30%, rgba(37, 99, 235, 0.06) 0%, transparent 55%),
    radial-gradient(ellipse 60% 55% at 50% 80%, rgba(5, 227, 164, 0.05) 0%, transparent 50%),
    radial-gradient(ellipse 90% 70% at 80% 70%, rgba(168, 85, 247, 0.06) 0%, transparent 55%),
    radial-gradient(ellipse 50% 40% at 20% 60%, rgba(192, 132, 252, 0.04) 0%, transparent 45%);
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
  gap: ${({ theme }) => theme.spacing.s5};
`;

/* ─── Eyebrow label ─── */
export const Eyebrow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 14px;
  margin-bottom: ${({ theme }) => theme.spacing.s1};

  span {
    font-family: ${({ theme }) => theme.typography.fonts.mono};
    font-size: ${({ theme }) => theme.typography.sizes.label};
    font-weight: ${({ theme }) => theme.typography.weights.medium};
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.4);
  }

  &::before,
  &::after {
    content: '';
    display: block;
    width: 32px;
    height: 1px;
    background: rgba(255, 255, 255, 0.15);
  }
`;

/* ─── Main headline ─── */
export const Headline = styled.h1`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: clamp(2.5rem, 5vw, 3.75rem);
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  line-height: ${({ theme }) => theme.typography.lineHeights.heading};
  letter-spacing: -0.03em;
  color: #ffffff;
  margin: 0;

  ${({ theme }) => theme.media.mobile} {
    font-size: clamp(2rem, 8vw, 2.5rem);
  }
`;

/* ─── Description text ─── */
export const Description = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.typography.sizes.bodyLg};
  line-height: ${({ theme }) => theme.typography.lineHeights.bodyLg};
  color: rgba(255, 255, 255, 0.6);
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
  margin-top: ${({ theme }) => theme.spacing.s2};

  ${({ theme }) => theme.media.mobile} {
    flex-direction: column;
    align-items: flex-start;
    gap: ${({ theme }) => theme.spacing.s3};
  }
`;

/* ─── Primary CTA: solid lilac ─── */
export const CtaPrimary = styled.a`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s2};
  padding: ${({ theme }) => theme.spacing.s3} ${({ theme }) => theme.spacing.s5};
  background: ${({ theme }) => theme.colors.gradients.primary};
  color: #ffffff;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.typography.sizes.small};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  line-height: 1;
  text-decoration: none;
  border-radius: ${({ theme }) => theme.radii.md};
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
`;

/* ─── Secondary CTA: outlined white ─── */
export const CtaSecondary = styled.a`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s2};
  padding: ${({ theme }) => theme.spacing.s3} ${({ theme }) => theme.spacing.s5};
  background: transparent;
  color: rgba(255, 255, 255, 0.85);
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.typography.sizes.small};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  line-height: 1;
  text-decoration: none;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid rgba(255, 255, 255, 0.18);
  cursor: pointer;
  transition: border-color ${({ theme }) => theme.transitions.fast}, color ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: rgba(255, 255, 255, 0.4);
    color: #ffffff;
  }

  &:focus-visible {
    outline: 2px solid rgba(255, 255, 255, 0.5);
    outline-offset: 2px;
  }
`;

/* ─── Trust bar ─── */
export const TrustBar = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s4};
  margin-top: ${({ theme }) => theme.spacing.s6};
  padding-top: ${({ theme }) => theme.spacing.s5};
  border-top: 1px solid rgba(255, 255, 255, 0.06);

  ${({ theme }) => theme.media.mobile} {
    margin-top: ${({ theme }) => theme.spacing.s5};
    padding-top: ${({ theme }) => theme.spacing.s4};
  }
`;

export const TrustLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.typography.sizes.label};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.25);
  white-space: nowrap;
`;

export const TrustLogos = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s5};

  ${({ theme }) => theme.media.mobile} {
    gap: ${({ theme }) => theme.spacing.s4};
  }
`;

export const TrustDot = styled.span`
  width: 4px;
  height: 4px;
  border-radius: ${({ theme }) => theme.radii.round};
  background: rgba(255, 255, 255, 0.12);
  flex-shrink: 0;
`;

export const TrustLogoPlaceholder = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.typography.sizes.small};
  color: rgba(255, 255, 255, 0.25);
  letter-spacing: 0.02em;
  white-space: nowrap;
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

/* ─── Scroll hint ─── */
export const ScrollHint = styled.div`
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  z-index: 1;

  ${({ theme }) => theme.media.mobile} {
    bottom: 24px;
  }
`;

export const ScrollLine = styled.div`
  width: 1px;
  height: 36px;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.2), transparent);
`;

export const ScrollLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.2);
`;
