import styled from 'styled-components';

/**
 * Model section — redesigned from the supplied SVG ("Model — selection,
 * per-model configuration, defaults, credentials").
 *
 * Flat console colors only — no gradients. All values come from the theme
 * tokens (foundation pass); no raw literals.
 */

/* ── Header blocker pill ───────────────────────────────────────── */

export const BlockerPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.px6};
  padding: ${({ theme }) => theme.spacing.s1} ${({ theme }) => theme.spacing.px10};
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.app.status.error.fg};
  background: ${({ theme }) => theme.app.status.error.bg};
  border: 1px solid ${({ theme }) => theme.app.status.error.border};
`;

/* ── Pipeline ──────────────────────────────────────────────────── */

export const PipelineCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s3};
  padding: ${({ theme }) => theme.spacing.s5};
  border-radius: ${({ theme }) => theme.radii['3xl']};
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
`;

export const PipelineHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.s3};
`;

export const ServingOrderLabel = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 ${({ theme }) => theme.spacing.px6};
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.app.text.secondary};
  background: ${({ theme }) => theme.app.surface.tint};
  border: 1px solid ${({ theme }) => theme.app.border.default};
`;

export const PipelineRowShell = styled.div`
  border-radius: ${({ theme }) => theme.radii['2xl']};
  background: ${({ theme }) => theme.app.surface.tint};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  overflow: hidden;
`;

export const PipelineRowHead = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s2};

  > button:first-child {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.s3};
    padding: ${({ theme }) => theme.spacing.s3} ${({ theme }) => theme.spacing.s4};
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    color: inherit;

    > div:nth-child(3) {
      flex: 1;
      min-width: 0;
    }

    svg:last-child {
      flex-shrink: 0;
      color: ${({ theme }) => theme.app.text.muted};
    }
  }
`;

export const PipelineRowTitle = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.app.text.primary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const PipelineRowMeta = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const PipelineRowActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s1};
  padding-right: ${({ theme }) => theme.spacing.s2};
`;

export const RowButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: transparent;
  border: 1px solid transparent;
  color: ${({ theme }) => theme.app.text.secondary};
  font-size: 14px;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.app.surface.hover};
    border-color: ${({ theme }) => theme.app.border.default};
    color: ${({ theme }) => theme.app.text.primary};
  }

  &:disabled {
    opacity: 0.3;
    cursor: default;
  }
`;

export const ModelIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: ${({ theme }) => theme.radii.xl};
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.app.text.primary};
  background: ${({ theme }) => theme.app.surface.active};
  border: 1px solid ${({ theme }) => theme.app.border.default};
`;

export const CredBadge = styled.span<{ $tone: 'red' | 'green' }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s1};
  padding: 2px ${({ theme }) => theme.spacing.s2};
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: ${({ theme }) => theme.app.type.micro};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
  color: ${({ theme, $tone }) => theme.app.status[$tone === 'red' ? 'error' : 'success'].fg};
  background: ${({ theme, $tone }) => theme.app.status[$tone === 'red' ? 'error' : 'success'].bg};
  border: 1px solid ${({ theme, $tone }) => theme.app.status[$tone === 'red' ? 'error' : 'success'].border};
`;

export const EmptyPipeline = styled.div`
  padding: ${({ theme }) => theme.spacing.s5};
  border-radius: ${({ theme }) => theme.radii['2xl']};
  border: 1px dashed ${({ theme }) => theme.app.border.default};
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  text-align: center;
`;

export const AddModelButton = styled.button`
  align-self: stretch;
  padding: ${({ theme }) => theme.spacing.s3};
  border-radius: ${({ theme }) => theme.radii['2xl']};
  border: 1px dashed ${({ theme }) => theme.app.border.default};
  background: transparent;
  color: ${({ theme }) => theme.app.text.secondary};
  font-size: ${({ theme }) => theme.app.type.body};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.app.text.primary};
    border-color: ${({ theme }) => theme.app.text.muted};
    background: ${({ theme }) => theme.app.surface.subtle};
  }
