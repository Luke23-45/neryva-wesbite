import styled from 'styled-components';

/**
 * Response section — redesigned.
 *
 * Render controls: output format, citations, and streaming as preset
 * groups, plus an advanced block for reasoning effort and top-p.
 * The resolved policy reads as a quiet summary line at the bottom.
 */

export { FieldBlock, FieldHead, FieldHelper, FieldTitle } from './InstructionsSection.styles';
export { SwitchRow, SwitchText, SwitchTitle, SwitchSub } from './ModelSection.styles';
export { PresetPill, PresetRow } from './GuardrailsSection.styles';

export const AdvancedToggle = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 0;
  background: transparent;
  border: 0;
  cursor: pointer;
  font-family: inherit;
  font-size: 15px;
  font-weight: 650;
  letter-spacing: -0.005em;
  color: ${({ theme }) => theme.app.text.primary};

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 2px;
    border-radius: 8px;
  }

  svg {
    flex: none;
    color: ${({ theme }) => theme.app.text.muted};
  }
`;

export const ParamRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const ParamHead = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
`;

export const ParamName = styled.span`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.primary};
`;

export const ParamValue = styled.span`
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.muted};
  font-variant-numeric: tabular-nums;
`;
