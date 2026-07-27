import styled from 'styled-components';

export const FlexContainer = styled.div`
  display: flex;
  align-items: flex-start;
  /* Generous spacing between the sticky sidebar and the main content pipeline */
  gap: 64px;

  ${({ theme }) => theme.media.tablet} {
    flex-direction: column;
    gap: 32px;
  }
`;

export const Sidebar = styled.nav`
  width: 240px;
  flex-shrink: 0;
  position: sticky;
  top: 120px; /* Ample space below the header */
  display: flex;
  flex-direction: column;
  /* Subtle bounding box reflecting the reference image */
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  background: ${({ theme }) => theme.colors.background.primary};
  overflow: hidden;

  ${({ theme }) => theme.media.tablet} {
    width: 100%;
    position: static;
    flex-direction: row;
    overflow-x: auto;
    border-radius: 0;
    border-left: none;
    border-right: none;
  }
`;

export const SidebarItem = styled.button<{ $active: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 14px;
  padding: 16px 20px;
  width: 100%;
  border: none;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: transparent;
  cursor: pointer;

  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 15px;
  line-height: 1.4;
  letter-spacing: -0.01em;
  text-align: left;

  /* Active state typography adjustments */
  font-weight: ${({ $active, theme }) =>
    $active ? theme.typography.weights.medium : theme.typography.weights.regular};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.text.primary : theme.colors.text.secondary};

  transition: all ${({ theme }) => theme.transitions.fast};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.background.secondary};
  }

  /* Pixel-perfect recreation of the active right-arrow from the screenshot */
  ${({ $active }) => $active && `
    &::after {
      content: '➔';
      font-size: 14px;
      color: inherit;
      margin-left: auto;
    }
  `}

  ${({ theme }) => theme.media.tablet} {
    white-space: nowrap;
    border-bottom: none;
    border-right: 1px solid ${({ theme }) => theme.colors.border};
    flex-shrink: 0;

    &::after {
      display: none;
    }

    &:last-child {
      border-right: none;
    }
  }

  ${({ theme }) => theme.media.mobile} {
    font-size: 13px;
  }
`;

/** Icon on the leading edge of each sidebar item — pure SVG, no background chip. */
export const SidebarItemIcon = styled.span<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  color: ${({ $active, theme }) =>
    $active ? theme.colors.text.primary : theme.colors.text.muted};
  transition: color ${({ theme }) => theme.transitions.fast};
`;

/** Label text inside each sidebar item. */
export const SidebarItemLabel = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const Panel = styled.div`
  flex: 1;
  min-width: 0;
  /* The master grid wrapper: creates the large, continuous outer box seen in the design */
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  background: ${({ theme }) => theme.colors.background.primary};
  overflow: hidden;
`;

export const PipelineSectionStyled = styled.section`
  scroll-margin-top: 120px;
  display: flex;
  flex-direction: column;
  /* Strict horizontal divider between major pipeline stages */
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  &:last-child {
    border-bottom: none;
  }
`;

export const SectionTitle = styled.h2`
  font-size: 28px;
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.2;
  letter-spacing: -0.02em;
  margin: 0;
  /* Deep padding to match the airy, premium feel */
  padding: 24px 32px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.background.primary};

  ${({ theme }) => theme.media.mobile} {
    font-size: 22px;
    padding: 20px 24px;
  }
`;