`;

export const HelperText = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.5;

  button {
    background: none;
    border: none;
    padding: 0;
    color: ${({ theme }) => theme.app.text.secondary};
    font-size: inherit;
    text-decoration: underline;
    cursor: pointer;

    &:hover {
      color: ${({ theme }) => theme.app.text.primary};
    }
  }
`;

/* ── Per-model config (expanded row) ───────────────────────────── */

export const ParamLabel = styled.label`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s2};
  margin: ${({ theme }) => theme.spacing.s4} 0 ${({ theme }) => theme.spacing.s2};
  font-size: ${({ theme }) => theme.app.type.micro};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.muted};
`;

export const SelectWrap = styled.div`
  select {
    width: 100%;
    padding: ${({ theme }) => theme.spacing.s2} ${({ theme }) => theme.spacing.s3};
    border-radius: ${({ theme }) => theme.radii.xl};
    background: ${({ theme }) => theme.app.surface.subtle};
    border: 1px solid ${({ theme }) => theme.app.border.default};
    color: ${({ theme }) => theme.app.text.primary};
    font-size: ${({ theme }) => theme.app.type.body};
    cursor: pointer;

    &:disabled {
      opacity: 0.6;
      cursor: default;
    }
  }
`;

export const VersionInput = styled.input`
  width: 100%;
  margin-top: ${({ theme }) => theme.spacing.s2};
  padding: ${({ theme }) => theme.spacing.s2} ${({ theme }) => theme.spacing.s3};
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  color: ${({ theme }) => theme.app.text.primary};
  font-size: ${({ theme }) => theme.app.type.body};

  &::placeholder {
    color: ${({ theme }) => theme.app.text.ghost};
  }
`;

export const OverrideToggle = styled.div`
  margin-top: ${({ theme }) => theme.spacing.s4};
  padding-top: ${({ theme }) => theme.spacing.s3};
  border-top: 1px solid ${({ theme }) => theme.app.border.default};
`;

/**
 * Inline switch + visible text pair — used where the switch's own label is
 * the control's only visible label. The Switch component renders no visible
 * label text (label prop = accessible name only), so the visible copy lives
 * here, styled to match the switch's former label treatment.
 */
export const SwitchLabelPair = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.px10};
`;

export const SwitchLabelText = styled.label`
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  cursor: pointer;
  user-select: none;
`;

export const OverrideGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s2};
  margin-top: ${({ theme }) => theme.spacing.s2};
  padding: ${({ theme }) => theme.spacing.s3};
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
`;

/* ── Defaults ──────────────────────────────────────────────────── */

export const DefaultsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s4};
  padding: ${({ theme }) => theme.spacing.s5};
  border-radius: ${({ theme }) => theme.radii['3xl']};
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};

  > button {
    align-self: flex-start;
    background: none;
    border: none;
    padding: ${({ theme }) => theme.spacing.s1} 0;
    color: ${({ theme }) => theme.app.text.secondary};
    font-size: ${({ theme }) => theme.app.type.caption};
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.px6};

    &:hover {
      color: ${({ theme }) => theme.app.text.primary};
    }
  }
`;

export const SliderRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s2};
`;

export const SliderHead = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.s2};
`;

export const SliderName = styled.span`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.app.text.primary};
`;

export const SliderValue = styled.span`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const RangeInput = styled.input`
  width: 100%;
  accent-color: ${({ theme }) => theme.app.accentControl};
  cursor: pointer;
`;

export const RangeEnds = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
`;

export const FormatHelp = styled.p`
  margin: ${({ theme }) => theme.spacing.s1} 0 0;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
`;

/* ── Schema card ───────────────────────────────────────────────── */

export const SchemaCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s2};
  padding: ${({ theme }) => theme.spacing.s4};
  border-radius: ${({ theme }) => theme.radii['2xl']};
  background: ${({ theme }) => theme.app.surface.tint};
  border: 1px solid ${({ theme }) => theme.app.border.default};
`;

