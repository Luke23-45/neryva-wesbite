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
  gap: ${({ theme }) => theme.spacing.px10};
`;

export const TabStrip = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.px2};
  border-bottom: 1px solid ${({ theme }) => theme.app.border.default};
`;

export const Tab = styled.button<{ $active: boolean }>`
  background: none;
  border: none;
  padding: ${({ theme }) => theme.spacing.s3} ${({ theme }) => theme.spacing.px14};
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${(props) =>
    props.$active ? props.theme.typography.weights.semibold : props.theme.typography.weights.medium};
  font-family: inherit;
  color: ${(props) => (props.$active ? props.theme.app.text.primary : props.theme.app.text.muted)};
  border-bottom: 2px solid ${(props) => (props.$active ? props.theme.app.status.info.fg : 'transparent')};
  margin-bottom: -1px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.px6};

  &:hover {
    color: ${({ theme }) => theme.app.text.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 2px;
  }
`;

export const OrgBadge = styled.span`
  font-size: ${({ theme }) => theme.app.type.micro};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.micro};
  color: ${({ theme }) => theme.app.status.warning.fg};
  border: 1px solid ${({ theme }) => theme.app.status.warning.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  padding: ${({ theme }) => theme.spacing.px2} ${({ theme }) => theme.spacing.px6};
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
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: ${({ theme }) => theme.spacing.px14} ${({ theme }) => theme.spacing.s4};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.px6};
`;

export const PinHead = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.px10};
`;

export const PinTitle = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${({ theme }) => theme.app.text.primary};
`;

export const PinState = styled.span`
  margin-left: auto;
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.app.text.muted};
  white-space: nowrap;
`;

export const PinMeta = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
`;

export const PinFix = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
`;

export const PinActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.s4};
  margin-top: ${({ theme }) => theme.spacing.s1};
`;

export const TextButton = styled.button`
  background: none;
  border: none;
  padding: ${({ theme }) => theme.spacing.px6} 0;
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
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
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: ${({ theme }) => theme.spacing.px20};
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
  text-align: center;
`;

export const Dropzone = styled.button`
  width: 100%;
  border: 1.5px dashed ${({ theme }) => theme.app.border.strong};
  border-radius: ${({ theme }) => theme.radii['2xl']};
  background: ${({ theme }) => theme.app.surface.subtle};
  padding: ${({ theme }) => theme.spacing.s6} ${({ theme }) => theme.spacing.px20};
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
  font-size: ${({ theme }) => theme.app.type.title};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.micro};
`;

export const DropSub = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  margin-top: ${({ theme }) => theme.spacing.px6};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
`;

export const FileRow = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ theme }) => theme.app.surface.subtle};
  padding: ${({ theme }) => theme.spacing.px14} ${({ theme }) => theme.spacing.s4};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.px10};
`;

export const UploadList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.px10};
  margin-top: ${({ theme }) => theme.spacing.s3};
`;

export const FileHead = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.px10};
  font-size: ${({ theme }) => theme.app.type.body};
`;

export const FileName = styled.strong`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.app.text.primary};
`;

export const FileMeta = styled.span`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  white-space: nowrap;
  font-variant-numeric: ${({ theme }) => theme.app.numeric};
`;

export const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.s3};

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

export const Stepper = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.px10};
`;

export const StepBtn = styled.button`
  width: ${({ theme }) => theme.app.iconSize.lg};
  height: ${({ theme }) => theme.app.iconSize.lg};
  border-radius: ${({ theme }) => theme.radii.sm};
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
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  min-width: ${({ theme }) => theme.app.iconSize.md};
  text-align: center;
  font-variant-numeric: ${({ theme }) => theme.app.numeric};
  color: ${({ theme }) => theme.app.text.primary};
`;

export const ConnectorRow = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: ${({ theme }) => theme.spacing.px14} ${({ theme }) => theme.spacing.s4};
  background: ${({ theme }) => theme.app.surface.subtle};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.px6};
`;

export const ConnectorList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.px10};
  margin-top: ${({ theme }) => theme.spacing.s3};
`;

export const InlineForm = styled.div`
  margin-top: ${({ theme }) => theme.spacing.s1};
  display: grid;
  gap: ${({ theme }) => theme.spacing.s3};
`;

export const TabPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s3};
  padding-top: ${({ theme }) => theme.spacing.s1};
`;

export const ViewerNote = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ theme }) => theme.app.surface.subtle};
  padding: ${({ theme }) => theme.spacing.px14} ${({ theme }) => theme.spacing.s4};
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
`;
