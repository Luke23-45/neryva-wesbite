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
  gap: 16px;
  align-items: flex-start;
  padding: 22px 24px;
  border-radius: 18px;
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
  gap: 6px;
`;

export const ModelHeroName = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 19px;
  font-weight: 650;
  letter-spacing: -0.01em;
  color: ${({ theme }) => theme.app.text.primary};
  overflow-wrap: anywhere;
`;

export const ModelHeroMeta = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.55;
  overflow-wrap: anywhere;
`;

export const ModelHeroEmpty = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: 1.6;
`;

export const ModelHeroFix = styled.div`
  margin-top: 8px;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.status.warning.fg};
  line-height: 1.55;
`;

/* ── Fallback switch ───────────────────────────────────────────── */

export const SwitchRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 18px 20px;
  border-radius: 14px;
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
`;

export const SwitchText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

export const SwitchTitle = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 600;
  letter-spacing: -0.005em;
  color: ${({ theme }) => theme.app.text.primary};
`;

export const SwitchSub = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.5;
`;

/* ── Parameters ────────────────────────────────────────────────── */

export const ParamStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const SliderRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const SliderHead = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
`;

export const SliderName = styled.span`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 600;
  letter-spacing: -0.005em;
  color: ${({ theme }) => theme.app.text.primary};
`;

export const SliderValue = styled.span`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  font-variant-numeric: tabular-nums;
`;

export const RangeInput = styled.input`
  width: 100%;
  accent-color: #0a84ff;
  cursor: pointer;
`;

export const RangeEnds = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.faint};
  font-variant-numeric: tabular-nums;
`;

export const AdvancedToggle = styled.button`
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.app.text.muted};
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  padding: 8px 0;
  border-radius: 8px;

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
  gap: 12px;
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
  margin-top: 12px;
`;
