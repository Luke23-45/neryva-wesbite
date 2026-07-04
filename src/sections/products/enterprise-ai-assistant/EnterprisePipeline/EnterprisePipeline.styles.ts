import styled from 'styled-components';

export const FlexContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.s8};

  ${({ theme }) => theme.media.tablet} {
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing.s6};
  }
`;

export const Sidebar = styled.nav`
  width: 240px;
  flex-shrink: 0;
  position: sticky;
  top: 96px;
  align-self: start;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  overflow: hidden;

  ${({ theme }) => theme.media.tablet} {
    width: 100%;
    position: static;
    flex-direction: row;
    overflow-x: auto;
    border-radius: 0;
    border-left: none;
    border-right: none;
    border-top: none;
  }
`;

export const SidebarItem = styled.button<{ $active: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border: none;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ $active }) => ($active ? 'rgba(15, 23, 42, 0.02)' : 'transparent')};
  cursor: pointer;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 15px;
  font-weight: ${({ theme }) => theme.typography.weights.regular};
  color: ${({ $active, theme }) => ($active ? theme.colors.text.primary : theme.colors.text.muted)};
  text-align: left;
  transition: background-color ${({ theme }) => theme.transitions.fast},
              color ${({ theme }) => theme.transitions.fast};

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 2px;
    background: ${({ $active, theme }) => ($active ? theme.colors.accent.lilac : 'transparent')};
    transition: background ${({ theme }) => theme.transitions.fast};
  }

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: rgba(15, 23, 42, 0.04);
    color: ${({ theme }) => theme.colors.text.primary};
  }

  ${({ theme }) => theme.media.tablet} {
    white-space: nowrap;
    padding: ${({ theme }) => theme.spacing.s3} ${({ theme }) => theme.spacing.s4};
    border-bottom: none;
    border-right: 1px solid ${({ theme }) => theme.colors.border};
    flex-shrink: 0;

    &::before {
      display: none;
    }

    &:last-child {
      border-right: none;
    }
  }
`;

export const Panel = styled.div`
  flex: 1;
  min-width: 0;
  padding-top: ${({ theme }) => theme.spacing.s6};
`;

export const PipelineSectionStyled = styled.section`
  scroll-margin-top: 96px;
`;

export const SectionTitle = styled.h2`
  font-size: 42px;
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: ${({ theme }) => theme.typography.lineHeights.heading};
  letter-spacing: -0.03em;
  margin: 0 0 ${({ theme }) => theme.spacing.s6} 0;

  ${({ theme }) => theme.media.mobile} {
    font-size: 32px;
  }
`;

export const VisualBlock = styled.div`
  width: 100%;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.background.tertiary};
  min-height: 240px;
  padding: ${({ theme }) => theme.spacing.s6};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.s4};
  margin-bottom: ${({ theme }) => theme.spacing.s6};

  ${({ theme }) => theme.media.mobile} {
    min-height: 180px;
    padding: ${({ theme }) => theme.spacing.s5};
  }
`;

export const VisualTypeLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.typography.sizes.label};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.accent.lilacText};
  padding: 2px 8px;
  background: ${({ theme }) => theme.colors.accent.lilacMuted};
  border-radius: ${({ theme }) => theme.radii.sm};
`;

export const VisualDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.body};
  line-height: ${({ theme }) => theme.typography.lineHeights.body};
  color: ${({ theme }) => theme.colors.text.muted};
  text-align: center;
  max-width: 560px;
  margin: 0;

  ${({ theme }) => theme.media.mobile} {
    font-size: ${({ theme }) => theme.typography.sizes.small};
  }
`;

export const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.s5};

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: 1fr 1fr;
  }

  ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 1fr;
  }
`;

export const FeatureCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s2};
  padding: ${({ theme }) => theme.spacing.s5};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  transition: border-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.borderAccent};
  }
`;

export const FeatureTitle = styled.h3`
  font-size: 17px;
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.2;
  letter-spacing: -0.01em;
  margin: 0;
`;

export const FeatureDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.small};
  line-height: ${({ theme }) => theme.typography.lineHeights.body};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
`;

export const SectionDivider = styled.div`
  width: 100%;
  height: 1px;
  background: ${({ theme }) => theme.colors.border};
  margin: 0 0 ${({ theme }) => theme.spacing.s9} 0;
`;
