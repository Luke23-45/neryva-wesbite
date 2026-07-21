import styled from 'styled-components';

export const FooterContainer = styled.footer`
  width: 100%;
  /* Very light warm structural paper off-white */
  background-color: #FAFAFA;
  /* Massive architectural focal top-border (Vivid Neryva Accent) */
  border-top: 3px solid #F65936; 
  /* Erases all top-shadow to lock physically into document flow */
  position: relative;
  z-index: 10;
`;

export const InnerLedger = styled.div`
  max-width: 1536px;
  margin: 0 auto;
  /* Constrains the master box layout precisely per the image */
  border-left: 1px solid ${({ theme }) => theme.colors.border};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;

  ${({ theme }) => theme.media.tablet} {
    border-left: none;
    border-right: none;
  }
`;

/* ── TOP SECTION: THE LINK GRID ── */
export const ColumnsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  width: 100%;

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: repeat(2, 1fr);
  }

  ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 1fr;
  }
`;

export const FooterCol = styled.div`
  display: flex;
  flex-direction: column;
  padding: 64px 32px;
  /* Structural division exactly mapping the image borders */
  border-right: 1px solid ${({ theme }) => theme.colors.border};

  /* The 4th element (last) needs its internal border stripped out */
  &:nth-child(4n) {
    border-right: none;
  }

  ${({ theme }) => theme.media.tablet} {
    padding: 48px 32px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    &:nth-child(2n) {
      border-right: none;
    }
    &:nth-last-child(-n + 2) {
      border-bottom: none; /* Last row removes border on tablet */
    }
  }

  ${({ theme }) => theme.media.mobile} {
    border-right: none !important;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border} !important;
    &:last-child {
      border-bottom: none !important;
    }
  }
`;

/* TYPOGRAPHY OVERRIDE - DO NOT INHERIT NORMAL APP SIZES HERE */
export const HeaderText = styled.h4`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 15px;
  font-weight: 400; /* Subtle text to assert the submissive structure layer */
  color: #64748B;
  margin: 0 0 32px 0;
  letter-spacing: -0.01em;
`;

export const LinkList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px; /* Uniquely spacious 14px metric prevents vertical "cramping" */
`;

export const FooterLink = styled.a`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 15px;
  font-weight: 500; /* The link demands exact authority compared to its column header */
  color: #0F172A;
  text-decoration: none;
  line-height: 1.4;
  letter-spacing: -0.01em;
  width: max-content; /* Ensure hover bounds sit tightly against string width only */
  
  &:hover {
    text-decoration: underline;
    text-underline-offset: 4px;
    text-decoration-thickness: 1px;
    text-decoration-color: #64748B;
  }
`;


/* ── BOTTOM SECTION: HARDWARE CAP AND LOGOS ── */
export const BottomBand = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: flex-end; /* Note: Pushes standard left layout to floor vs high stack on right side */
  padding: 32px 32px 48px 32px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  ${({ theme }) => theme.media.tablet} {
    flex-direction: column;
    align-items: flex-start;
    gap: 40px;
    padding: 32px;
  }
`;

export const SocialArray = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  
  a {
    display: inline-flex;
    color: #050505;
    transition: transform 0.2s ease, color 0.2s ease;
  }
  
  a:hover {
    color: #4A4A4A;
    transform: translateY(-2px);
  }

  svg {
    width: 22px;
    height: 22px;
  }
`;

export const HardwareButtonsBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end; /* Text sits completely flat to right flush layout */

  ${({ theme }) => theme.media.tablet} {
    align-items: flex-start;
  }
`;

export const AccessText = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 13px;
  font-weight: 500;
  color: #4A4A4A;
  margin-bottom: 12px;
`;

export const AppRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  ${({ theme }) => theme.media.mobile} {
    flex-direction: column;
    align-items: flex-start;
  }
`;

/* Pixel perfect recreation of solid-block hardware download badges */
export const BadgeBtn = styled.button`
  background: #000;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.85;
  }

  /* Micro text alignment strictly observed on download buttons internally */
  div {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
    gap: 1px;
  }
  
  span:nth-child(1) {
    font-size: 9px;
    font-weight: 400;
  }
  span:nth-child(2) {
    font-size: 14px;
    font-weight: 600;
    line-height: 1.1;
  }

  svg {
    width: 24px;
    height: 24px;
  }
`;