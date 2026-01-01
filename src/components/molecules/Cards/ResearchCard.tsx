import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Link } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';

interface ResearchCardProps {
  title: string;
  subtitle: string;
  description: string;
  icon?: React.ReactNode;
  status?: 'active' | 'upcoming' | 'completed';
  href: string;
}

const Card = styled(motion.article)`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: ${({ theme }) => theme.spacing[8]};
  cursor: pointer;
  position: relative;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: all 0.4s ${({ theme }) => theme.transitions.easing.smooth};
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${({ theme }) => theme.colors.accent.teal};
    opacity: 0.5;
    transition: opacity 0.3s ease;
  }
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.accent.teal};
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(20, 184, 166, 0.1);
    transform: translateY(-8px);
    
    &::before {
      opacity: 1;
    }

    .learn-more {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

const CardIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.accent.tealMuted};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.accent.teal};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  border: 1px solid rgba(20, 184, 166, 0.1);
`;

const StatusBadge = styled.span<{ $status: 'active' | 'upcoming' | 'completed' }>`
  position: absolute;
  top: ${({ theme }) => theme.spacing[6]};
  right: ${({ theme }) => theme.spacing[6]};
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: ${({ theme }) => theme.typography.fontSize['2xs']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  letter-spacing: 0.05em;
  text-transform: uppercase;
  background: ${({ $status, theme }) =>
    $status === 'active' ? theme.colors.semantic.successMuted : theme.colors.accent.violetMuted};
  color: ${({ $status, theme }) =>
    $status === 'active' ? theme.colors.semantic.success : theme.colors.accent.violet};
  border: 1px solid currentColor;
`;

const Title = styled.h3`
  font-family: ${({ theme }) => theme.typography.fontFamily.heading};
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
  letter-spacing: -0.02em;
`;

const Subtitle = styled.h4`
  font-family: ${({ theme }) => theme.typography.fontFamily.mono};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.accent.teal};
  text-transform: uppercase;
  letter-spacing: 0.2em;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const Description = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  line-height: 1.6;
  flex-grow: 1;
  margin-bottom: ${({ theme }) => theme.spacing[8]};
`;

const LearnMore = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  color: ${({ theme }) => theme.colors.accent.teal};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  opacity: 0.5;
  transform: translateX(-10px);
  transition: all 0.3s ease;
  margin-top: auto;
`;

export const ResearchCard = ({
  title,
  subtitle,
  description,
  icon,
  status = 'active',
  href
}: ResearchCardProps) => {
  return (
    <Link to={href as any} style={{ textDecoration: 'none' }}>
      <Card>
        <StatusBadge $status={status}>{status}</StatusBadge>
        {icon && <CardIcon>{icon}</CardIcon>}
        <Subtitle>{subtitle}</Subtitle>
        <Title>{title}</Title>
        <Description>{description}</Description>
        <LearnMore className="learn-more">
          Explore Research <ArrowRight size={16} />
        </LearnMore>
      </Card>
    </Link>
  );
};
