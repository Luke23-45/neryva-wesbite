import styled from 'styled-components';

export const Rail = styled.aside`
  width: 216px;
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 10px;
  background: ${({ theme }) => theme.app.bg.deep};
  border-right: 1px solid ${({ theme }) => theme.app.border.default};
  overflow-y: auto;
`;

export const RailTitle = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  font-weight: 600;
  letter-spacing: 0.09em;
  color: ${({ theme }) => theme.app.text.muted};
  padding: 2px 6px 8px;
`;

export const SearchWrap = styled.div`
  padding: 0 2px 10px;
`;

export const SearchInput = styled.input`
  width: 100%;
  height: 30px;
  padding: 0 10px 0 30px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.tint} url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='%238E8E93' stroke-width='2' stroke-linecap='round'%3E%3Ccircle cx='11' cy='11' r='7'/%3E%3Cpath d='M20 20l-3.5-3.5'/%3E%3C/svg%3E") no-repeat 10px center;
  color: ${({ theme }) => theme.app.text.primary};
  font-size: ${({ theme }) => theme.app.type.caption};
  font-family: inherit;

  &::placeholder {
    color: ${({ theme }) => theme.app.text.ghost};
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.app.border.focus};
  }
`;

export const GroupLabel = styled.div`
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.09em;
  color: ${({ theme }) => theme.app.text.ghost};
  padding: 10px 6px 4px;
`;

export const Card = styled.button<{ $state: 'idle' | 'bound' | 'live' | 'fixed' | 'disabled' }>`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  color: ${({ theme }) => theme.app.text.primary};
  font-family: inherit;
  text-align: left;
  cursor: ${({ $state }) => ($state === 'disabled' ? 'not-allowed' : 'grab')};
  opacity: ${({ $state }) => ($state === 'disabled' ? 0.55 : 1)};

  &:hover {
    border-color: ${({ theme }) => theme.app.border.hover};
    background: ${({ theme }) => theme.app.surface.hover};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

export const CardIcon = styled.span<{ $color: string; $dim?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  flex: none;
  border-radius: 6px;
  border: 1px solid ${({ $color }) => $color};
  color: ${({ $color }) => $color};
  opacity: ${({ $dim }) => ($dim ? 0.6 : 1)};
`;

export const CardMain = styled.span`
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
`;

export const CardLabel = styled.span`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 600;
  line-height: 1.3;
`;

export const CardMeta = styled.span<{ $tone: 'live' | 'muted' | 'accent' }>`
  font-size: 10px;
  line-height: 1.4;
  color: ${({ theme, $tone }) =>
    $tone === 'live'
      ? theme.app.status.success.fg
      : $tone === 'accent'
        ? theme.app.status.info.fg
        : theme.app.text.muted};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const FilterRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const ClearFilter = styled.button`
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.app.status.info.fg};
  font-size: ${({ theme }) => theme.app.type.caption};
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 6px;

  &:hover {
    text-decoration: underline;
  }
`;

export const LockedNote = styled.div`
  margin: 8px 2px 0;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px dashed ${({ theme }) => theme.app.border.strong};
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.5;
`;

export const ShortcutFooter = styled.div`
  margin-top: auto;
  padding: 12px 6px 2px;
  font-size: 10px;
  line-height: 1.8;
  color: ${({ theme }) => theme.app.text.ghost};
`;
