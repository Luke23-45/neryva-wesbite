import styled from 'styled-components';

/**
 * Memory section — redesigned.
 *
 * A read-only reading surface: session-memory policy reported from the
 * Context node, an in-scope library preview, and org defaults. Preview
 * rows read as content cards, not form rows.
 */

export { FieldBlock, FieldHead, FieldHelper, FieldTitle } from './InstructionsSection.styles';
export { SwitchRow, SwitchText, SwitchTitle, SwitchSub } from './ModelSection.styles';
export { PinMeta, TextButton } from './KnowledgeSection.styles';

/** Read-only in-scope preview rows. */
export const PreviewList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const PreviewItem = styled.li`
  border-radius: 13px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  padding: 12px 14px;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.primary};
  line-height: 1.6;
`;

export const PreviewMeta = styled.div`
  color: ${({ theme }) => theme.app.text.muted};
  font-size: ${({ theme }) => theme.app.type.caption};
  margin-top: 4px;
`;
