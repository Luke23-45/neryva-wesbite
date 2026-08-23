import styled from 'styled-components';

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 600;
  background: ${({ theme }) => theme.app.scrim};
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 12vh 24px 24px;
`;

export const Palette = styled.div`
  width: 100%;
  max-width: 640px;
  background: ${({ theme }) => theme.app.surface.glass};
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  border-radius: 16px;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.04) inset,
    ${({ theme }) => theme.app.shadow.popover};
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  overflow: hidden;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  display: flex;
  flex-direction: column;
`;

export const SearchRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.default};
`;

export const SearchIcon = styled.span`
  color: ${({ theme }) => theme.app.text.faint};
  display: inline-flex;
`;

export const SearchInput = styled.input`
  flex: 1;
  border: 0;
  background: transparent;
  outline: none;
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.title};
  color: ${({ theme }) => theme.app.text.primary};

  &::placeholder {
    color: ${({ theme }) => theme.app.text.ghost};
  }
`;

export const KbdHint = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};

  ${({ theme }) => theme.media.mobile} {
    display: none;
  }
`;

export const Kbd = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 4px;
  background: ${({ theme }) => theme.app.surface.active};
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  color: ${({ theme }) => theme.app.text.secondary};
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.04em;
`;

export const Results = styled.div`
  max-height: 420px;
  overflow-y: auto;
  padding: 8px;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.app.scrollbar};
    border-radius: 4px;
  }
`;

export const Section = styled.div`
  padding: 6px 0;
`;

export const SectionLabel = styled.div`
  padding: 6px 12px 4px;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.faint};
`;

export const Item = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 9px 12px;
  border: 0;
  border-radius: 8px;
  background: ${({ $active, theme }) => ($active ? theme.app.surface.active : 'transparent')};
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ $active, theme }) => ($active ? theme.app.text.primary : theme.app.text.secondary)};
  cursor: pointer;
  text-align: left;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: -2px;
  }
`;

export const ItemIcon = styled.span<{ $active: boolean }>`
  width: 26px;
  height: 26px;
  border-radius: 7px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: ${({ $active, theme }) => ($active ? theme.app.surface.active : theme.app.surface.tint)};
  color: ${({ $active, theme }) => ($active ? theme.app.text.primary : theme.app.text.muted)};
  flex-shrink: 0;
`;

export const ItemBody = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
`;

export const ItemTitle = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
  letter-spacing: -0.005em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const ItemSub = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const ItemShortcut = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

export const ActiveArrow = styled.span`
  display: inline-flex;
  color: ${({ theme }) => theme.app.text.muted};
`;

export const Empty = styled.div`
  padding: 40px 16px;
  text-align: center;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.muted};
`;

export const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  border-top: 1px solid ${({ theme }) => theme.app.border.default};
  background: rgba(0, 0, 0, 0.20);
`;

export const FooterLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.faint};
`;

export const FooterRight = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.faint};
`;
