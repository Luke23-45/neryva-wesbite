import styled from 'styled-components';

export const AuthWrapper = styled.main`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  position: relative;
  overflow: hidden;

  background-color: #fafaf9;
  background-image:
    /* ── Vertical lines (8, asymmetric spacing) ── */
    linear-gradient(to bottom, rgba(0,0,0,0.03), rgba(0,0,0,0.03)),
    linear-gradient(to bottom, rgba(0,0,0,0.06), rgba(0,0,0,0.06)),
    linear-gradient(to bottom, rgba(0,0,0,0.04), rgba(0,0,0,0.04)),
    linear-gradient(to bottom, rgba(0,0,0,0.02), rgba(0,0,0,0.02)),
    linear-gradient(to bottom, rgba(0,0,0,0.10), rgba(0,0,0,0.10)),
    linear-gradient(to bottom, rgba(0,0,0,0.10), rgba(0,0,0,0.10)),
    linear-gradient(to bottom, rgba(0,0,0,0.04), rgba(0,0,0,0.04)),
    linear-gradient(to bottom, rgba(0,0,0,0.03), rgba(0,0,0,0.03)),
    /* ── Horizontal lines (6, asymmetric spacing) ── */
    linear-gradient(to right, rgba(0,0,0,0.03), rgba(0,0,0,0.03)),
    linear-gradient(to right, rgba(0,0,0,0.05), rgba(0,0,0,0.05)),
    linear-gradient(to right, rgba(0,0,0,0.07), rgba(0,0,0,0.07)),
    linear-gradient(to right, rgba(0,0,0,0.07), rgba(0,0,0,0.07)),
    linear-gradient(to right, rgba(0,0,0,0.05), rgba(0,0,0,0.05)),
    linear-gradient(to right, rgba(0,0,0,0.03), rgba(0,0,0,0.03));
  background-size:
    1px 100%, 1px 100%, 1px 100%, 1px 100%, 1px 100%, 1px 100%, 1px 100%, 1px 100%,
    100% 1px, 100% 1px, 100% 1px, 100% 1px, 100% 1px, 100% 1px;
  background-position:
    7% 0, 18% 0, 32% 0, 42% 0, calc(50vw - 208px) 0, calc(50vw + 272px) 0, 73% 0, 91% 0,
    0 5%, 0 16%, 0 calc(50vh - 220px), 0 calc(50vh + 220px), 0 84%, 0 95%;
  background-repeat: no-repeat;
`;

export const ConsoleStage = styled.div`
  width: 480px;
  background-color: rgba(255, 255, 255, 0.95);
  padding: 64px 48px;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 24px rgba(0, 0, 0, 0.04);
  margin-left: 80px;

  ${({ theme }) => theme.media.mobile} {
    width: calc(100vw - 32px);
    padding: 40px 24px;
    margin-left: 0;
  }
`;

export const FooterBar = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
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
    &:focus-visible { outline: 2px solid ${({ theme }) => theme.colors.text.primary}; outline-offset: 2px; }
  }
`;

export const FooterNote = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.muted};
`;

export const BrandMotif = styled.div`
  margin-bottom: 40px;
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
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, opacity 0.2s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.55;
    cursor: default;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.text.primary};
    outline-offset: 3px;
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

/* ── INBOX VERIFICATION STATE ── */
export const VerifyIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: #fafaf9;
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.02);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0F172A;
  margin-bottom: 32px;

  svg {
    width: 24px;
    height: 24px;
    stroke-width: 1.5px;
  }
`;

export const VerifyTextRow = styled.p`
  font-size: 15px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0 0 40px 0;

  strong {
    color: ${({ theme }) => theme.colors.text.primary};
    font-weight: 500;
  }
`;

export const ResendAction = styled.button`
  background: transparent;
  border: none;
  padding: 0;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 4px;
  text-decoration-thickness: 1px;
  text-decoration-color: ${({ theme }) => theme.colors.border};
  transition: text-decoration-color 0.2s ease;

  &:hover {
    text-decoration-color: ${({ theme }) => theme.colors.text.primary};
  }
`;

export const ToggleMode = styled.button`
  background: transparent;
  border: none;
  margin-top: 16px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.secondary};
  cursor: pointer;
  padding: 0;
  align-self: center;

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

export const OtpInput = styled.input`
  width: 100%;
  height: 64px;
  padding: 0 16px;
  font-family: ${({ theme }) => theme.typography.fonts.mono || theme.typography.fonts.sans};
  font-size: 28px;
  letter-spacing: 12px;
  text-align: center;
  color: ${({ theme }) => theme.colors.text.primary};
  background-color: #ffffff;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &::placeholder {
    color: ${({ theme }) => theme.colors.text.muted};
  }

  &:focus {
    border-color: #050505;
    box-shadow: 0 0 0 1px #050505;
  }
`;

/* ── OAUTH PROVIDER BUTTONS ── */
export const ProviderList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

export const ProviderButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 52px;
  width: 100%;
  background-color: #ffffff;
  color: ${({ theme }) => theme.colors.text.primary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, border-color 0.2s ease;

  svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.10);
    border-color: #050505;
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.55;
    cursor: default;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.text.primary};
    outline-offset: 3px;
  }
`;

export const DividerRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  margin: 8px 0;
  color: ${({ theme }) => theme.colors.text.muted};
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 13px;
  font-weight: 500;

  &::before,
  &::after {
    content: '';
    flex: 1;
    border-top: 1px solid ${({ theme }) => theme.colors.border};
  }
`;

export const ProviderNote = styled.p`
  font-size: 13.5px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text.muted};
  margin: 20px 0 0 0;
  text-align: center;
`;

export const FormError = styled.p`
  font-size: 13.5px;
  line-height: 1.5;
  color: #b91c1c;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  padding: 10px 14px;
  margin: 16px 0 0 0;
  text-align: center;
`;
