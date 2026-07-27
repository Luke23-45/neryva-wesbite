import styled from 'styled-components';

export const FooterContainer = styled.footer`
  width: 100%;
  /* Very light warm structural paper off-white */
  background-color: #FAFAFA;
  /* Erases all top-shadow to lock physically into document flow */
  position: relative;
  z-index: 10;
`;

export const InnerLedger = styled.div`
  max-width: ${({ theme }) => theme.containers.wide};
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

  ${({ theme }) => theme.media.mobile} {
    font-size: 13px;
  }
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

  ${({ theme }) => theme.media.mobile} {
    font-size: 13px;
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

export const CopyrightContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  ${({ theme }) => theme.media.tablet} {
    margin-top: 16px;
  }
`;

export const CopyrightText = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 14px;
  font-weight: 400;
  color: #64748B;
`;

export const NewsletterSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 40px 32px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

export const NewsletterTitle = styled.h4`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 15px;
  font-weight: 500;
  color: #0F172A;
  margin: 0;
`;

export const NewsletterForm = styled.form`
  display: flex;
  gap: 8px;
  max-width: 400px;
`;

export const NewsletterInput = styled.input`
  flex: 1;
  height: 40px;
  padding: 0 12px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 14px;
  color: #0F172A;
  background-color: #ffffff;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  outline: none;

  &::placeholder {
    color: #94a3b8;
  }

  &:focus {
    border-color: #050505;
  }
`;

export const NewsletterButton = styled.button`
  height: 40px;
  padding: 0 16px;
  background-color: #050505;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background-color: #1a1a1a;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const NewsletterStatus = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 13px;
  color: #64748B;
  margin: 0;
`;
