import styled from 'styled-components';

export const ResolvedCard = styled.div<{ $tone: 'ok' | 'attention' }>`
  border: 1px solid
    ${({ theme, $tone }) => ($tone === 'ok' ? theme.app.border.default : theme.app.status.warning.border)};
  background: ${({ theme, $tone }) => ($tone === 'ok' ? theme.app.surface.subtle : theme.app.status.warning.bg)};
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const ResolvedTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 650;
  color: ${({ theme }) => theme.app.text.primary};
`;

export const ResolvedMeta = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.5;
`;

export const FixRow = styled.div`
  margin-top: 4px;
`;

export const SwitchRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 2px;
`;

export const SwitchText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
`;

export const SwitchTitle = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.primary};
`;

export const SwitchSub = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.5;
`;

export const ProfileGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
`;

export const ProfileCard = styled.button<{ $active?: boolean }>`
  border: 1px solid
    ${({ theme, $active }) => ($active ? theme.app.status.info.border : theme.app.border.default)};
  background: ${({ theme, $active }) => ($active ? theme.app.status.info.bg : theme.app.surface.subtle)};
  border-radius: 11px;
  padding: 10px;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  display: flex;
  flex-direction: column;
  gap: 4px;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.app.border.hover};
  }

  &:disabled {
    cursor: default;
    opacity: 0.75;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

export const ProfileName = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 650;
  color: ${({ theme }) => theme.app.text.primary};
`;

export const ProfileBlurb = styled.div`
  font-size: 10px;
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.5;
`;

export const ProfileMap = styled.div`
  font-size: 10px;
  color: ${({ theme }) => theme.app.text.ghost};
  font-variant-numeric: tabular-nums;
`;

export const ProfileMatch = styled.div`
  font-size: 10px;
  font-weight: 600;
  color: ${({ theme }) => theme.app.status.info.fg};
`;

export const ParamGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const SliderRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const SliderHead = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const SliderValue = styled.span`
  font-variant-numeric: tabular-nums;
  color: ${({ theme }) => theme.app.text.primary};
  font-weight: 600;
`;

export const RangeInput = styled.input`
  width: 100%;
  accent-color: #0a84ff;
  cursor: pointer;
`;

export const RangeEnds = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: ${({ theme }) => theme.app.text.ghost};
  font-variant-numeric: tabular-nums;
`;

export const AdvancedToggle = styled.button`
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.app.text.secondary};
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  padding: 6px 2px;
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
  gap: 8px;
  padding: 8px 10px;
  border-radius: 9px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.primary};
`;

export const StaticLabel = styled.span`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
`;
