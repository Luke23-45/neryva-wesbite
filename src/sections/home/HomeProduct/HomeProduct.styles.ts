import styled from 'styled-components';

export const Wrapper = styled.section`
  padding: 160px 0;
  background-color: ${({ theme }) => theme.colors.background.primary};
  display: flex;
  justify-content: center;
  position: relative;
  overflow: hidden;

  ${({ theme }) => theme.media.tablet} {
    padding: 100px 0;
  }
`;

export const Inner = styled.div`
  width: 100%;
  max-width: 1200px;
  padding: 0 ${({ theme }) => theme.spacing.s5};
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const BentoGrid = styled.div<{ $isDark?: boolean }>`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  /* Extremely subtle grid lines */
  background-color: ${({ $isDark }) => $isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'};
  border: 1px solid ${({ $isDark }) => $isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'};
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
  
  /* Create exact aspect ratios to maintain perfect geometry */
  aspect-ratio: ${({ $colSpan = 1, $rowSpan = 1 }) => `${$colSpan} / ${$rowSpan}`};
  
  /* Fallback min-height */
  min-height: 280px;
  overflow: hidden;

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
    border: 1px solid ${({ theme }) => theme.colors.borderLight};
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
`;

export const TileDescription = styled.p<{ $isDark?: boolean }>`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 15px;
  line-height: 1.6;
  color: ${({ theme, $isDark }) => $isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)'};
  margin: 0;
  max-width: 90%;
`;

/* PRECISE DECORATIVE ELEMENTS */
export const CornerDot = styled.div<{ $top?: boolean; $bottom?: boolean; $left?: boolean; $right?: boolean; $isDark?: boolean }>`
  position: absolute;
  width: 5px;
  height: 5px;
  background-color: ${({ $isDark }) => $isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'};
  border-radius: 50%;
  
  /* Align to exactly center on the 1px grid line */
  ${({ $top }) => $top && 'top: -3px;'}
  ${({ $bottom }) => $bottom && 'bottom: -3px;'}
  ${({ $left }) => $left && 'left: -3px;'}
  ${({ $right }) => $right && 'right: -3px;'}
  z-index: 10;
  
  ${({ theme }) => theme.media.mobile} {
    display: none;
  }
`;

export const DiamondLabel = styled.div<{ $isDark?: boolean }>`
  position: absolute;
  top: -24px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
  width: 48px;
  height: 48px;
  background-color: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ $isDark }) => $isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'};
  z-index: 5;
  transition: transform 0.4s ease;

  &:hover {
    transform: translateX(-50%) rotate(135deg);
  }

  ${({ theme }) => theme.media.mobile} {
    display: none;
  }
`;
