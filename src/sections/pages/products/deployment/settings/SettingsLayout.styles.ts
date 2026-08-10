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
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
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
  background: ${({ $active }) => ($active ? 'rgba(255, 255, 255, 0.08)' : 'transparent')};
`;

export const TabLink = styled.a`
  display: inline-block;
  padding: 8px 14px;
  border-radius: 8px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 13px;
  font-weight: 500;
  color: rgba(229, 231, 235, 0.7);
  text-decoration: none;
  white-space: nowrap;
  transition: color ${({ theme }) => theme.transitions.fast},
    background ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: #f5f7fb;
  }
`;

export const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;
