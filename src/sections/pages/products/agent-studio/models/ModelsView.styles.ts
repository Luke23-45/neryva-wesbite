import styled from 'styled-components';

export const PageRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
  padding: 32px 28px 80px;

  ${({ theme }) => theme.media.mobile} {
    padding: 24px 18px 56px;
  }
`;

export const PageHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const PageTitle = styled.h1`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 26px;
  font-weight: 500;
  letter-spacing: -0.025em;
  color: #f5f7fb;
`;

export const PageSubtitle = styled.p`
  margin: 0;
  font-size: 13.5px;
  line-height: 1.5;
  color: rgba(229, 231, 235, 0.55);
  max-width: 580px;
`;

export const RoutingCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: linear-gradient(180deg, rgba(192,132,252,0.08), rgba(37,99,235,0.04));
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
  font-size: 14px;
  font-weight: 500;
  color: #f5f7fb;
`;

export const RoutingMeta = styled.div`
  font-size: 12.5px;
  color: rgba(229, 231, 235, 0.55);
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
  font-size: 12px;
  font-weight: 500;
  background: ${({ $variant }) =>
    $variant === 'primary'
      ? 'linear-gradient(135deg, #c084fc 0%, #2563eb 100%)'
      : 'rgba(255, 255, 255, 0.04)'};
  border: 1px solid
    ${({ $variant }) => ($variant === 'primary' ? 'transparent' : 'rgba(255, 255, 255, 0.08)')};
  color: ${({ $variant }) => ($variant === 'primary' ? '#fff' : 'rgba(229, 231, 235, 0.78)')};
`;

export const SectionTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0 14px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 13.5px;
  font-weight: 500;
  letter-spacing: -0.005em;
  color: rgba(229, 231, 235, 0.85);
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
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);
  transition: border-color ${({ theme }) => theme.transitions.fast},
    background ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: rgba(192, 132, 252, 0.30);
    background: rgba(255, 255, 255, 0.03);
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
  font-size: 15px;
  font-weight: 500;
  color: #f5f7fb;
  letter-spacing: -0.005em;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const ModelProvider = styled.div`
  font-size: 11.5px;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  color: rgba(229, 231, 235, 0.55);
`;

export const KindBadge = styled.span`
  display: inline-block;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10.5px;
  letter-spacing: 0.06em;
  padding: 2px 7px;
  border-radius: 999px;
  background: rgba(192, 132, 252, 0.12);
  border: 1px solid rgba(192, 132, 252, 0.30);
  color: #d8b4fe;
  text-transform: uppercase;
  font-weight: 500;
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
  border: 1px solid rgba(255, 255, 255, 0.04);
`;

export const MetricLabel = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(229, 231, 235, 0.5);
`;

export const MetricValue = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #f5f7fb;
  font-variant-numeric: tabular-nums;
`;

export const QualityBar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const QualityHeader = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: rgba(229, 231, 235, 0.65);
`;

export const QualityValue = styled.span`
  color: #f5f7fb;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
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
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
`;

export const ProviderTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const ProviderName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #f5f7fb;
`;

export const ProviderMeta = styled.div`
  font-size: 12px;
  color: rgba(229, 231, 235, 0.55);
  font-variant-numeric: tabular-nums;
`;
