import styled from 'styled-components';

const InputWrapper = styled.div`
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

const StyledInput = styled.input<{ $hasError?: boolean }>`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ $hasError, theme }) =>
        $hasError ? theme.colors.semantic.error : theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  transition: all 0.2s ease;
  width: 100%;
  
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

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = ({ label, error, className, ...props }: InputProps) => {
    return (
        <InputWrapper className={className}>
            {label && <Label>{label}</Label>}
            <StyledInput $hasError={!!error} {...props} />
            {error && <ErrorMessage>{error}</ErrorMessage>}
        </InputWrapper>
    );
};
