import styled from 'styled-components';
import { motion } from 'framer-motion';

interface Metric {
    value: number | string;
    label: string;
    icon?: string;
    trend?: 'up' | 'down' | 'stable';
    trendValue?: string;
    description?: string;
}

interface MetricDashboardProps {
    metrics: Metric[];
}

const MetricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${({ theme }) => theme.spacing[6]};
  padding: ${({ theme }) => theme.spacing[12]} 0;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const MetricCard = styled(motion.div)`
  text-align: center;
  padding: ${({ theme }) => theme.spacing[8]};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
  
  .value {
    font-family: ${({ theme }) => theme.typography.fontFamily.heading};
    font-size: ${({ theme }) => theme.typography.fontSize['4xl']};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
    color: ${({ theme }) => theme.colors.text.primary};
    margin-bottom: ${({ theme }) => theme.spacing[2]};
    display: block;
  }
  
  .label {
    font-family: ${({ theme }) => theme.typography.fontFamily.mono};
    font-size: ${({ theme }) => theme.typography.fontSize.xs};
    color: ${({ theme }) => theme.colors.text.muted};
    text-transform: uppercase;
    letter-spacing: 0.05em;
    display: block;
    margin-bottom: ${({ theme }) => theme.spacing[4]};
  }

  .description {
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
    color: ${({ theme }) => theme.colors.text.secondary};
    line-height: 1.5;
  }
`;

const TrendIndicator = styled.div<{ $trend: 'up' | 'down' | 'stable' }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  margin-top: ${({ theme }) => theme.spacing[2]};
  
  color: ${({ $trend, theme }) => ({
        up: theme.colors.semantic.success,
        down: theme.colors.semantic.error,
        stable: theme.colors.text.muted,
    }[$trend])};
  
  &::before {
    content: ${({ $trend }) => ({
        up: '"↑"',
        down: '"↓"',
        stable: '"→"',
    }[$trend])};
  }
`;

export const MetricDashboard = ({ metrics }: MetricDashboardProps) => {
    return (
        <MetricGrid>
            {metrics.map((metric, index) => (
                <MetricCard
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                    <span className="label">{metric.label}</span>
                    <span className="value">{metric.value}</span>
                    {metric.description && <p className="description">{metric.description}</p>}
                    {metric.trend && (
                        <TrendIndicator $trend={metric.trend}>
                            {metric.trendValue}
                        </TrendIndicator>
                    )}
                </MetricCard>
            ))}
        </MetricGrid>
    );
};
