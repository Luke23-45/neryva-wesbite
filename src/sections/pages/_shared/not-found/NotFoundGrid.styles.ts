import styled from 'styled-components';

export const MasterLayout = styled.main`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  /* Ultimate stark, unyielding brutalist off-white for print aesthetics */
  background-color: #fbfbfb;
  color: #050505;
`;

/* ─── SECTION 1: THE MONOLITHIC IMAGE ─── */
export const VisualSection = styled.section`
  flex-grow: 1; /* Automatically consumes all remaining viewport height */
  display: flex;
  align-items: center;
  justify-content: center;
  /* Architectural margin around the image gives it physical framing, acting as a matte */
  padding: 40px; 
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  ${({ theme }) => theme.media.mobile} {
    padding: 24px;
    min-height: 50vh;
  }
`;

export const ImageFrame = styled.div`
  width: 100%;
  height: 100%;
  max-width: 1600px;
  /* 
   * Flawless container logic: overflow is hidden so any massive image 
   * scales dynamically without ripping the CSS box model constraints.
   */
  overflow: hidden; 
  background-color: #111; /* Absolute baseline reserve if the image delays loading */
  position: relative;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }
`;

/* ─── SECTION 2: THE 3-COLUMN LEDGER ─── */
export const LedgerRow = styled.section`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  width: 100%;
  background-color: #fbfbfb;

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: 1fr;
    /* Allows elements to stack cleanly into blocks on mobile devices */
  }
`;

export const LedgerCell = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  /* Deep, rigid bounding paddings enforce table-style constraints */
  padding: 48px;
  border-right: 1px solid ${({ theme }) => theme.colors.border};

  /* The outermost column surrenders its right-border globally for clean UI limits */
  &:nth-child(3n) {
    border-right: none;
  }

  ${({ theme }) => theme.media.tablet} {
    border-right: none;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    padding: 40px 24px;
    
    /* Ensure the absolute bottom cap element doesn't draw an extraneous line */
    &:last-child {
      border-bottom: none;
    }
  }
`;

/* ─── INNER CELL TYPOGRAPHY ─── */
export const MetadataBlock = styled.div`
  max-width: 320px;
`;

export const MonoLabel = styled.span`
  display: block;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.muted};
  text-transform: uppercase;
  letter-spacing: 0.16em;
  margin-bottom: 24px;
`;

export const ReadoutText = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 16px;
  font-weight: 400;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
`;

export const CenterDisplay = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
`;

export const HugeCode = styled.h1`
  /* Brutal Jony Ive Scale: Massive scale clamping, ultra-tight letter bounding */
  font-size: clamp(6rem, 15vw, 12rem);
  font-weight: 500;
  line-height: 0.85;
  letter-spacing: -0.06em;
  color: #000000;
  margin: 0;
  /* Trims standard web typography top-space to force perfect physical alignment inside the div */
  transform: translateY(2%); 
`;

/* Solid structural interactable element matching typical high-end console designs */
export const ReturnAction = styled.a`
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 16px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 15px;
  font-weight: 500;
  color: #000;
  text-decoration: none;
  cursor: pointer;
  transition: opacity 0.2s ease, transform 0.2s ease;

  svg {
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  &:hover {
    opacity: 0.7;
  }
  &:hover svg {
    transform: translateX(4px);
  }
`;