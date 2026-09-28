import styled from 'styled-components';

/** History stepper (Context node): minus/plus flanking an editable number input. */
export const StepperRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
`;

export const StepButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 9px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: transparent;
  color: ${({ theme }) => theme.app.text.primary};
  font-size: 16px;
  line-height: 1;
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.app.border.hover};
  }

  &:disabled {
    opacity: 0.4;
    cursor: default;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 2px;
  }
`;

export const StepValue = styled.input`
  width: 72px;
  text-align: center;
  border-radius: 9px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  color: ${({ theme }) => theme.app.text.primary};
  font-size: ${({ theme }) => theme.app.type.body};
  padding: 6px 4px;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 2px;
  }
`;
