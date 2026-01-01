import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Link } from '@tanstack/react-router';

interface FeaturedBlockProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  link?: { label: string; href: string };
  variant?: 'default' | 'highlighted';
}

const FeaturedBlockContainer = styled(motion.div) <{ $highlighted?: boolean }>`
  background: ${({ $highlighted, theme }) =>
    $highlighted
      ? `linear-gradient(135deg, ${theme.colors.accent.teal}20, ${theme.colors.accent.violet}20)`
      : theme.colors.surface};
  border: 1px solid ${({ $highlighted, theme }) =>
    $highlighted ? theme.colors.accent.teal : theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: ${({ theme }) => theme.spacing[8]};
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
  
  .icon-wrapper {
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${({ theme }) => theme.colors.accent.tealMuted};
    border-radius: ${({ theme }) => theme.radii.lg};
    color: ${({ theme }) => theme.colors.accent.teal};
    margin-bottom: ${({ theme }) => theme.spacing[6]};
    font-size: 24px;
  }
`;

const Content = styled.div`
  flex: 1;

  h3 {
    font-family: ${({ theme }) => theme.typography.fontFamily.heading};
    font-size: ${({ theme }) => theme.typography.fontSize.xl};
    font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
    color: ${({ theme }) => theme.colors.text.primary};
    margin-bottom: ${({ theme }) => theme.spacing[3]};
  }
  
  p {
    color: ${({ theme }) => theme.colors.text.secondary};
    line-height: 1.6;
    margin-bottom: ${({ theme }) => theme.spacing[6]};
  }
`;

const LearnMore = styled(Link)`
  display: inline-flex;
  align-items: center;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.accent.teal};
  text-decoration: none;
  gap: ${({ theme }) => theme.spacing[2]};
  
  &:hover {
    text-decoration: underline;
  }

  &::after {
    content: '→';
    transition: transform 0.2s;
  }

  &:hover::after {
    transform: translateX(4px);
  }
`;

export const FeaturedBlock = ({ icon, title, description, link, variant = 'default' }: FeaturedBlockProps) => {
  return (
    <FeaturedBlockContainer
      $highlighted={variant === 'highlighted'}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div className="icon-wrapper">{icon}</div>
      <Content>
        <h3>{title}</h3>
        <p>{description}</p>
      </Content>
      {link && (
        <LearnMore to={link.href}>
          {link.label}
        </LearnMore>
      )}
    </FeaturedBlockContainer>
  );
};
