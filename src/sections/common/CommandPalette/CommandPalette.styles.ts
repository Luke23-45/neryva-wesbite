import styled from 'styled-components';

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 600;
  background: rgba(0, 0, 0, 0.50);
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
  background: rgba(15, 17, 22, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 16px;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.04) inset,
    0 32px 80px rgba(0, 0, 0, 0.6),
    0 8px 24px rgba(0, 0, 0, 0.4);
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
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
`;

export const SearchIcon = styled.span`
  color: rgba(229, 231, 235, 0.45);
  display: inline-flex;
`;

export const SearchInput = styled.input`
  flex: 1;
  border: 0;
  background: transparent;
  outline: none;
  font-family: inherit;
  font-size: 15px;
  color: #f5f7fb;

  &::placeholder {
    color: rgba(229, 231, 235, 0.40);
  }
`;

export const KbdHint = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  color: rgba(229, 231, 235, 0.55);
`;

export const Kbd = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.10);
  color: rgba(229, 231, 235, 0.78);
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.04em;
`;

export const Results = styled.div`
  max-height: 420px;
  overflow-y: auto;
  padding: 8px;

  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.08); border-radius: 4px; }
`;

export const Section = styled.div`
  padding: 6px 0;
`;

export const SectionLabel = styled.div`
  padding: 6px 12px 4px;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(229, 231, 235, 0.45);
`;

export const Item = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 9px 12px;
  border: 0;
  border-radius: 8px;
  background: ${({ $active }) => ($active ? 'rgba(255, 255, 255, 0.06)' : 'transparent')};
  font-family: inherit;
  font-size: 13.5px;
  color: ${({ $active }) => ($active ? '#f5f7fb' : 'rgba(229, 231, 235, 0.85)')};
  cursor: pointer;
  text-align: left;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};
`;

export const ItemIcon = styled.span<{ $active: boolean }>`
  width: 26px;
  height: 26px;
  border-radius: 7px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: ${({ $active }) =>
    $active ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.04)'};
  color: ${({ $active }) => ($active ? '#f5f7fb' : 'rgba(229, 231, 235, 0.65)')};
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
  font-size: 13.5px;
  font-weight: 500;
  color: #f5f7fb;
  letter-spacing: -0.005em;
`;

export const ItemSub = styled.div`
  font-size: 11.5px;
  color: rgba(229, 231, 235, 0.55);
`;

export const ItemShortcut = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

export const Empty = styled.div`
  padding: 40px 16px;
  text-align: center;
  font-size: 13px;
  color: rgba(229, 231, 235, 0.5);
`;

export const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(0, 0, 0, 0.20);
`;

export const FooterLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 11.5px;
  color: rgba(229, 231, 235, 0.45);
`;

export const FooterRight = styled.div`
  font-size: 11.5px;
  color: rgba(229, 231, 235, 0.45);
`;
