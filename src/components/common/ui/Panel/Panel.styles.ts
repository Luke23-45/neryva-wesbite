import styled from 'styled-components';

export const PanelRoot = styled.section`
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: ${({ theme }) => theme.radii.xl};
  overflow: hidden;
  backdrop-filter: blur(${({ theme }) => theme.app.blur.sm});
`;

export const PanelHeader = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.s4};
  padding: ${({ theme }) => theme.spacing.px18} ${({ theme }) => theme.spacing.px22} ${({ theme }) => theme.spacing.px14};
  border-bottom: 1px solid ${({ theme }) => theme.app.border.hairline};
`;

export const PanelTitle = styled.h3`
  margin: 0 0 ${({ theme }) => theme.spacing.px2};
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.app.type.title};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.micro};
  color: ${({ theme }) => theme.app.text.primary};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s2};
  flex-wrap: wrap;
`;

export const PanelSubtitle = styled.div`
  margin: 0;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: ${({ theme }) => theme.typography.lineHeights.small};
`;

export const PanelAside = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s2};
  flex-shrink: 0;
`;

export const PanelBody = styled.div<{ $flush?: boolean }>`
  padding: ${({ $flush, theme }) => ($flush ? '0' : `${theme.spacing.px18} ${theme.spacing.px22} ${theme.spacing.px22}`)};
`;
