import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  /* ═══════════════════════════════════════════════════════════════
     CSS RESET & DEFAULTS
     ═══════════════════════════════════════════════════════════════ */
  
  *,
  *::before,
  *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    font-size: 16px;
    scroll-behavior: smooth;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
    
    @media (prefers-reduced-motion: reduce) {
      scroll-behavior: auto;
      
    }
  }

  body {
    font-family: ${({ theme }) => theme.typography.fontFamily.body};
    font-size: ${({ theme }) => theme.typography.fontSize.base};
    font-weight: ${({ theme }) => theme.typography.fontWeight.normal};
    line-height: ${({ theme }) => theme.typography.lineHeight.normal};
    color: ${({ theme }) => theme.colors.text.secondary};
    background-color: ${({ theme }) => theme.colors.background.primary};
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* ═══════════════════════════════════════════════════════════════
     TYPOGRAPHY DEFAULTS
     ═══════════════════════════════════════════════════════════════ */

  h1, h2, h3, h4, h5, h6 {
    font-family: ${({ theme }) => theme.typography.fontFamily.heading};
    color: ${({ theme }) => theme.colors.text.primary};
    font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
    line-height: ${({ theme }) => theme.typography.lineHeight.snug};
    margin-bottom: ${({ theme }) => theme.spacing[4]};
  }

  h1 {
    font-size: ${({ theme }) => theme.typography.fontSize['5xl']};
    letter-spacing: ${({ theme }) => theme.typography.letterSpacing.tight};
    
    ${({ theme }) => theme.media.maxMd} {
      font-size: ${({ theme }) => theme.typography.fontSize['4xl']};
    }
  }

  h2 {
    font-size: ${({ theme }) => theme.typography.fontSize['4xl']};
    
    ${({ theme }) => theme.media.maxMd} {
      font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
    }
  }

  h3 {
    font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
    
    ${({ theme }) => theme.media.maxMd} {
      font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
    }
  }

  h4 {
    font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  }

  h5 {
    font-size: ${({ theme }) => theme.typography.fontSize.xl};
  }

  h6 {
    font-size: ${({ theme }) => theme.typography.fontSize.lg};
  }

  p {
    margin-bottom: ${({ theme }) => theme.spacing[4]};
    line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
    
    &:last-child {
      margin-bottom: 0;
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     LINKS
     ═══════════════════════════════════════════════════════════════ */

  a {
    color: ${({ theme }) => theme.colors.accent.teal};
    text-decoration: none;
    transition: color ${({ theme }) => theme.transitions.preset.hover};
    
    &:hover {
      color: ${({ theme }) => theme.colors.accent.tealLight};
    }
    
    &:focus-visible {
      outline: 2px solid ${({ theme }) => theme.colors.accent.teal};
      outline-offset: 2px;
      border-radius: ${({ theme }) => theme.radii.sm};
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     CODE
     ═══════════════════════════════════════════════════════════════ */

  code, pre {
    font-family: ${({ theme }) => theme.typography.fontFamily.mono};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
  }

  code {
    background: ${({ theme }) => theme.colors.surface};
    padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[2]};
    border-radius: ${({ theme }) => theme.radii.sm};
  }

  pre {
    background: ${({ theme }) => theme.colors.surface};
    padding: ${({ theme }) => theme.spacing[4]};
    border-radius: ${({ theme }) => theme.radii.md};
    overflow-x: auto;
    
    code {
      background: none;
      padding: 0;
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     MEDIA
     ═══════════════════════════════════════════════════════════════ */

  img, picture, video, canvas, svg {
    display: block;
    max-width: 100%;
    height: auto;
  }

  /* ═══════════════════════════════════════════════════════════════
     FORMS
     ═══════════════════════════════════════════════════════════════ */

  input, button, textarea, select {
    font: inherit;
    color: inherit;
  }

  button {
    cursor: pointer;
    border: none;
    background: none;
  }

  /* ═══════════════════════════════════════════════════════════════
     LISTS
     ═══════════════════════════════════════════════════════════════ */

  ul, ol {
    list-style: none;
  }

  /* ═══════════════════════════════════════════════════════════════
     SELECTION
     ═══════════════════════════════════════════════════════════════ */

  ::selection {
    background-color: ${({ theme }) => theme.colors.accent.tealMuted};
    color: ${({ theme }) => theme.colors.text.primary};
  }

  /* ═══════════════════════════════════════════════════════════════
     SCROLLBAR (WEBKIT)
     ═══════════════════════════════════════════════════════════════ */

  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.background.primary};
  }

  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radii.full};
    
    &:hover {
      background: ${({ theme }) => theme.colors.borderLight};
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     FOCUS VISIBLE UTILITY
     ═══════════════════════════════════════════════════════════════ */

  .focus-ring:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent.teal};
    outline-offset: 2px;
  }

  /* ═══════════════════════════════════════════════════════════════
     REDUCED MOTION
     ═══════════════════════════════════════════════════════════════ */

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
`;
