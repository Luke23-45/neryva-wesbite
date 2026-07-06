import styled from 'styled-components';

export const SectionWrapper = styled.section`
  display: grid;
  grid-template-columns: 38% 62%;
  min-height: 800px;
  background-color: ${({ theme }) => theme.colors.background.primary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: 1fr;
  }
`;

export const LeftColumn = styled.div`
  background-color: #F8F8F5; /* Matches the slightly warm gray in the image */
  /* Top, Right, Bottom, Left */
  padding: 80px 60px 80px max(24px, calc((100vw - 1200px) / 2 + 24px));
  border-right: 1px solid ${({ theme }) => theme.colors.border};

  ${({ theme }) => theme.media.mobile} {
    padding: 60px 16px;
    border-right: none;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }
`;

export const RightColumn = styled.div`
  background-color: #FFFFFF;
  padding: 80px 100px;

  ${({ theme }) => theme.media.tablet} {
    padding: 60px 40px;
  }

  ${({ theme }) => theme.media.mobile} {
    padding: 60px 24px;
  }
`;

export const SidebarTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 2.25rem;
  font-weight: 500;
  letter-spacing: -0.02em;
  color: ${({ theme }) => theme.colors.text.strong};
  margin: 0 0 48px 0;
`;

export const SidebarBlock = styled.div`
  padding: 32px 0;
  border-top: 1px solid rgba(0, 0, 0, 0.06);

  &:first-of-type {
    border-top: none;
    padding-top: 0;
  }
`;

export const BlockHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
`;

export const IconWrapper = styled.div`
  font-size: 28px;
  line-height: 1;
`;

export const BlockTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 1.5rem;
  font-weight: 500;
  letter-spacing: -0.02em;
  color: ${({ theme }) => theme.colors.text.strong};
  margin: 0;
`;

export const BlockContent = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 0.95rem;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 24px;

  ul {
    margin: 0;
    padding-left: 18px;
    list-style-type: disc;
    color: rgba(0, 0, 0, 0.2);

    li {
      margin-bottom: 12px;
      padding-left: 4px;

      span {
        color: ${({ theme }) => theme.colors.text.primary};
      }
    }
  }

  a {
    color: ${({ theme }) => theme.colors.text.strong};
    text-decoration: underline;
    text-underline-offset: 2px;
    &:hover {
      opacity: 0.7;
    }
  }
`;

export const BlockFooter = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 16px 0 0 0;
`;

export const SecondaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: rgba(0, 0, 0, 0.05);
  border: none;
  border-radius: 4px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 0.8rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.strong};
  cursor: pointer;
  transition: background-color 200ms ease;

  &:hover {
    background-color: rgba(0, 0, 0, 0.08);
  }

  svg {
    width: 12px;
    height: 12px;
  }
`;

// --- Form Styles ---

export const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 32px;
  max-width: 700px;
`;

export const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;

  ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 1fr;
  }
`;

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const Label = styled.label`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 0.9rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.strong};

  span {
    color: #D32F2F; /* Red asterisk */
    margin-left: 2px;
  }
`;

export const Input = styled.input`
  width: 100%;
  height: 48px;
  padding: 0 16px;
  background: #FFFFFF;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 0.95rem;
  color: ${({ theme }) => theme.colors.text.strong};
  transition: border-color 200ms ease;

  &::placeholder {
    color: rgba(0, 0, 0, 0.3);
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.text.muted};
  }
`;

export const TextArea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 16px;
  background: #FFFFFF;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 0.95rem;
  color: ${({ theme }) => theme.colors.text.strong};
  resize: vertical;
  transition: border-color 200ms ease;

  &::placeholder {
    color: rgba(0, 0, 0, 0.3);
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.text.muted};
  }
`;

export const CheckboxGroup = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 16px;
`;

export const Checkbox = styled.input`
  width: 20px;
  height: 20px;
  margin: 0;
  accent-color: ${({ theme }) => theme.colors.text.strong};
  cursor: pointer;
`;

export const CheckboxLabel = styled.label`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 0.95rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.strong};
  line-height: 1.4;
  cursor: pointer;
`;

export const Disclaimer = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 0.85rem;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0 0 16px 0;

  a {
    color: ${({ theme }) => theme.colors.text.strong};
    text-decoration: underline;
    text-underline-offset: 2px;
  }
`;

export const SubmitButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  align-self: flex-start;
  height: 48px;
  padding: 0 24px;
  background-color: #030811;
  color: #FFFFFF;
  border: none;
  border-radius: 6px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 200ms ease, opacity 200ms ease;

  &:hover {
    opacity: 0.9;
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;
