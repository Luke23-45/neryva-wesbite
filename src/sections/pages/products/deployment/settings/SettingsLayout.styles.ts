import styled from 'styled-components';

export const Shell = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
  padding: 40px 28px 80px;

  ${({ theme }) => theme.media.mobile} {
    padding: 24px 18px 56px;
  }
`;

export const TabsBar = styled.nav`
  display: flex;
  gap: 4px;
  margin-bottom: 32px;
  padding: 4px;
  background: ${({ theme }) => theme.app.surface.tint};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 12px;
  width: fit-content;
  max-width: 100%;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

export const Tab = styled.div<{ $active: boolean }>`
  border-radius: 8px;
  background: ${({ $active, theme }) => ($active ? theme.app.text.primary : 'transparent')};
  transition: background ${({ theme }) => theme.transitions.fast};
`;

export const TabLink = styled.a<{ $active: boolean }>`
  display: inline-block;
  padding: 8px 14px;
  border-radius: 8px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  color: ${({ $active, theme }) => ($active ? theme.app.text.inverse : theme.app.text.secondary)};
  text-decoration: none;
  white-space: nowrap;
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ $active, theme }) => ($active ? theme.app.text.inverse : theme.app.text.primary)};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: -2px;
  }
`;

export const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;
