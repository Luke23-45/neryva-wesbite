import styled from 'styled-components';

/* ═══════════════════════════════════════════════════
   BlogDetailHero — Full-width mosaic banner +
   article metadata strip below.
═══════════════════════════════════════════════════ */

export const HeroWrapper = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

/* ── Mosaic visual area ── */
export const HeroMosaic = styled.div`
  width: 100%;
  height: 480px;
  overflow: hidden;
  position: relative;

  ${({ theme }) => theme.media.tablet} {
    height: 360px;
  }
  ${({ theme }) => theme.media.mobile} {
    height: 260px;
  }
`;

export const HeroMosaicOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    transparent 40%,
    rgba(0, 0, 0, 0.52) 100%
  );
  pointer-events: none;
`;

/* ── Category badge on top of mosaic ── */
export const HeroCategoryBadge = styled.span`
  position: absolute;
  top: 28px;
  left: 32px;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.22);
  padding: 5px 10px;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);

  ${({ theme }) => theme.media.mobile} {
    font-size: 10px;
  }
`;

/* ── Meta strip below mosaic ── */
export const HeroMeta = styled.div`
  display: flex;
  align-items: stretch;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  height: 52px;
  background: ${({ theme }) => theme.colors.background.primary};
`;

export const HeroMetaCell = styled.div`
  display: flex;
  align-items: center;
  padding: 0 24px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text.secondary};
  border-right: 1px solid ${({ theme }) => theme.colors.border};

  &:last-child {
    border-right: none;
    margin-left: auto;
  }

  ${({ theme }) => theme.media.mobile} {
    font-size: 11px;
  }
`;

export const HeroMetaLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text.muted};
  margin-right: 10px;

  ${({ theme }) => theme.media.mobile} {
    font-size: 10px;
  }
`;

/* ── Title section below meta ── */
export const HeroTitleSection = styled.div`
  max-width: ${({ theme }) => theme.containers.page};
  margin: 0 auto;
  padding: 64px ${({ theme }) => theme.spacing.s5} 56px;

  ${({ theme }) => theme.media.mobile} {
    padding: 40px ${({ theme }) => theme.spacing.s4} 36px;
  }
`;

export const HeroCategory = styled.span`
  display: inline-block;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text.muted};
  margin-bottom: 20px;

  ${({ theme }) => theme.media.mobile} {
    font-size: 10px;
  }
`;

export const HeroTitle = styled.h1`
  font-size: clamp(2rem, 4.5vw, 3.25rem);
  font-weight: 500;
  line-height: 1.12;
  letter-spacing: -0.03em;
  color: ${({ theme }) => theme.colors.text.strong};
  max-width: 820px;
  margin: 0 0 24px 0;
`;

export const HeroSummary = styled.p`
  font-size: 1.125rem;
  line-height: 1.7;
  color: ${({ theme }) => theme.colors.text.secondary};
  max-width: ${({ theme }) => theme.containers.prose};
  margin: 0;

  ${({ theme }) => theme.media.mobile} {
    font-size: 0.95rem;
  }
`;
