import styled from 'styled-components';

export const Wrapper = styled.section`
  padding: 0  0;
  background-color: ${({ theme }) => theme.colors.background.primary};
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  ${({ theme }) => theme.media.tablet} {
    padding: ${({ theme }) => theme.spacing.s9} 0;
  }
`;

export const InnerGrid = styled.div`
  width: 100%;
  max-width: ${({ theme }) => theme.containers.wide};
  margin: 0 auto;
  padding: 0 40px;
  display: grid;
  
  /* 
   * Asymmetrical split. Left commands 40%, right list has 60%. 
   */
  grid-template-columns: 4fr 6fr;
  gap: 120px;

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: 1fr;
    gap: 80px;
    padding: 0 24px;
  }
`;

/* ─── LEFT: THE MONOLITHIC NARRATIVE ─── */
export const StickyHeader = styled.div`
  position: sticky;
  top: 160px; /* Locks firmly as user scrolls the list */
  align-self: start;
  max-width: 480px;

  ${({ theme }) => theme.media.tablet} {
    position: static;
  }
`;

export const Eyebrow = styled.span`
  display: block;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: ${({ theme }) => theme.colors.text.muted};
  margin-bottom: 24px;
`;

export const Title = styled.h2`
  /* Brutalist, immense typography scaling */
  font-size: clamp(3rem, 5vw, 4.5rem);
  line-height: 1.0;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
  letter-spacing: -0.04em; /* Strict negative tracking for high-end feel */
  margin: 0 0 24px 0;
  padding-top: 80px;

`;

export const Description = styled.p`
  font-size: 18px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
  padding-bottom: 80px;
`;

/* ─── RIGHT: THE iPAD FLUID LIST ─── */
export const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  /* Top border acts as the starting cap for the list lines */
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

export const InteractiveRow = styled.div`
  position: relative;
  padding: 32px 24px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  cursor: pointer;
  
  /* Removes default touch highlights on mobile so our custom UI reigns supreme */
  -webkit-tap-highlight-color: transparent;

  /* Negative margins offset the layout padding, so the hover pill covers perfectly */
  margin: 0 -24px;

  ${({ theme }) => theme.media.tablet} {
    padding: 24px 16px;
    margin: 0 -16px;
  }
`;

export const RowContent = styled.div`
  display: flex;
  align-items: baseline;
  gap: 24px;
  width: 100%;
  position: relative;
  z-index: 1; /* Content explicitly layered ON TOP of the animated hover pill */
  pointer-events: none; /* Passes mouse interactions to the Row container seamlessly */
`;

export const Index = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.08em;
  color: ${({ theme }) => theme.colors.text.muted};
  flex-shrink: 0;
`;

export const OutcomeText = styled.span`
  font-size: 20px;
  font-weight: 400; /* Sophisticated medium/light read */
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.4;
  letter-spacing: -0.01em;

  ${({ theme }) => theme.media.mobile} {
    font-size: 18px;
  }
`;

/* The absolute masterpiece: Hardware-Accelerated Gliding Pill */
export const HoverPill = styled.div`
  position: absolute;
  top: 8px; 
  bottom: 8px;
  left: 0; 
  right: 0;
  /* Jony Ive standard translucent squircle surface */
  background: rgba(15, 23, 42, 0.04);
  border-radius: 12px;
  z-index: 0; /* Pushed BEHIND the text layer */
`;