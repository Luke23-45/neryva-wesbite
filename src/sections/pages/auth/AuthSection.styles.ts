import styled from 'styled-components';

export const ViewportGrid = styled.main`
  display: grid;
  /* Col 1: Flex | Col 2: Strict App Console | Col 3: Flex */
  grid-template-columns: minmax(16px, 1fr) minmax(auto, 480px) minmax(16px, 1fr);
  /* Row 1: Flex | Row 2: Form Payload Height | Row 3: Flex */
  grid-template-rows: 1fr auto 1fr;
  min-height: 100vh;
  
  /* PERFECT 1PX BLUEPRINT GRID TRICK */
  background-color: ${({ theme }) => theme.colors.border};
  gap: 1px;
  overflow: hidden;

  /* Global background for ambient empty grid cells */
  > div {
    background-color: #fafaf9;
  }
`;

/* ── THE 9 CELLS IN THE MATRIX ── */
/* Empty Spacer Cells */
export const CellTopLeft = styled.div``;
export const CellTopCenter = styled.div``;
export const CellTopRight = styled.div``;
export const CellMidLeft = styled.div``;
export const CellMidRight = styled.div``;
export const CellBotLeft = styled.div``;
export const CellBotRight = styled.div``;

/* The Master Auth Stage (Center Cell) */
export const ConsoleStage = styled.div`
  background-color: #ffffff !important; /* Forces the stage strictly white against the off-white */
  padding: 20px 48px;
  padding-top: 30px;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 10;
  
  /* Creates subtle physical lift over the adjacent cells natively on webkit */
  box-shadow: 0 4px 40px rgba(0, 0, 0, 0.02);

  ${({ theme }) => theme.media.mobile} {
    padding: 64px 24px;
  }
`;

/* The Information Ledger (Bottom Center) */
export const CellBotCenter = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 32px 24px;
`;

export const FooterLinks = styled.div`
  display: flex;
  gap: 24px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.muted};

  a {
    color: inherit;
    text-decoration: none;
    transition: color 0.2s ease;
    &:hover { color: ${({ theme }) => theme.colors.text.primary}; }
  }
`;

/* ── INNER CONSOLE TYPOGRAPHY ── */
export const BrandMotif = styled.div`
  margin-bottom: 40px;
  svg {
    width: 48px;
    height: 48px;
    color: #F65936; /* Signature Front-line Red/Orange */
  }
`;

export const AuthTitle = styled.h1`
  font-size: 32px;
  font-weight: 500;
  letter-spacing: -0.02em;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 12px 0;
  line-height: 1.1;
`;

export const AuthSub = styled.p`
  font-size: 15px;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0 0 48px 0;
`;

/* ── PRECISION FORMS ── */
export const FormBox = styled.form`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
`;

export const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
`;

export const NameSplit = styled.div`
  display: flex;
  gap: 16px;
  width: 100%;
`;

export const LabelRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

export const Label = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
`;

export const HelpLink = styled.button`
  background: transparent;
  border: none;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.muted};
  cursor: pointer;
  padding: 0;

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

export const Input = styled.input`
  width: 100%;
  height: 48px;
  padding: 0 16px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 15px;
  color: ${({ theme }) => theme.colors.text.primary};
  background-color: #ffffff;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &::placeholder {
    color: ${({ theme }) => theme.colors.text.muted};
  }

  /* Ultimate brutalist unyielding input active status. Strict solid black out line. */
  &:focus {
    border-color: #050505;
    box-shadow: 0 0 0 1px #050505; 
  }

  &:disabled {
    background-color: #fafaf9;
    color: ${({ theme }) => theme.colors.text.secondary};
    cursor: not-allowed;
  }
`;

export const SubmitAction = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 48px;
  width: 100%;
  background-color: #050505;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

export const BackAction = styled.button`
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;
  align-self: center;
  margin-top: 16px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.secondary};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;