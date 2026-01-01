import styled from 'styled-components';

const TextareaWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
  width: 100%;
`;

const Label = styled.label`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const StyledTextarea = styled.textarea<{ $hasError?: boolean }>`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ $hasError, theme }) =>
        $hasError ? theme.colors.semantic.error : theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing[4]};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  min-height: 120px;
  resize: vertical;
  width: 100%;
  font-family: ${({ theme }) => theme.typography.fontFamily.body};
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.text.muted};
  }
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.accent.teal};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.accent.tealMuted};
  }
`;

const ErrorMessage = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.semantic.error};
`;

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

export const Textarea = ({ label, error, className, ...props }: TextareaProps) => {
    return (
        <TextareaWrapper className={className}>
            {label && <Label>{label}</Label>}
            <StyledTextarea $hasError={!!error} {...props} />
            {error && <ErrorMessage>{error}</ErrorMessage>}
        </TextareaWrapper>
    );
};
