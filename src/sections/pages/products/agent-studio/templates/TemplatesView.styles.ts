import styled from 'styled-components';

/**
 * Template gallery — page scaffolding (header, filters, search) comes from
 * the ViewLayout / Segmented / SearchField kit; only the template card
 * itself is local. Colors resolve through theme.app.* tokens.
 */

export const TemplateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (max-width: 540px) {
    grid-template-columns: 1fr;
  }
`;

export const TemplateCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
  border-radius: 14px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
`;

export const CardTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
`;

/** Icon tile — the colorway comes from the template's tone in the JSON data. */
export const IconBox = styled.div<{ $tone: 'lilac' | 'emerald' | 'azure' | 'amethyst' | 'warning' }>`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: ${({ theme, $tone }) => theme.app.status[$tone].bg};
  border: 1px solid ${({ theme, $tone }) => theme.app.status[$tone].border};
  color: ${({ theme, $tone }) => theme.app.status[$tone].fg};
`;

export const FeaturedBadge = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  padding: 2px 7px;
  border-radius: 4px;
  background: ${({ theme }) => theme.app.status.warning.bg};
  border: 1px solid ${({ theme }) => theme.app.status.warning.border};
  color: ${({ theme }) => theme.app.status.warning.fg};
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-weight: 600;
`;

export const Name = styled.div`
  font-size: ${({ theme }) => theme.app.type.bodyLg};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
  letter-spacing: -0.005em;
`;

export const Description = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: 1.55;
  flex: 1;
`;

export const Meta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
  flex-wrap: wrap;
`;

export const MetaItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

export const ModelName = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const Integrations = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;

export const IntegrationPill = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  padding: 2px 7px;
  border-radius: 999px;
  background: ${({ theme }) => theme.app.status.neutral.bg};
  border: 1px solid ${({ theme }) => theme.app.status.neutral.border};
  color: ${({ theme }) => theme.app.text.secondary};
  letter-spacing: 0.02em;
`;

export const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid ${({ theme }) => theme.app.border.hairline};
`;

export const Stats = styled.div`
  display: flex;
  gap: 14px;
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
  font-variant-numeric: tabular-nums;

  > span {
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }
`;

/** Star icon tint — keeps the rating accent off the inline styles. */
export const RatingStar = styled.span`
  display: inline-flex;
  color: ${({ theme }) => theme.app.status.warning.fg};
`;

/** Category filter pill with count chip. */
export const FilterPill = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid ${({ $active, theme }) => ($active ? 'transparent' : theme.app.border.default)};
  cursor: pointer;
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 999px;
  color: ${({ $active, theme }) => ($active ? theme.app.text.inverse : theme.app.text.secondary)};
  background: ${({ $active, theme }) => ($active ? theme.app.text.primary : 'transparent')};
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ $active, theme }) => ($active ? theme.app.text.inverse : theme.app.text.primary)};
    border-color: ${({ $active, theme }) => ($active ? 'transparent' : theme.app.border.hover)};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

export const Count = styled.span<{ $active?: boolean }>`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 999px;
  background: ${({ $active, theme }) =>
    $active ? 'rgba(11, 13, 18, 0.15)' : theme.app.surface.active};
  color: ${({ $active, theme }) => ($active ? theme.app.text.inverse : theme.app.text.muted)};
  font-variant-numeric: tabular-nums;
`;

export const FilterBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
`;
