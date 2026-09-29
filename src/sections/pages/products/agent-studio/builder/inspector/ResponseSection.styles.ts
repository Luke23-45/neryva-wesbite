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
  padding: ${({ theme }) => theme.spacing.s3} 0;
  background: transparent;
  border: 0;
  cursor: pointer;
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.title};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.micro};
  color: ${({ theme }) => theme.app.text.primary};

  &:focus-visible {
    outline: ${({ theme }) => theme.spacing.px2} solid ${({ theme }) => theme.app.border.focus};
    outline-offset: ${({ theme }) => theme.spacing.px2};
    border-radius: ${({ theme }) => theme.radii.sm};
  }

  svg {
    flex: none;
    color: ${({ theme }) => theme.app.text.muted};
  }
`;

export const ParamRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.px10};
`;

export const ParamHead = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.s3};
`;

export const ParamName = styled.span`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.app.text.primary};
`;

export const ParamValue = styled.span`
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.muted};
  font-variant-numeric: ${({ theme }) => theme.app.numeric};
`;
