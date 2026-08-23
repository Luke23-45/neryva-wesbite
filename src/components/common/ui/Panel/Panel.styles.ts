import styled from 'styled-components';

export const PanelRoot = styled.section`
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 14px;
  overflow: hidden;
  backdrop-filter: blur(6px);
`;

export const PanelHeader = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 22px 14px;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.hairline};
`;

export const PanelTitle = styled.h3`
  margin: 0 0 2px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.app.type.title};
  font-weight: 500;
  letter-spacing: -0.005em;
  color: ${({ theme }) => theme.app.text.primary};
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

export const PanelSubtitle = styled.div`
  margin: 0;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.5;
`;

export const PanelAside = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

export const PanelBody = styled.div<{ $flush?: boolean }>`
  padding: ${({ $flush }) => ($flush ? '0' : '18px 22px 22px')};
`;