export const SchemaNameRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s2};
`;

export const SchemaPreview = styled.pre`
  margin: 0;
  padding: ${({ theme }) => theme.spacing.s3};
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  font-size: ${({ theme }) => theme.app.type.caption};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  color: ${({ theme }) => theme.app.text.secondary};
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 160px;
  overflow: hidden;
`;

export const SchemaActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s2};

  button {
    background: none;
    border: 1px solid ${({ theme }) => theme.app.border.default};
    border-radius: ${({ theme }) => theme.radii.xl};
    padding: ${({ theme }) => theme.spacing.px6} ${({ theme }) => theme.spacing.s3};
    color: ${({ theme }) => theme.app.text.primary};
    font-size: ${({ theme }) => theme.app.type.caption};
    cursor: pointer;

    &:hover {
      background: ${({ theme }) => theme.app.surface.hover};
    }
  }
`;

export const SchemaBadge = styled.span<{ $tone: 'green' | 'red' }>`
  display: inline-flex;
  align-items: center;
  padding: 2px ${({ theme }) => theme.spacing.s2};
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: ${({ theme }) => theme.app.type.micro};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${({ theme, $tone }) => theme.app.status[$tone === 'green' ? 'success' : 'error'].fg};
  background: ${({ theme, $tone }) => theme.app.status[$tone === 'green' ? 'success' : 'error'].bg};
  border: 1px solid ${({ theme, $tone }) => theme.app.status[$tone === 'green' ? 'success' : 'error'].border};
`;

/* ── Rail: readiness ───────────────────────────────────────────── */

export const ReadinessCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s2};
  padding: ${({ theme }) => theme.spacing.s4};
  border-radius: ${({ theme }) => theme.radii['2xl']};
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
`;

export const ReadinessLabel = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.muted};
  margin-bottom: ${({ theme }) => theme.spacing.s1};
`;

export const ReadinessItem = styled.div<{ $done: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.s2};
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme, $done }) => ($done ? theme.app.text.secondary : theme.app.text.primary)};

  > span[aria-hidden='true'] {
    color: ${({ theme, $done }) =>
      $done ? theme.app.status.success.fg : theme.app.status.warning.fg};
    font-weight: ${({ theme }) => theme.typography.weights.semibold};
  }

  > div {
    flex: 1;
    min-width: 0;
  }

  button {
    background: none;
    border: none;
    padding: 0;
    color: ${({ theme }) => theme.app.text.secondary};
    font-size: ${({ theme }) => theme.app.type.caption};
    text-decoration: underline;
    cursor: pointer;
    white-space: nowrap;

    &:hover {
      color: ${({ theme }) => theme.app.text.primary};
    }
  }
`;

export const ReadinessMeta = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
`;

export const HeldBox = styled.div`
  margin-top: ${({ theme }) => theme.spacing.s2};
  padding: ${({ theme }) => theme.spacing.s3};
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ theme }) => theme.app.status.error.bg};
  border: 1px solid ${({ theme }) => theme.app.status.error.border};
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.status.error.fg};

  strong {
    display: block;
    margin-bottom: ${({ theme }) => theme.spacing.px6};
    font-weight: ${({ theme }) => theme.typography.weights.semibold};
  }
`;

export const HeldItem = styled.div`
  margin-top: ${({ theme }) => theme.spacing.s1};
  line-height: 1.5;
`;

/* ── Shared switch row (re-exported by 7 sibling section style files) ── */

export const SwitchRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.px20};
  padding: ${({ theme }) => theme.spacing.px10} ${({ theme }) => theme.spacing.s3};
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
`;

export const SwitchText = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s1};
  min-width: 0;
`;

export const SwitchTitle = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.micro};
  color: ${({ theme }) => theme.app.text.primary};
`;

export const SwitchSub = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
`;
