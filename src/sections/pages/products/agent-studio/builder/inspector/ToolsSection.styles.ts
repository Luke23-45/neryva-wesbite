import styled from 'styled-components';

/**
 * Tools section — redesigned (bound tools with entry-local switches,
 * catalog binding, perimeter, approvals).
 *
 * Five blocks: the page header pill, bound entries, the catalog table,
 * the perimeter aggregate, and approvals. TextButton + ToolFix stay
 * exported — BudgetSection/EvalResults/TraceDrawer/TryConsole and
 * GuardrailsSection consume them.
 */

/* ── Shared ─────────────────────────────────────────────────── */

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
    outline: ${({ theme }) => theme.spacing.px2} solid ${({ theme }) => theme.app.border.focus};
    outline-offset: ${({ theme }) => theme.spacing.px2};
  }
`;

export const MutedButton = styled(TextButton)`
  color: ${({ theme }) => theme.app.text.muted};
`;

export const ToolFix = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
`;

export const Footnote = styled.p`
  margin: ${({ theme }) => theme.spacing.s1} 0 0;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
`;

/* ── Page header pill ───────────────────────────────────────── */

export const AmberPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s1};
  padding: ${({ theme }) => theme.spacing.s1} ${({ theme }) => theme.spacing.s3};
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1px solid ${({ theme }) => theme.app.status.warning.border};
  background: ${({ theme }) => theme.app.status.warning.bg};
  color: ${({ theme }) => theme.app.status.warning.fg};
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  white-space: nowrap;
`;

export const PillDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  flex: none;
`;

/* ── Group card ─────────────────────────────────────────────── */

export const GroupCard = styled.div`
  background: ${({ theme }) => theme.app.bg.raised};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: ${({ theme }) => theme.spacing.s4};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s3};
`;

export const CardHead = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.s3};
`;

export const CardIcon = styled.span<{ $tone?: 'warning' | 'ok' }>`
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.app.surface.subtle};
  color: ${({ theme, $tone }) =>
    $tone === 'warning' ? theme.app.status.warning.fg : theme.app.text.secondary};
`;

export const CardTitleWrap = styled.div`
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.px2};
`;

export const CardTitle = styled.h2`
  margin: 0;
  font-size: ${({ theme }) => theme.app.type.title};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.tight};
  color: ${({ theme }) => theme.app.text.primary};
`;

export const CardSub = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
`;

export const CountPill = styled.span`
  flex: none;
  padding: ${({ theme }) => theme.spacing.s1} ${({ theme }) => theme.spacing.s3};
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  color: ${({ theme }) => theme.app.text.secondary};
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  font-variant-numeric: ${({ theme }) => theme.app.numeric};
  white-space: nowrap;
`;

/* ── Bound rows ─────────────────────────────────────────────── */

export const BoundList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s2};
`;

export const BoundRow = styled.div<{ $expanded?: boolean; $attention?: boolean }>`
  border: 1px solid
    ${({ theme, $attention }) => ($attention ? theme.app.status.warning.border : theme.app.border.default)};
  background: ${({ theme }) => theme.app.bg.base};
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
`;

export const RowBar = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s3};
  padding: ${({ theme }) => theme.spacing.s3} ${({ theme }) => theme.spacing.s3};
  min-width: 0;
`;

export const RowExpand = styled.button`
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s3};
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;

  &:focus-visible {
    outline: ${({ theme }) => theme.spacing.px2} solid ${({ theme }) => theme.app.border.focus};
    outline-offset: ${({ theme }) => theme.spacing.px2};
    border-radius: ${({ theme }) => theme.radii.sm};
  }
`;

export const RowIcon = styled.span`
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.app.surface.subtle};
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const RowText = styled.span`
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.px2};
`;

export const RowName = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.app.text.primary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const RowSub = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const EffectChip = styled.span<{ $variant: 'readonly' | 'ungated' | 'gated' }>`
  flex: none;
  padding: ${({ theme }) => theme.spacing.s1} ${({ theme }) => theme.spacing.s2};
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1px solid
    ${({ theme, $variant }) =>
      $variant === 'readonly'
        ? theme.app.status.success.border
        : $variant === 'ungated'
          ? theme.app.status.warning.border
          : theme.app.border.default};
  background: ${({ theme, $variant }) =>
    $variant === 'readonly'
      ? theme.app.status.success.bg
      : $variant === 'ungated'
        ? theme.app.status.warning.bg
        : theme.app.surface.subtle};
  color: ${({ theme, $variant }) =>
    $variant === 'readonly'
      ? theme.app.status.success.fg
      : $variant === 'ungated'
        ? theme.app.status.warning.fg
        : theme.app.text.secondary};
  font-size: ${({ theme }) => theme.app.type.micro};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  white-space: nowrap;
