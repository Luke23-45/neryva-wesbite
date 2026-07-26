import styled from 'styled-components';

export const Wrapper = styled.section`
  padding: 128px 0 0 0;
  background-color: ${({ theme }) => theme.colors.background.primary};
  display: flex;
  justify-content: center;
  position: relative;
  overflow: hidden;

  ${({ theme }) => theme.media.tablet} {
    padding: 128px 0 0 0;
  }
`;

export const Inner = styled.div`
  width: 100%;
  max-width: ${({ theme }) => theme.containers.page};
  padding: 0 ${({ theme }) => theme.spacing.s5};
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const HeaderSection = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
  margin-bottom: 80px;

  ${({ theme }) => theme.media.tablet} {
    margin-bottom: 56px;
  }
`;

export const SectionEyebrow = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 13px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text.muted};

  ${({ theme }) => theme.media.mobile} {
    font-size: 11px;
  }
`;

export const SectionTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 48px;
  font-weight: 500;
  letter-spacing: -0.03em;
  margin: 0;
  line-height: 1.1;
  max-width: ${({ theme }) => theme.containers.prose};
  color: ${({ theme }) => theme.colors.text.strong};

  ${({ theme }) => theme.media.mobile} {
    font-size: 40px;
  }
`;

export const BentoGrid = styled.div<{ $isDark?: boolean }>`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  width: 100%;
  position: relative;

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: repeat(2, 1fr);
  }

  ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 1fr;
    border: none;
    background-color: transparent;
    gap: 16px;
  }
`;

export const BentoTile = styled.div<{ $colSpan?: number; $rowSpan?: number; $isEmpty?: boolean; $isGrey?: boolean; $isDark?: boolean }>`
  background-color: ${({ theme, $isGrey, $isEmpty, $isDark }) => {
    if ($isEmpty) return 'transparent';
    if ($isGrey) return $isDark ? 'rgba(255,255,255,0.02)' : '#F3F4F6';
    return theme.colors.background.primary;
  }};
  
  grid-column: span ${({ $colSpan = 1 }) => $colSpan};
  grid-row: span ${({ $rowSpan = 1 }) => $rowSpan};
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 40px;
  
  /* Overlapping dashed borders */
  border: 1px dashed ${({ theme, $isDark }) => $isDark ? 'rgba(255,255,255,0.1)' : theme.colors.border};
  margin: -1px 0 0 -1px;
  z-index: 1;
  
  /* Create exact aspect ratios to maintain perfect geometry */
  aspect-ratio: ${({ $colSpan = 1, $rowSpan = 1 }) => `${$colSpan} / ${$rowSpan}`};
  
  /* Fallback min-height */
  min-height: 280px;

  /* Premium transition */
  transition: background-color 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: radial-gradient(circle at 50% 0%, ${({ $isDark }) => $isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)'} 0%, transparent 70%);
    opacity: 0;
    transition: opacity 0.5s ease;
    pointer-events: none;
  }

  &:hover {
    z-index: 2;
    background-color: ${({ $isEmpty, $isGrey, $isDark }) => {
      if ($isEmpty || $isGrey) return;
      return $isDark ? 'rgba(255,255,255,0.02)' : '#FAFAFA';
    }};
    
    &::before {
      opacity: 1;
    }
  }

  ${({ theme }) => theme.media.tablet} {
    grid-column: span 1 !important;
    grid-row: span 1 !important;
    aspect-ratio: auto;
    min-height: 240px;
    padding: 32px;
    
    &.hide-on-mobile {
      display: none;
    }
  }

  ${({ theme }) => theme.media.mobile} {
    border: 1px dashed ${({ theme }) => theme.colors.borderLight};
    margin: 0;
    border-radius: 12px;
    background-color: ${({ theme }) => theme.colors.background.secondary};
  }
`;

export const TileIcon = styled.div<{ $color?: string; $isDark?: boolean }>`
  width: 36px;
  height: 36px;
  background-color: ${({ $color }) => $color || 'transparent'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 20px;
  font-weight: 700;
  border-radius: 6px;
  margin-bottom: auto; /* Pushes the text to the bottom */
  box-shadow: ${({ $color }) => $color && $color !== 'transparent' ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'};

  ${({ theme }) => theme.media.mobile} {
    font-size: 18px;
  }
`;

export const TileContent = styled.div`
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const TileTitle = styled.h3<{ $isDark?: boolean }>`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 26px;
  font-weight: 500;
  color: ${({ theme, $isDark }) => $isDark ? 'rgba(255,255,255,0.95)' : theme.colors.text.strong};
  margin: 0;
  letter-spacing: -0.03em;
  line-height: 1.1;

  ${({ theme }) => theme.media.mobile} {
    font-size: 24px;
  }
`;

export const TileDescription = styled.p<{ $isDark?: boolean }>`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 15px;
  line-height: 1.6;
  color: ${({ $isDark }) => $isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)'};
  margin: 0;
  max-width: 90%;

  ${({ theme }) => theme.media.mobile} {
    font-size: 13px;
  }
`;

/* PRECISE DECORATIVE ELEMENTS */
export const CornerDot = styled.div<{ $corner: 'tl' | 'tr' | 'bl' | 'br'; $isDark?: boolean }>`
  position: absolute;
  width: 4px;
  height: 4px;
  background: ${({ theme, $isDark }) => $isDark ? 'rgba(255,255,255,0.7)' : theme.colors.text.primary};
  border-radius: 0; /* perfectly sharp small square */
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

  ${({ theme }) => theme.media.mobile} {
    display: none;
  }
`;

export const DiamondLabel = styled.div<{ $isDark?: boolean }>`
  position: absolute;
  width: 16px;
  height: 16px;
  background: ${({ theme, $isDark }) => $isDark ? '#1A1A1A' : '#ffffff'};
  border: 1px dashed ${({ theme, $isDark }) => $isDark ? 'rgba(255,255,255,0.2)' : theme.colors.border};
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  
  /* We use modern independent transform properties for easier animation */
  rotate: 45deg;
  transition: rotate 0.5s cubic-bezier(0.16, 1, 0.3, 1), scale 0.4s ease;

  &:hover {
    rotate: 135deg;
    scale: 1.1;
  }

  ${({ theme }) => theme.media.mobile} {
    display: none;
  }
`;
