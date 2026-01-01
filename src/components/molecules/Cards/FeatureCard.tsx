import styled from 'styled-components';

interface FeatureCardProps {
    icon?: React.ReactNode;
    title: string;
    description: string;
}

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing[6]};
  transition: all 0.3s ease;
  height: 100%;
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.accent.teal};
    
    .icon-wrapper {
      background: ${({ theme }) => theme.colors.accent.teal};
      color: ${({ theme }) => theme.colors.background.primary};
    }
  }
`;

const IconWrapper = styled.div`
  width: 48px;
  height: 48px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.accent.teal + '20'};
  color: ${({ theme }) => theme.colors.accent.teal};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  transition: all 0.3s ease;
  font-size: 24px;
`;

const Title = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const Description = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  line-height: 1.6;
`;

export const FeatureCard = ({ icon, title, description }: FeatureCardProps) => {
    return (
        <Card>
            {icon && <IconWrapper className="icon-wrapper">{icon}</IconWrapper>}
            <Title>{title}</Title>
            <Description>{description}</Description>
        </Card>
    );
};