`;

export const IconButton = styled.button`
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: none;
  border: none;
  color: ${({ theme }) => theme.app.text.muted};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.app.surface.subtle};
    color: ${({ theme }) => theme.app.text.primary};
  }

  &:focus-visible {
    outline: ${({ theme }) => theme.spacing.px2} solid ${({ theme }) => theme.app.border.focus};
    outline-offset: ${({ theme }) => theme.spacing.px2};
  }
`;

/* ── Expanded entry-local panel ─────────────────────────────── */

export const ExpandPanel = styled.div`
  border-top: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.tint};
  padding: ${({ theme }) => theme.spacing.s3} ${({ theme }) => theme.spacing.s4};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s3};
`;

export const PanelLabel = styled.span`
  font-size: ${({ theme }) => theme.app.type.micro};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.muted};
`;

export const PanelBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s2};
`;

export const ApprovalRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s3};
  flex-wrap: wrap;
`;

export const SourceNote = styled.span`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
`;

export const PanelNoteAmber = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.status.warning.fg};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
`;

export const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s3};
`;

export const ToggleLabel = styled.span`
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const PanelFixes = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s1};
`;

export const FixLine = styled.p<{ $tone: 'warning' | 'error' | 'info' }>`
  margin: 0;
  font-size: ${({ theme }) => theme.app.type.caption};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
  color: ${({ theme, $tone }) =>
    $tone === 'warning'
      ? theme.app.status.warning.fg
      : $tone === 'error'
        ? theme.app.status.error.fg
        : theme.app.status.info.fg};
`;

/* ── Row "…" menu ───────────────────────────────────────────── */

export const MenuWrap = styled.div`
  position: relative;
  flex: none;
`;

export const MenuList = styled.div`
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  z-index: ${({ theme }) => theme.zIndices.popover};
  min-width: 200px;
  background: ${({ theme }) => theme.app.bg.raised};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.s1};
  box-shadow: ${({ theme }) => theme.shadows.md};
  display: flex;
  flex-direction: column;
`;

export const MenuItem = styled.button<{ $danger?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s2};
  width: 100%;
  padding: ${({ theme }) => theme.spacing.s2} ${({ theme }) => theme.spacing.s3};
  background: none;
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  font: inherit;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme, $danger }) => ($danger ? theme.app.status.error.fg : theme.app.text.primary)};
  text-align: left;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.app.surface.subtle};
  }

  &:focus-visible {
    outline: ${({ theme }) => theme.spacing.px2} solid ${({ theme }) => theme.app.border.focus};
    outline-offset: -${({ theme }) => theme.spacing.px2};
  }
`;

export const MenuCheck = styled.span`
  flex: none;
  width: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const MenuDivider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.app.border.default};
  margin: ${({ theme }) => theme.spacing.s1} ${({ theme }) => theme.spacing.s2};
`;

/* ── Dashed bind button ─────────────────────────────────────── */

export const DashedBind = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: ${({ theme }) => theme.spacing.s3};
  background: none;
  border: 1px dashed ${({ theme }) => theme.app.border.default};
  border-radius: ${({ theme }) => theme.radii.lg};
  font: inherit;
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.app.status.info.fg};
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.app.status.info.border};
    background: ${({ theme }) => theme.app.status.info.bg};
  }

  &:focus-visible {
    outline: ${({ theme }) => theme.spacing.px2} solid ${({ theme }) => theme.app.border.focus};
    outline-offset: ${({ theme }) => theme.spacing.px2};
  }
`;

/* ── Catalog table ──────────────────────────────────────────── */

export const FilterBar = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.s2};
  flex-wrap: wrap;
`;

export const FilterInputWrap = styled.div`
  flex: 1 1 220px;
  min-width: 0;
`;

export const StyledSelect = styled.select`
  flex: none;
  appearance: none;
  background: ${({ theme }) => theme.app.bg.base};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing.s2} ${({ theme }) => theme.spacing.s4};
  padding-right: ${({ theme }) => theme.spacing.s6};
  font: inherit;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.primary};
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%239aa3ad' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;

  &:focus-visible {
    outline: ${({ theme }) => theme.spacing.px2} solid ${({ theme }) => theme.app.border.focus};
    outline-offset: ${({ theme }) => theme.spacing.px2};
  }
`;

export const CatalogList = styled.div`
  display: flex;
  flex-direction: column;
`;

export const CatalogRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s3};
  padding: ${({ theme }) => theme.spacing.s3} ${({ theme }) => theme.spacing.s1};
  border-bottom: 1px solid ${({ theme }) => theme.app.border.hairline};

  &:last-child {
    border-bottom: none;
  }
`;

export const CatalogStatus = styled.span`
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: ${({ theme }) => theme.app.text.muted};
`;

export const CatalogName = styled.span`
  flex: 1 1 auto;
  min-width: 0;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.primary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ChipRow = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s1};
  flex-wrap: wrap;
