import styled from 'styled-components';

/**
 * Knowledge section — redesign (SectionPage shell).
 *
 * Four cards in descending importance: retrieval policy, pinned sources,
 * the add-sources surface, and source defaults. Pin rows carry the
 * section's payload (slug title, state pill, version/mode mono line);
 * the kebab is a lightweight popover, never a modal. PinMeta/TextButton
 * stay exported — sibling sections re-export them.
 */

/* ── Card ─────────────────────────────────────────────────────── */

export const Card = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ theme }) => theme.app.surface.subtle};
  padding: ${({ theme }) => theme.spacing.s4};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s3};
`;

export const CardHeadRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.s3};
`;

export const CardHelper = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
`;

/** Amber warn badge, e.g. "1 stale pin" in the pinned-sources header. */
export const StaleBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.px6};
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.app.status.warning.fg};
  border: 1px solid ${({ theme }) => theme.app.status.warning.border};
  background: ${({ theme }) => theme.app.status.warning.bg};
  border-radius: ${({ theme }) => theme.radii.pill};
  padding: ${({ theme }) => theme.spacing.s1} ${({ theme }) => theme.spacing.px10};
  white-space: nowrap;
`;

/* ── Retrieval rows ───────────────────────────────────────────── */

export const ControlRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.s4};
  padding: ${({ theme }) => theme.spacing.s1} 0;
`;

export const ControlText = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.px2};
  min-width: 0;
`;

export const ControlTitle = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.app.text.primary};
`;

export const ControlSub = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
`;

/* ── Pin rows ─────────────────────────────────────────────────── */

export const PinList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.px10};
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

export const PinIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.app.text.muted};
  flex-shrink: 0;
`;

export const PinTitle = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${({ theme }) => theme.app.text.primary};
  min-width: 0;
  flex: 1;
`;

export const PinState = styled.span`
  font-size: ${({ theme }) => theme.app.type.micro};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.micro};
  text-transform: uppercase;
  padding: ${({ theme }) => theme.spacing.px2} ${({ theme }) => theme.spacing.px6};
  border-radius: ${({ theme }) => theme.radii.pill};
  white-space: nowrap;
  color: ${({ theme }) => theme.app.text.secondary};
  background: ${({ theme }) => theme.app.surface.tint};
`;

export const PinMeta = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
`;

/** Mono version/mode line under a pin row: kb/slug · v3 · pinned. */
export const MonoLine = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  align-items: center;
`;

/** Amber "Stale — v3 in library" pill on a drifted pin row. */
export const StalePill = styled.span`
  display: inline-flex;
  align-items: center;
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.app.status.warning.fg};
  background: ${({ theme }) => theme.app.status.warning.bg};
  border: 1px solid ${({ theme }) => theme.app.status.warning.border};
  border-radius: ${({ theme }) => theme.radii.pill};
  padding: ${({ theme }) => theme.spacing.px2} ${({ theme }) => theme.spacing.px10};
  white-space: nowrap;
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

/* ── Icon buttons (row ×, kebab) ──────────────────────────────── */

export const IconBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${({ theme }) => theme.app.iconSize.lg};
  height: ${({ theme }) => theme.app.iconSize.lg};
  border-radius: ${({ theme }) => theme.radii.sm};
  border: none;
  background: none;
  color: ${({ theme }) => theme.app.text.muted};
  cursor: pointer;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    color: ${({ theme }) => theme.app.text.primary};
    background: ${({ theme }) => theme.app.surface.tint};
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

export const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
`;

/* ── Kebab popover (lightweight — never a modal) ───────────────── */

export const KebabWrap = styled.div`
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
`;

export const KebabMenu = styled.div`
  position: absolute;
  top: calc(100% + ${({ theme }) => theme.spacing.s1});
  right: 0;
  min-width: 180px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.app.surface.glass};
  box-shadow: ${({ theme }) => theme.shadows.md};
  padding: ${({ theme }) => theme.spacing.s1};
  z-index: ${({ theme }) => theme.zIndices.popover};
  display: flex;
  flex-direction: column;
`;

export const KebabItem = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.px10};
  width: 100%;
  border: none;
  background: none;
  padding: ${({ theme }) => theme.spacing.px10} ${({ theme }) => theme.spacing.px10};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.app.type.body};
  font-family: inherit;
  color: ${({ theme }) => theme.app.text.primary};
  cursor: pointer;
  text-align: left;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.app.surface.tint};
  }

  &:disabled {
    opacity: 0.4;
    cursor: default;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: -2px;
  }
`;

/** Dashed "+ Pin from library" call-to-action at the card foot. */
export const PinCta = styled.button`
  width: 100%;
  border: 1.5px dashed ${({ theme }) => theme.app.border.strong};
  border-radius: ${({ theme }) => theme.radii.xl};
  background: none;
  padding: ${({ theme }) => theme.spacing.px14};
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  font-family: inherit;
  color: ${({ theme }) => theme.app.text.secondary};
  cursor: pointer;
  transition: border-color ${({ theme }) => theme.transitions.fast}, color ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.app.border.hover};
    color: ${({ theme }) => theme.app.text.primary};
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

export const PinCounter = styled.div`
  align-self: flex-end;
  font-size: ${({ theme }) => theme.app.type.caption};
  font-variant-numeric: ${({ theme }) => theme.app.numeric};
  color: ${({ theme }) => theme.app.text.muted};
`;

/* ── Add-sources tabs ─────────────────────────────────────────── */

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

export const TabPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s3};
  padding-top: ${({ theme }) => theme.spacing.s1};
`;

/* ── Dropzone / files / uploads ───────────────────────────────── */

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
  min-width: 0;
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

export const InlineForm = styled.div`
  margin-top: ${({ theme }) => theme.spacing.s1};
  display: grid;
  gap: ${({ theme }) => theme.spacing.s3};
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

/* ── Stepper ──────────────────────────────────────────────────── */

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

/* ── Connectors ───────────────────────────────────────────────── */

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

/* ── Source defaults ──────────────────────────────────────────── */

export const DefaultsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.s3};

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

export const Select = styled.select`
  width: 100%;
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.app.surface.tint};
  color: ${({ theme }) => theme.app.text.primary};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.body};
  padding: ${({ theme }) => theme.spacing.px10} ${({ theme }) => theme.spacing.px14};
  cursor: pointer;

  &:disabled {
    opacity: 0.4;
    cursor: default;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

export const FieldLabel = styled.label`
  display: block;
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.micro};
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.muted};
  margin-bottom: ${({ theme }) => theme.spacing.px6};
`;

/* ── Library stats (right rail) ───────────────────────────────── */

export const StatRows = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.px6};
  margin-top: ${({ theme }) => theme.spacing.s1};
`;

export const StatRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  font-size: ${({ theme }) => theme.app.type.body};
`;

export const StatLabel = styled.span`
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const StatValue = styled.span`
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  font-variant-numeric: ${({ theme }) => theme.app.numeric};
  color: ${({ theme }) => theme.app.text.primary};
`;

export const PinProgress = styled.div`
  margin-top: ${({ theme }) => theme.spacing.s2};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.px6};
`;

export const PinProgressLabel = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  font-variant-numeric: ${({ theme }) => theme.app.numeric};
`;
