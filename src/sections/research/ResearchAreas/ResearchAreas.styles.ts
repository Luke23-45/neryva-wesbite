import styled from 'styled-components';

export const FlexContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.s8};

  ${({ theme }) => theme.media.tablet} {
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing.s6};
  }
`;

/* ── Left sidebar ── */
export const Sidebar = styled.nav`
  width: 220px;
  flex-shrink: 0;
  position: sticky;
  top: 96px;
  align-self: start;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s1};

  ${({ theme }) => theme.media.tablet} {
    width: 100%;
    position: static;
    flex-direction: row;
    overflow-x: auto;
    gap: ${({ theme }) => theme.spacing.s2};
    padding-bottom: ${({ theme }) => theme.spacing.s2};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }
`;

export const SidebarItem = styled.button<{ $active: boolean; $accent: string }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s3};
  padding: ${({ theme }) => theme.spacing.s3} ${({ theme }) => theme.spacing.s4};
  border: none;
  border-radius: 8px;
  background: ${({ $active }) => ($active ? 'rgba(15, 23, 42, 0.04)' : 'transparent')};
  cursor: pointer;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.typography.sizes.small};
  font-weight: ${({ $active, theme }) =>
    $active ? theme.typography.weights.medium : theme.typography.weights.regular};
  color: ${({ $active, theme }) => ($active ? theme.colors.text.primary : theme.colors.text.muted)};
  text-align: left;
  transition: background-color ${({ theme }) => theme.transitions.fast},
              color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: rgba(15, 23, 42, 0.04);
    color: ${({ theme }) => theme.colors.text.primary};
  }

  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${({ $active, $accent }) => ($active ? $accent : 'transparent')};
    flex-shrink: 0;
    transition: background-color ${({ theme }) => theme.transitions.fast};
  }

  ${({ theme }) => theme.media.tablet} {
    white-space: nowrap;
    padding: ${({ theme }) => theme.spacing.s2} ${({ theme }) => theme.spacing.s3};
    font-size: ${({ theme }) => theme.typography.sizes.label};
    flex-shrink: 0;

    &::before {
      display: none;
    }
  }
`;

/* ── Right panel (stacked sections) ── */
export const Panel = styled.div`
  flex: 1;
  min-width: 0;
`;

export const ProgramSection = styled.section`
  scroll-margin-top: 96px;
  margin-bottom: ${({ theme }) => theme.spacing.s9};

  &:last-child {
    margin-bottom: 0;
  }
`;

export const ProgramTitle = styled.h2<{ $accent: string }>`
  font-size: ${({ theme }) => theme.typography.sizes.h2};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: ${({ theme }) => theme.typography.lineHeights.heading};
  margin-bottom: ${({ theme }) => theme.spacing.s6};
  padding-bottom: ${({ theme }) => theme.spacing.s4};
  border-bottom: 2px solid ${({ $accent }) => $accent};

  ${({ theme }) => theme.media.mobile} {
    font-size: ${({ theme }) => theme.typography.sizesMobile.h2};
  }
`;

/* ── Card grid ── */
export const CardGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.s5};

  ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 1fr;
  }
`;

export const Card = styled.div`
  display: flex;
  flex-direction: column;
  padding: ${({ theme }) => theme.spacing.s6};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  transition: border-color ${({ theme }) => theme.transitions.fast},
              box-shadow ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.text.muted};
    box-shadow: 0 2px 12px rgba(15, 23, 42, 0.04);
  }
`;

export const CardTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.sizes.h3};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: ${({ theme }) => theme.typography.lineHeights.h3};
  margin-bottom: ${({ theme }) => theme.spacing.s2};

  ${({ theme }) => theme.media.mobile} {
    font-size: ${({ theme }) => theme.typography.sizesMobile.h3};
  }
`;

export const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.s1};
  margin-bottom: ${({ theme }) => theme.spacing.s4};
`;

export const Tag = styled.span`
  display: inline-block;
  padding: 2px 8px;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.text.muted};
  background: ${({ theme }) => theme.colors.background.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  letter-spacing: 0.02em;
`;

export const CardDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.small};
  line-height: ${({ theme }) => theme.typography.lineHeights.body};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
`;
