import styled from 'styled-components';

export const BorderTop = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;
export const Card = styled.div<{ $accent?: string }>`
  position: relative;
  border: 1px solid ${({ theme }) => theme.colors.line};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.paper};
  padding: ${({ theme }) => theme.spacing.s7};
  margin-bottom: ${({ theme }) => theme.spacing.s5};
  transition: all ${({ theme }) => theme.transitions.standard};
  overflow: hidden;
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 4px; height: 100%;
    background: ${({ $accent, theme }) => $accent || theme.colors.blue};
    opacity: 0;
    transition: opacity ${({ theme }) => theme.transitions.fast};
  }
  &:hover {
    border-color: ${({ theme }) => theme.colors.lineStrong};
    box-shadow: ${({ theme }) => theme.shadows.lg};
    transform: translateY(-3px);
    &::before { opacity: 1; }
  }
  ${({ theme }) => theme.media.mobile} { padding: ${({ theme }) => theme.spacing.s5}; }
`;
export const CardMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s3};
  margin-bottom: ${({ theme }) => theme.spacing.s3};
`;
export const CardNumber = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.typography.sizes.label};
  color: ${({ theme }) => theme.colors.muted};
  text-transform: uppercase;
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.label};
`;
export const CardTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.sizes.h3};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.ink};
  margin-bottom: ${({ theme }) => theme.spacing.s3};
  ${({ theme }) => theme.media.mobile} { font-size: ${({ theme }) => theme.typography.sizesMobile.h3}; }
`;
export const CardBody = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.body};
  line-height: ${({ theme }) => theme.typography.lineHeights.body};
  color: ${({ theme }) => theme.colors.inkSoft};
  max-width: ${({ theme }) => theme.containers.prose};
  margin-bottom: ${({ theme }) => theme.spacing.s5};
`;
