import styled from 'styled-components';

export const PanelRoot = styled.section`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
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
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
`;

export const PanelTitle = styled.h3`
  margin: 0 0 2px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 15px;
  font-weight: 500;
  letter-spacing: -0.005em;
  color: #f5f7fb;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

export const PanelSubtitle = styled.div`
  margin: 0;
  font-size: 12.5px;
  color: rgba(229, 231, 235, 0.55);
  line-height: 1.5;
`;

export const PanelAside = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

export const PanelBody = styled.div`
  padding: 18px 22px 22px;
`;
