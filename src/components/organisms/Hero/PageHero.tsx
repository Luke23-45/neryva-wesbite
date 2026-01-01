import styled from 'styled-components';
import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { MeshGradient, GridPattern } from '@components/atoms';

interface PageHeroProps {
  title: string;
  subtitle?: string;
  breadcrumbs: Array<{ label: string; href: string }>;
  accentColor?: string;
}

const PageHeroContainer = styled.section<{ $accentColor?: string }>`
  padding: ${({ theme }) => theme.spacing[32]} ${({ theme }) => theme.spacing[8]};
  padding-bottom: ${({ theme }) => theme.spacing[16]};
  background: linear-gradient(
    180deg,
    ${({ theme }) => theme.colors.background.secondary} 0%,
    ${({ theme }) => theme.colors.background.primary} 100%
  );
  position: relative;
  text-align: center;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100px;
    height: 3px;
    background: ${({ $accentColor, theme }) =>
    $accentColor || theme.colors.accent.teal};
    border-radius: ${({ theme }) => theme.radii.full};
  }
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Breadcrumbs = styled.nav`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.muted};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  font-family: ${({ theme }) => theme.typography.fontFamily.mono};
  
  a {
    color: ${({ theme }) => theme.colors.text.muted};
    text-decoration: none;
    transition: color 0.2s;
    
    &:hover {
      color: ${({ theme }) => theme.colors.accent.teal};
    }
  }
  
  span {
    color: ${({ theme }) => theme.colors.text.secondary};
  }
  
  .separator {
    color: ${({ theme }) => theme.colors.text.muted};
    opacity: 0.5;
  }
`;

const Title = styled(motion.h1)`
  font-family: ${({ theme }) => theme.typography.fontFamily.heading};
  font-size: ${({ theme }) => theme.typography.fontSize['5xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing[4]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  }
`;

const Subtitle = styled(motion.p)`
  font-family: ${({ theme }) => theme.typography.fontFamily.body};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  color: ${({ theme }) => theme.colors.text.secondary};
  max-width: 600px;
  line-height: 1.6;
`;

export const PageHero = ({
  title,
  subtitle,
  breadcrumbs,
  accentColor,
}: PageHeroProps) => {
  return (
    <PageHeroContainer $accentColor={accentColor}>
      <MeshGradient />
      <GridPattern />
      <ContentWrapper>
        <Breadcrumbs aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.href} style={{ display: 'flex', alignItems: 'center', gap: 'inherit' }}>
              {index < breadcrumbs.length - 1 ? (
                <Link to={crumb.href}>{crumb.label}</Link>
              ) : (
                <span>{crumb.label}</span>
              )}
              {index < breadcrumbs.length - 1 && (
                <span className="separator" aria-hidden="true">/</span>
              )}
            </div>
          ))}
        </Breadcrumbs>

        <Title
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {title}
        </Title>

        {subtitle && (
          <Subtitle
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            {subtitle}
          </Subtitle>
        )}
      </ContentWrapper>
    </PageHeroContainer>
  );
};
