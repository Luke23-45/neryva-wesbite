import styled from 'styled-components';

/**
 * Evaluation section — redesigned.
 *
 * The builder's evaluator satellite: what it runs against, which
 * dataset, the run controls, the latest decision, and what it is
 * watching. Each concern reads as a titled block.
 */

export { FieldBlock, FieldHead, FieldHelper, FieldTitle, Wrap } from './InstructionsSection.styles';
export { Muted } from './TrySection.styles';

export const DatasetLabel = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.primary};
`;

export const DatasetSelect = styled.select`
  height: 40px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.tint};
  color: ${({ theme }) => theme.app.text.primary};
  font-size: ${({ theme }) => theme.app.type.body};
  font-family: inherit;
  max-width: 100%;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.app.border.focus};
  }
`;

export const AttemptsWrap = styled.div`
  max-width: 220px;
`;

export const ActionsRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
`;

export const LinkRow = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;
`;

export const FixBlock = styled.div`
  margin-top: 12px;
  padding: 14px 16px;
  border: 1px solid ${({ theme }) => theme.app.status.warning.border};
  background: ${({ theme }) => theme.app.status.warning.bg};
  border-radius: 14px;
`;

export const FixTitle = styled.div`
  font-size: ${({ theme }) => theme.app.type.title};
  font-weight: 650;
  letter-spacing: -0.005em;
  color: ${({ theme }) => theme.app.text.primary};
  margin-bottom: 6px;
`;

export const FixForm = styled.div`
  display: flex;
  gap: 10px;
  align-items: flex-end;
  margin-top: 10px;
  flex-wrap: wrap;
`;

export const FixField = styled.div`
  min-width: 200px;
  flex: 1;
`;

export const FixLinks = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 10px;
  flex-wrap: wrap;
`;
