import styled from 'styled-components';

export { FieldBlock, FieldHead, FieldHelper, FieldTitle } from './InstructionsSection.styles';

/* ── Shared legacy primitives ────────────────────────────────────
 * Still consumed by sections awaiting their redesign (Budget, Context,
 * Guardrails, Knowledge, Memory, Response, Tools). Do not restyle here —
 * each section migrates to the shared field anatomy on its own pass. */

export const ResolvedCard = styled.div<{ $tone: 'ok' | 'attention' }>`
  border: 1px solid
    ${({ theme, $tone }) => ($tone === 'ok' ? theme.app.border.default : theme.app.status.warning.border)};
  background: ${({ theme, $tone }) => ($tone === 'ok' ? theme.app.surface.subtle : theme.app.status.warning.bg)};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.px10} ${({ theme }) => theme.spacing.s3};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s1};
`;

export const ResolvedTitle = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s2};
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.app.text.primary};
`;

export const ResolvedMeta = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
`;

export const FixRow = styled.div`
  margin-top: ${({ theme }) => theme.spacing.s1};
`;

export const SwitchRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.px10};
  padding: ${({ theme }) => theme.spacing.s1} ${({ theme }) => theme.spacing.px2};
`;

export const SwitchText = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.px2};
  flex: 1;
`;

export const SwitchTitle = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.app.text.primary};
`;

export const SwitchSub = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
`;

/* ── Brain: reasoning profiles ───────────────────────────────────
 * Choosing how the model thinks is a character choice, not a config
 * table — cards carry the preset's story (name, blurb, signature) and
 * the current one wears a confident selected state. */

/* ── Denied note ───────────────────────────────────────────────
 * Brain was the only section without denied copy: viewers saw inert
 * disabled preset cards with no explanation. Names the required roles
 * (Knowledge's ViewerNote pattern) and what stays visible. */

export const DeniedNote = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ theme }) => theme.app.surface.subtle};
  padding: ${({ theme }) => theme.spacing.px14} ${({ theme }) => theme.spacing.s4};
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
`;

export const ProfileGrid = styled.div`  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing.s3};

  @media (max-width: ${({ theme }) => theme.containers.narrow}) {
    grid-template-columns: 1fr;
  }
`;

export const ProfileCard = styled.button<{ $active?: boolean }>`
  border: 1px solid
    ${({ theme, $active }) => ($active ? theme.app.status.info.border : theme.app.border.default)};
  background: ${({ theme, $active }) => ($active ? theme.app.status.info.bg : theme.app.surface.subtle)};
  border-radius: ${({ theme }) => theme.radii['2xl']};
  padding: ${({ theme }) => theme.spacing.s5};
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s2};
  min-height: 168px;

  &:hover:not(:disabled) {
    border-color: ${({ theme, $active }) => ($active ? theme.app.status.info.border : theme.app.border.hover)};
  }

  &:disabled {
    cursor: default;
    opacity: 0.75;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: ${({ theme }) => theme.spacing.px2};
  }
`;

export const ProfileName = styled.div`
  font-size: ${({ theme }) => theme.app.type.title};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.tight};
  color: ${({ theme }) => theme.app.text.primary};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.s2};
`;

export const ProfileBlurb = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
  flex: 1;
`;

export const ProfileMap = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  font-variant-numeric: ${({ theme }) => theme.app.numeric};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
  padding-top: ${({ theme }) => theme.spacing.s2};
  border-top: 1px solid ${({ theme }) => theme.app.border.default};
`;

export const ProfileMatch = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s1};
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.app.status.info.fg};
`;

export const ParamGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.px10};
`;

export const SliderRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s1};
`;

export const SliderHead = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const SliderValue = styled.span`
  font-variant-numeric: ${({ theme }) => theme.app.numeric};
  color: ${({ theme }) => theme.app.text.primary};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
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
  color: ${({ theme }) => theme.app.text.ghost};
  font-variant-numeric: ${({ theme }) => theme.app.numeric};
`;

export const AdvancedToggle = styled.button`
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.app.text.secondary};
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  font-family: inherit;
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.px6} ${({ theme }) => theme.spacing.px2};
  text-align: left;

  &:hover {
    color: ${({ theme }) => theme.app.text.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

export const StaticRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.s2};
  padding: ${({ theme }) => theme.spacing.s2} ${({ theme }) => theme.spacing.px10};
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.primary};
`;

export const StaticLabel = styled.span`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
`;
