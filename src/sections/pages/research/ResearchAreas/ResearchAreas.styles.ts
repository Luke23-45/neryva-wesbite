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

export const SidebarItem = styled.button<{ $active: boolean; $accent: string }>`
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

    &:last-child {
      border-right: none;
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
  font-size: 42px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.1;
  letter-spacing: -0.03em;
  padding-bottom: ${({ theme }) => theme.spacing.s6};
padding-top: ${({ theme }) => theme.spacing.s6};
  ${({ theme }) => theme.media.mobile} {
    font-size: 32px;
  }
  padding-left:${({ theme }) => theme.spacing.s6} ;
  background: ${({ theme }) => theme.colors.surface};
`;

/* ── Card grid ── */
export const GridContainer = styled.div`
  /* No longer used as wrapper, but kept for compatibility if imported */
`;

export const CardGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background: rgba(15, 23, 42, 0.10);
  border: 1px solid rgba(15, 23, 42, 0.10);
  margin-top: ${({ theme }) => theme.spacing.s4};

  ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 1fr;
  }
`;

export const GridCell = styled.div`
  background: ${({ theme }) => theme.colors.surfaceHover};
  padding: 24px;
  display: flex;
  flex-direction: column;
  height: 100%;

  ${({ theme }) => theme.media.mobile} {
    padding: 16px;
  }
`;

export const Card = styled.div`
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid rgba(15, 23, 42, 0.10);
  height: 100%;
  width: 100%;
  transition: border-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.text.primary};
  }
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.10);
`;

export const MotifBox = styled.div`
  width: 40px;
  height: 40px;
  border: 1px solid rgba(15, 23, 42, 0.10);
  border-radius: 6px;
  background: ${({ theme }) => theme.colors.background.secondary};
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const OpenBadge = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.04em;
  color: ${({ theme }) => theme.colors.text.primary};
  background: ${({ theme }) => theme.colors.background.secondary};
  padding: 4px 8px;
  border-radius: 4px;
`;

export const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  padding: 24px;
`;

export const CardTitle = styled.h3`
  font-size: 22px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.2;
  letter-spacing: -0.01em;
  margin-bottom: ${({ theme }) => theme.spacing.s3};

  ${({ theme }) => theme.media.mobile} {
    font-size: 20px;
  }
`;

export const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.s2};
  margin-top: ${({ theme }) => theme.spacing.s4};
`;

export const Tag = styled.span`
  display: inline-block;
  padding: 4px 8px;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.secondary};
  background: ${({ theme }) => theme.colors.background.secondary};
  border-radius: 4px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

export const CardDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.small};
  line-height: ${({ theme }) => theme.typography.lineHeights.body};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
`;