`;

export const Chip = styled.span<{ $tone?: 'success' | 'warning' | 'info' | 'neutral' }>`
  display: inline-flex;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.px2} ${({ theme }) => theme.spacing.s2};
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1px solid
    ${({ theme, $tone }) =>
      $tone === 'success'
        ? theme.app.status.success.border
        : $tone === 'warning'
          ? theme.app.status.warning.border
          : $tone === 'info'
            ? theme.app.status.info.border
            : theme.app.border.default};
  background: ${({ theme, $tone }) =>
    $tone === 'success'
      ? theme.app.status.success.bg
      : $tone === 'warning'
        ? theme.app.status.warning.bg
        : $tone === 'info'
          ? theme.app.status.info.bg
          : theme.app.surface.subtle};
  color: ${({ theme, $tone }) =>
    $tone === 'success'
      ? theme.app.status.success.fg
      : $tone === 'warning'
        ? theme.app.status.warning.fg
        : $tone === 'info'
          ? theme.app.status.info.fg
          : theme.app.text.secondary};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  white-space: nowrap;
`;

export const SourceLabel = styled.span`
  flex: none;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  white-space: nowrap;
`;

export const BindAction = styled.button`
  flex: none;
  background: none;
  border: none;
  padding: ${({ theme }) => theme.spacing.s1} ${({ theme }) => theme.spacing.s1};
  font: inherit;
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.app.status.info.fg};
  cursor: pointer;
  white-space: nowrap;

  &:hover:not(:disabled) {
    text-decoration: underline;
  }

  &:disabled {
    opacity: 0.4;
    cursor: default;
  }

  &:focus-visible {
    outline: ${({ theme }) => theme.spacing.px2} solid ${({ theme }) => theme.app.border.focus};
    outline-offset: ${({ theme }) => theme.spacing.px2};
  }
`;

export const BoundLabel = styled.span`
  flex: none;
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.app.status.success.fg};
  white-space: nowrap;
`;

/* ── Perimeter ──────────────────────────────────────────────── */

export const PerimeterRows = styled.div`
  display: flex;
  flex-direction: column;
`;

export const PerimeterRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s3};
  padding: ${({ theme }) => theme.spacing.s3} ${({ theme }) => theme.spacing.s1};
  border-bottom: 1px solid ${({ theme }) => theme.app.border.hairline};

  &:last-child {
    border-bottom: none;
  }
`;

export const PerimeterLabel = styled.span`
  flex: 1 1 auto;
  min-width: 0;
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.app.text.primary};
`;

export const DriftDot = styled.span<{ $tone: 'ok' | 'warning' }>`
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme, $tone }) =>
    $tone === 'ok' ? theme.app.status.success.fg : theme.app.status.warning.fg};
`;

export const DriftText = styled.span`
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
`;

/* ── Approvals ──────────────────────────────────────────────── */

export const ApprovalDefaultRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.s3};
  flex-wrap: wrap;
  padding: ${({ theme }) => theme.spacing.s1};
`;

export const ApprovalDefaultLabel = styled.span`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.app.text.primary};
`;

export const UngatedList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s2};
`;

export const UngatedRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s3};
  padding: ${({ theme }) => theme.spacing.s2} ${({ theme }) => theme.spacing.s1};
`;

export const GateChip = styled.span`
  display: inline-flex;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.s1} ${({ theme }) => theme.spacing.s3};
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1px solid ${({ theme }) => theme.app.status.warning.border};
  background: ${({ theme }) => theme.app.status.warning.bg};
  color: ${({ theme }) => theme.app.status.warning.fg};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.caption};
  white-space: nowrap;
`;

/* ── Right rail ─────────────────────────────────────────────── */

export const RailRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s2};
  font-size: ${({ theme }) => theme.app.type.body};
`;

export const RailLabel = styled.span`
  flex: 1 1 auto;
  color: ${({ theme }) => theme.app.text.secondary};
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s2};
`;

export const RailValue = styled.span<{ $tone?: 'warning' | 'muted' }>`
  flex: none;
  font-variant-numeric: ${({ theme }) => theme.app.numeric};
  color: ${({ theme, $tone }) =>
    $tone === 'warning' ? theme.app.status.warning.fg : theme.app.text.muted};
`;

export const RailDot = styled.span<{ $tone: 'ok' | 'warning' | 'muted' }>`
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme, $tone }) =>
    $tone === 'ok'
      ? theme.app.status.success.fg
      : $tone === 'warning'
        ? theme.app.status.warning.fg
        : theme.app.text.muted};
`;

export const EmptyNote = styled.p`
  margin: 0;
  padding: ${({ theme }) => theme.spacing.s2} ${({ theme }) => theme.spacing.s1};
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.muted};
`;
