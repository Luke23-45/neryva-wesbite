import styled from 'styled-components';

/**
 * Model section — redesigned.
 *
 * The model choice is the most consequential decision on the page, so it
 * gets hero treatment: a current-model card with presence, then fallback,
 * the catalog, parameters, and credentials in descending importance.
 */

export { FieldBlock, FieldHead, FieldHelper, FieldTitle } from './InstructionsSection.styles';

/* ── Hero: the current model ───────────────────────────────────── */

export const ModelHero = styled.div<{ $tone: 'ok' | 'attention' }>`
  display: flex;
  gap: ${({ theme }) => theme.spacing.s4};
  align-items: flex-start;
  padding: ${({ theme }) => theme.spacing.s5};
  border-radius: ${({ theme }) => theme.radii['3xl']};
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid
    ${({ theme, $tone }) =>
      $tone === 'attention' ? theme.app.status.warning.border : theme.app.border.default};
`;

export const ModelHeroMain = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.px6};
`;

export const ModelHeroName = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.px10};
  font-size: ${({ theme }) => theme.app.type.titleLg};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.tight};
  color: ${({ theme }) => theme.app.text.primary};
  overflow-wrap: anywhere;
`;

export const ModelHeroMeta = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
  overflow-wrap: anywhere;
`;

export const ModelHeroEmpty = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
`;

export const ModelHeroFix = styled.div`
  margin-top: ${({ theme }) => theme.spacing.s2};
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.status.warning.fg};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
`;

/* ── Fallback switch ───────────────────────────────────────────── */

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

/* ── Parameters ────────────────────────────────────────────────── */

export const ParamStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.px20};
`;

export const SliderRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.px10};
`;

export const SliderHead = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.s3};
`;

export const SliderName = styled.span`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.micro};
  color: ${({ theme }) => theme.app.text.primary};
`;

export const SliderValue = styled.span`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  font-variant-numeric: ${({ theme }) => theme.app.numeric};
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
  color: ${({ theme }) => theme.app.text.faint};
  font-variant-numeric: ${({ theme }) => theme.app.numeric};
`;

export const AdvancedToggle = styled.button`
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.px6};
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.app.text.muted};
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  font-family: inherit;
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.s2} 0;
  border-radius: ${({ theme }) => theme.radii.sm};

  &:hover {
    color: ${({ theme }) => theme.app.text.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 2px;
  }
`;

export const StaticFallback = styled.div`
  display: flex;
  align-items: baseline;
  gap: ${({ theme }) => theme.spacing.s3};
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const ToggleChevron = styled.span<{ $open: boolean }>`
  display: inline-flex;
  color: ${({ theme }) => theme.app.text.muted};
  transform: rotate(${({ $open }) => ($open ? 180 : 0)}deg);
  transition: transform ${({ theme }) => theme.transitions.fast};
`;

export const CredentialsBlock = styled.div`
  margin-top: ${({ theme }) => theme.spacing.s3};
`;
