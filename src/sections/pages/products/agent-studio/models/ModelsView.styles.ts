import styled from 'styled-components';

export const RoutingCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  border-radius: 14px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: linear-gradient(180deg, rgba(192, 132, 252, 0.08), rgba(37, 99, 235, 0.04));
  flex-wrap: wrap;
`;

export const RoutingLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const RoutingTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: ${({ theme }) => theme.app.type.bodyLg};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};

  svg {
    color: ${({ theme }) => theme.app.text.muted};
  }
`;

export const RoutingMeta = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
`;

export const RoutingBadges = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

export const RoutingBadge = styled.span<{ $variant: 'default' | 'primary' }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: 500;
  background: ${({ $variant, theme }) =>
    $variant === 'primary' ? theme.colors.gradients.primary : theme.app.surface.tint};
  border: 1px solid
    ${({ $variant, theme }) => ($variant === 'primary' ? 'transparent' : theme.app.border.default)};
  color: ${({ $variant, theme }) => ($variant === 'primary' ? '#fff' : theme.app.text.secondary)};
`;

export const RoutingArrow = styled.span`
  display: inline-flex;
  color: ${({ theme }) => theme.app.text.faint};
`;

export const ModelGrid = styled.div`
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

export const ModelCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
  border-radius: 14px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  transition: border-color ${({ theme }) => theme.transitions.fast},
    background ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.app.status.lilac.border};
    background: ${({ theme }) => theme.app.surface.tint};
  }
`;

export const ModelTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
`;

export const ModelInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

export const ModelName = styled.div`
  font-size: ${({ theme }) => theme.app.type.title};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
  letter-spacing: -0.005em;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

export const PrimaryTag = styled.span`
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background: ${({ theme }) => theme.app.status.lilac.bg};
  border: 1px solid ${({ theme }) => theme.app.status.lilac.border};
  color: ${({ theme }) => theme.app.status.lilac.fg};
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-weight: 600;
`;

export const ModelProvider = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  color: ${({ theme }) => theme.app.text.muted};
`;

export const KindBadge = styled.span`
  display: inline-block;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  letter-spacing: 0.06em;
  padding: 2px 7px;
  border-radius: 999px;
  background: ${({ theme }) => theme.app.status.lilac.bg};
  border: 1px solid ${({ theme }) => theme.app.status.lilac.border};
  color: ${({ theme }) => theme.app.status.lilac.fg};
  text-transform: uppercase;
  font-weight: 500;
  flex-shrink: 0;
`;

export const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
`;

export const MetricCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 12px;
  border-radius: 9px;
  background: rgba(0, 0, 0, 0.20);
  border: 1px solid ${({ theme }) => theme.app.border.hairline};
`;

export const MetricLabel = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.faint};
`;

export const MetricValue = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
  font-variant-numeric: tabular-nums;
  line-height: 1.4;
`;

export const QualityBar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const QualityHeader = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const QualityValue = styled.span`
  color: ${({ theme }) => theme.app.text.primary};
  font-weight: 500;
  font-variant-numeric: tabular-nums;
`;

export const ModelFoot = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

export const ModelUpdated = styled.span`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.faint};
`;

export const ProviderGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

export const ProviderCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px;
  border-radius: 12px;
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
`;

export const ProviderTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const ProviderName = styled.div`
  font-size: ${({ theme }) => theme.app.type.bodyLg};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
`;

export const ProviderMeta = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  font-variant-numeric: tabular-nums;
`;
