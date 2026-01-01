import styled from 'styled-components';

const SelectWrapper = styled.div`
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

const StyledSelectContainer = styled.div`
  position: relative;
  width: 100%;
  
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    right: ${({ theme }) => theme.spacing[4]};
    width: 0.8em;
    height: 0.5em;
    background-color: ${({ theme }) => theme.colors.text.muted};
    clip-path: polygon(100% 0%, 0 0%, 50% 100%);
    transform: translateY(-50%);
    pointer-events: none;
  }
`;

const StyledSelect = styled.select<{ $hasError?: boolean }>`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ $hasError, theme }) =>
        $hasError ? theme.colors.semantic.error : theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  padding-right: ${({ theme }) => theme.spacing[10]};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  appearance: none;
  cursor: pointer;
  width: 100%;
  
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

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
}

export const Select = ({ label, error, className, children, ...props }: SelectProps) => {
    return (
        <SelectWrapper className={className}>
            {label && <Label>{label}</Label>}
            <StyledSelectContainer>
                <StyledSelect $hasError={!!error} {...props}>
                    {children}
                </StyledSelect>
            </StyledSelectContainer>
            {error && <ErrorMessage>{error}</ErrorMessage>}
        </SelectWrapper>
    );
};
