import styled from 'styled-components';

/**
 * Knowledge section — redesigned.
 *
 * Four blocks in descending importance: retrieval policy, pinned
 * sources, the add-sources surface, and coverage. Pin cards get real
 * presence (they're the section's payload), the tab strip gets room,
 * and the dropzone reads as an invitation rather than a form field.
 */

export { FieldBlock, FieldHead, FieldHelper, FieldTitle } from './InstructionsSection.styles';
export { SwitchRow, SwitchText, SwitchTitle, SwitchSub } from './ModelSection.styles';

export const PinList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const TabStrip = styled.div`
  display: flex;
  gap: 2px;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.default};
`;

export const Tab = styled.button<{ $active: boolean }>`
  background: none;
  border: none;
  padding: 12px 14px;
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${(props) => (props.$active ? 650 : 500)};
  font-family: inherit;
  color: ${(props) => (props.$active ? props.theme.app.text.primary : props.theme.app.text.muted)};
  border-bottom: 2px solid ${(props) => (props.$active ? props.theme.app.status.info.fg : 'transparent')};
  margin-bottom: -1px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  &:hover {
    color: ${({ theme }) => theme.app.text.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 2px;
  }
`;

export const OrgBadge = styled.span`
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.4px;
  color: ${({ theme }) => theme.app.status.warning.fg};
  border: 1px solid ${({ theme }) => theme.app.status.warning.border};
  border-radius: 7px;
  padding: 2px 6px;
`;

export const PinCard = styled.div<{ $tone: 'ok' | 'attention' | 'info' | 'error' }>`
  border: 1px solid
    ${(props) =>
      props.$tone === 'ok'
        ? props.theme.app.border.default
        : props.$tone === 'attention'
          ? props.theme.app.status.warning.border
          : props.$tone === 'error'
            ? props.theme.app.status.error.border
            : props.theme.app.status.info.border};
  background: ${(props) =>
    props.$tone === 'ok'
      ? props.theme.app.surface.subtle
      : props.$tone === 'attention'
        ? props.theme.app.status.warning.bg
        : props.$tone === 'error'
          ? props.theme.app.status.error.bg
          : props.theme.app.status.info.bg};
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const PinHead = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const PinTitle = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${({ theme }) => theme.app.text.primary};
`;

export const PinState = styled.span`
  margin-left: auto;
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.muted};
  white-space: nowrap;
`;

export const PinMeta = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: 1.55;
`;

export const PinFix = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: 1.55;
`;

export const PinActions = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 4px;
`;

export const TextButton = styled.button`
  background: none;
  border: none;
  padding: 6px 0;
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 600;
  font-family: inherit;
  color: ${({ theme }) => theme.app.status.info.fg};
  cursor: pointer;

  &:hover:not(:disabled) {
    text-decoration: underline;
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

export const MutedButton = styled(TextButton)`
  color: ${({ theme }) => theme.app.text.muted};
`;

export const EmptyPins = styled.div`
  border: 1px dashed ${({ theme }) => theme.app.border.strong};
  border-radius: 14px;
  padding: 20px;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.6;
  text-align: center;
`;

export const Dropzone = styled.button`
  width: 100%;
  border: 1.5px dashed ${({ theme }) => theme.app.border.strong};
  border-radius: 18px;
  background: ${({ theme }) => theme.app.surface.subtle};
  padding: 32px 20px;
  cursor: pointer;
  text-align: center;
  color: ${({ theme }) => theme.app.text.primary};
  font-family: inherit;
  transition: border-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.app.border.hover};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 2px;
  }
`;

export const DropTitle = styled.div`
  font-size: 15px;
  font-weight: 650;
  letter-spacing: -0.005em;
`;

export const DropSub = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  margin-top: 6px;
  line-height: 1.55;
`;

export const FileRow = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 14px;
  background: ${({ theme }) => theme.app.surface.subtle};
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const UploadList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
`;

export const FileHead = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: ${({ theme }) => theme.app.type.body};
`;

export const FileName = styled.strong`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.primary};
`;

export const FileMeta = styled.span`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
`;

export const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

export const Stepper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const StepBtn = styled.button`
  width: 30px;
  height: 30px;
  border-radius: 9px;
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  background: ${({ theme }) => theme.app.surface.subtle};
  color: ${({ theme }) => theme.app.text.secondary};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    color: ${({ theme }) => theme.app.text.primary};
    border-color: ${({ theme }) => theme.app.border.hover};
  }

  &:disabled {
    opacity: 0.4;
    cursor: default;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

export const StepValue = styled.span`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 650;
  min-width: 24px;
  text-align: center;
  font-variant-numeric: tabular-nums;
  color: ${({ theme }) => theme.app.text.primary};
`;

export const ConnectorRow = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 14px;
  padding: 14px 16px;
  background: ${({ theme }) => theme.app.surface.subtle};
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const ConnectorList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
`;

export const InlineForm = styled.div`
  margin-top: 4px;
  display: grid;
  gap: 12px;
`;

export const TabPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 4px;
`;

export const ViewerNote = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 14px;
  background: ${({ theme }) => theme.app.surface.subtle};
  padding: 16px 18px;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: 1.6;
`;
