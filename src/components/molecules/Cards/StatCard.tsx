import styled from 'styled-components';

interface StatCardProps {
    value: number | string;
    label: string;
    icon?: string;
    trend?: 'up' | 'down' | 'stable';
}

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing[6]};
  text-align: center;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const StatValue = styled.div`
  font-family: ${({ theme }) => theme.typography.fontFamily.heading};
  font-size: ${({ theme }) => theme.typography.fontSize['4xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1;
  margin-bottom: ${({ theme }) => theme.spacing[2]};
  
  /* Gradient text */
  background: -webkit-linear-gradient(45deg, ${({ theme }) => theme.colors.text.primary}, ${({ theme }) => theme.colors.accent.teal});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const StatLabel = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.muted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

export const StatCard = ({ value, label }: StatCardProps) => {
    return (
        <Card>
            <StatValue>{value}</StatValue>
            <StatLabel>{label}</StatLabel>
        </Card>
    );
};
