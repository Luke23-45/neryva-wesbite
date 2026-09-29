import styled from 'styled-components';

/**
 * Budget section — redesigned.
 *
 * Plain-words per-run caps with an unset-vs-zero distinction, rough
 * per-model estimate lines, and the fail-closed note. Each cap reads
 * as its own row: name, number field, resolved state beneath.
 */

export { FieldBlock, FieldHead, FieldHelper, FieldTitle } from './InstructionsSection.styles';
export { SwitchRow, SwitchText, SwitchTitle, SwitchSub } from './ModelSection.styles';

export const CapRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const CapLabel = styled.span`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.primary};
`;

export const EstimateList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const EstimateItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  border-radius: 12px;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.primary};
  line-height: 1.6;
  font-variant-numeric: tabular-nums;
`;

export const EstimateMeta = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.6;
`;