export const VisualBlock = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  gap: 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  position: relative;
  overflow: hidden;

  /* ── Layer 1 (bottom): breathing ambient light ─────────────────────
     Two off-centre radial gradients (warm lilac + cool azure) provide
     a slow shifting "spotlight" warmth. We animate filter saturation
     only — background-position on %-positioned radials is unreliable. */
  background-color: #F8F9FA;
  background-image:
    radial-gradient(ellipse 70% 55% at 18% 8%, rgba(192, 132, 252, 0.10), transparent 60%),
    radial-gradient(ellipse 75% 60% at 88% 96%, rgba(37, 99, 235, 0.07), transparent 65%);
  animation: visual-block-breathe 16s ease-in-out infinite;

  /* ── Layer 2 (top, animated): the structural schematic ──────────────
     A stencil grid (major 80px, minor 40px) with subtle crosshair
     markers at major intersections. The grid pans one major tile over
     a long period so the loop is seamless and the motion reads as
     ambient, never as scrolly distraction. */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;

    background-image:
      radial-gradient(circle, rgba(15, 23, 42, 0.22) 1px, transparent 1.6px),
      linear-gradient(to right, rgba(15, 23, 42, 0.05) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(15, 23, 42, 0.05) 1px, transparent 1px),
      linear-gradient(to right, rgba(15, 23, 42, 0.022) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(15, 23, 42, 0.022) 1px, transparent 1px);

    background-size:
      80px 80px,
      80px 80px,
      80px 80px,
      40px 40px,
      40px 40px;

    background-position: 0 0, 0 0, 0 0, 0 0, 0 0;
    animation: visual-grid-drift 42s linear infinite;
    will-change: background-position;
  }

  /* Mobile: tighter grid, slightly faster perception */
  ${({ theme }) => theme.media.mobile} {
    background-image:
      radial-gradient(ellipse 80% 60% at 18% 8%, rgba(192, 132, 252, 0.06), transparent 60%),
      radial-gradient(ellipse 80% 60% at 88% 96%, rgba(37, 99, 235, 0.05), transparent 65%);

    &::before {
      background-size:
        60px 60px,
        60px 60px,
        60px 60px,
        30px 30px,
        30px 30px;
      animation-duration: 32s;
    }
  }

  /* Respect OS-level motion preference */
  @media (prefers-reduced-motion: reduce) {
    animation: none;
    &::before {
      animation: none;
    }
  }

  @keyframes visual-block-breathe {
    0%, 100% { filter: saturate(1) brightness(1); }
    50%      { filter: saturate(1.06) brightness(1.015); }
  }

  @keyframes visual-grid-drift {
    from { background-position: 0 0, 0 0, 0 0, 0 0, 0 0; }
    to   { background-position: -80px -80px, -80px 0, 0 -80px, -40px -40px, -40px 0; }
  }
`;

/** Frame that holds the visual image at its natural aspect ratio. */
export const VisualImageFrame = styled.div`
  width: 100%;
  /* Stable, premium 16:10 canvas — predictable rhythms across all stages,
     no layout shift, no absolute positioning. */
  aspect-ratio: 16 / 10;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  overflow: hidden;

  ${({ theme }) => theme.media.tablet} {
    padding: 24px;
  }

  ${({ theme }) => theme.media.mobile} {
    aspect-ratio: 4 / 3;
    padding: 16px;
  }
`;

/** Caption block beneath (or instead of) the image. */
export const VisualCaption = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px 32px 28px;
  text-align: center;
  background: ${({ theme }) => theme.colors.background.primary};
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  ${({ theme }) => theme.media.mobile} {
    padding: 16px 20px 22px;
  }
`;

export const VisualImage = styled.img`
  display: block;
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
`;

export const VisualTypeLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text.secondary};
  padding: 6px 12px;
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 20px;
  z-index: 1;

  ${({ theme }) => theme.media.mobile} {
    font-size: 10px;
  }
`;

export const VisualDescription = styled.p`
  font-size: 13px;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.text.secondary};
  text-align: center;
  max-width: 480px;
  margin: 0;
  padding: 0 24px;
  z-index: 1;

  ${({ theme }) => theme.media.mobile} {
    font-size: 11px;
  }
`;

export const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  /* CRITICAL: Gap is 0 to allow perfect grid-line borders */
  gap: 0;
  background: ${({ theme }) => theme.colors.background.primary};

  /* 
   * TARGETING THE FRAMER MOTION WRAPPER
   * Since React wraps FeatureCard in a <motion.div>, we apply the strict 
   * vertical borders to the motion div to ensure the lines span 100% height.
   */
  > div {
    display: flex;
    flex-direction: column;
    border-right: 1px solid ${({ theme }) => theme.colors.border};
  }

  > div:last-child {
    border-right: none;
  }

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: 1fr;
    
    > div {
      border-right: none;
      border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    }
    
    > div:last-child {
      border-bottom: none;
    }
  }
`;

export const FeatureCard = styled.div`
  display: flex;
  flex-direction: column;
  padding: 32px;
  flex: 1; /* Stretches card to fill varying text heights perfectly */
  background: transparent;
  
  /* All standalone borders & radiuses removed—handled entirely by the grid geometry */
`;

export const FeatureTitle = styled.h3`
  font-size: 16px;
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.4;
  letter-spacing: -0.01em;
  margin: 0 0 12px 0;

  ${({ theme }) => theme.media.mobile} {
    font-size: 14px;
  }
`;

export const FeatureDescription = styled.p`
  font-size: 14px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;

  ${({ theme }) => theme.media.mobile} {
    font-size: 13px;
  }
`;

/* Hidden because the strict layout architecture replaces the need for loose spacers */
export const SectionDivider = styled.div`
  display: none; 
`;
