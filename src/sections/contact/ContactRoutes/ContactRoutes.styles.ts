import styled from 'styled-components';

export const BorderTop = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;
export const Title = styled.h2`
  font-size: ${({ theme }) => theme.typography.sizes.h2};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.ink};
  margin-bottom: ${({ theme }) => theme.spacing.s7};
  ${({ theme }) => theme.media.mobile} { font-size: ${({ theme }) => theme.typography.sizesMobile.h2}; }
`;
export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: ${({ theme }) => theme.spacing.s5};
`;
export const Card = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.line};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.s6};
  background: ${({ theme }) => theme.colors.paper};
  transition: all ${({ theme }) => theme.transitions.standard};
  &:hover {
    border-color: ${({ theme }) => theme.colors.lineStrong};
    box-shadow: ${({ theme }) => theme.shadows.md};
    transform: translateY(-2px);
  }
`;
export const CardLabel = styled.h3`
  font-size: ${({ theme }) => theme.typography.sizes.h3};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.ink};
  margin-bottom: ${({ theme }) => theme.spacing.s2};
  ${({ theme }) => theme.media.mobile} { font-size: ${({ theme }) => theme.typography.sizesMobile.h3}; }
`;
export const CardDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.body};
  line-height: ${({ theme }) => theme.typography.lineHeights.body};
  color: ${({ theme }) => theme.colors.inkSoft};
  margin-bottom: ${({ theme }) => theme.spacing.s4};
`;
export const CardEmail = styled.a`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.typography.sizes.small};
  color: ${({ theme }) => theme.colors.blue};
  text-decoration: none;
  transition: color ${({ theme }) => theme.transitions.fast};
  &:hover { color: ${({ theme }) => theme.colors.blueHover}; }
`;
