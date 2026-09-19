import styled from 'styled-components';

export const TabStrip = styled.div`
  display: flex;
  gap: 4px;
  margin-top: 6px;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.default};
`;

export const Tab = styled.button<{ $active: boolean }>`
  background: none;
  border: none;
  padding: 8px 10px;
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${(props) => (props.$active ? 600 : 500)};
  color: ${(props) => (props.$active ? props.theme.app.text.primary : props.theme.app.text.secondary)};
  border-bottom: 2px solid ${(props) => (props.$active ? props.theme.app.status.info.fg : 'transparent')};
  margin-bottom: -1px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

export const OrgBadge = styled.span`
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.6px;
  color: ${({ theme }) => theme.app.status.warning.fg};
  border: 1px solid ${({ theme }) => theme.app.status.warning.border};
  border-radius: 7px;
  padding: 1px 5px;
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
  border-radius: 11px;
  padding: 10px 12px;
  margin-top: 6px;
`;

export const PinHead = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const PinTitle = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const PinState = styled.span`
  margin-left: auto;
  font-size: ${({ theme }) => theme.app.type.caption};
  white-space: nowrap;
`;

export const PinMeta = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  margin-top: 4px;
`;

export const PinFix = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  margin-top: 4px;
`;

export const PinActions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 6px;
`;

export const TextButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.status.info.fg};
  cursor: pointer;

  &:disabled {
    opacity: 0.4;
    cursor: default;
  }
`;

export const MutedButton = styled(TextButton)`
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const Dropzone = styled.button`
  width: 100%;
  border: 1.5px dashed ${({ theme }) => theme.app.border.strong};
  border-radius: 14px;
  background: ${({ theme }) => theme.app.surface.subtle};
  padding: 18px 12px;
  margin-top: 6px;
  cursor: pointer;
  text-align: center;
  color: ${({ theme }) => theme.app.text.primary};
`;

export const DropTitle = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 600;
`;

export const DropSub = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  margin-top: 4px;
`;

export const FileRow = styled.div`
  border-top: 1px solid ${({ theme }) => theme.app.border.default};
  margin-top: 10px;
  padding-top: 10px;
`;

export const FileHead = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: ${({ theme }) => theme.app.type.body};
`;

export const FileName = styled.strong`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
`;

export const FileMeta = styled.span`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  white-space: nowrap;
`;

export const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 8px;
`;

export const Stepper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const StepBtn = styled.button`
  width: 26px;
  height: 26px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  background: ${({ theme }) => theme.app.surface.subtle};
  color: ${({ theme }) => theme.app.text.secondary};
  font-size: 14px;
  cursor: pointer;

  &:disabled {
    opacity: 0.4;
    cursor: default;
  }
`;

export const StepValue = styled.span`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 600;
  min-width: 20px;
  text-align: center;
`;

export const ConnectorRow = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 10px;
  padding: 8px 10px;
  margin-top: 6px;
  background: ${({ theme }) => theme.app.surface.subtle};
`;

export const InlineForm = styled.div`
  margin-top: 8px;
  display: grid;
  gap: 8px;
`;
