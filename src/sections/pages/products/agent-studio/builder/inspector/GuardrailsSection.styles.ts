import styled from 'styled-components';

/** Preset pickers (C07): pill buttons that honestly render a none-active state
 *  when the draft carries a custom policy name (edited in Advanced). */
export const PresetRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
`;

export const PresetPill = styled.button<{ $active?: boolean }>`
  border-radius: 999px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: ${({ $active }) => ($active ? 650 : 500)};
  cursor: pointer;
  border: 1px solid
    ${({ theme, $active }) => ($active ? theme.app.border.focus : theme.app.border.default)};
  background: ${({ theme, $active }) => ($active ? theme.app.surface.active : 'transparent')};
  color: ${({ theme, $active }) => ($active ? theme.app.text.primary : theme.app.text.secondary)};

  &:hover {
    border-color: ${({ theme }) => theme.app.border.hover};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 2px;
  }
`;

/** Mode indicator line: dot + word, never color alone. */
export const ModeLine = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 8px;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: 1.55;
`;
