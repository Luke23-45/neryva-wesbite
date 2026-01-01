import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Button, MeshGradient, GridPattern } from '@components/atoms';
import { useNavigate } from '@tanstack/react-router';

interface HomepageHeroProps {
  overline?: string;
  headline?: string;
  subheadline?: string;
  primaryCTA?: {
    label: string;
    href: string;
  };
  secondaryCTA?: {
    label: string;
    href: string;
  };
}

const HeroContainer = styled.section`
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.background.primary};
  padding: ${({ theme }) => theme.spacing[4]};
`;

const ContentWrapper = styled(motion.div)`
  position: relative;
  z-index: 10;
  max-width: 1100px;
  text-align: center;
  margin: 0 auto;
`;

const heroItemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1] as any, // Quint easing for premium feel
    },
  },
};

const Overline = styled(motion.span)`
  display: block;
  font-family: ${({ theme }) => theme.typography.fontFamily.mono};
  color: ${({ theme }) => theme.colors.accent.teal};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  letter-spacing: 0.2em;
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  text-transform: uppercase;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const Headline = styled(motion.h1)`
  font-family: ${({ theme }) => theme.typography.fontFamily.heading};
  font-size: clamp(3.5rem, 10vw, 7rem);
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  line-height: 0.95;
  letter-spacing: -0.04em;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing[10]};
  
  background: ${({ theme }) => theme.colors.gradients.text};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 4px 10px rgba(0,0,0,0.3));
`;

const Subheadline = styled(motion.p)`
  font-family: ${({ theme }) => theme.typography.fontFamily.body};
  font-size: clamp(1.25rem, 2.5vw, 1.75rem);
  color: ${({ theme }) => theme.colors.text.secondary};
  max-width: 850px;
  margin: 0 auto ${({ theme }) => theme.spacing[14]};
  line-height: 1.5;
  font-weight: ${({ theme }) => theme.typography.fontWeight.light};
`;

const ButtonGroup = styled(motion.div)`
  display: flex;
  gap: ${({ theme }) => theme.spacing[6]};
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: column;
    width: 100%;
    
    button {
      width: 100%;
    }
  }
`;

export const HomepageHero = ({
  overline = "PIONEERING THE FUTURE",
  headline = "Redefining the Vector of Survival",
  subheadline = "Moving critical care intelligence from expensive, centralized hospitals to every corner of the world through physics-aware AI.",
  primaryCTA = { label: "Explore Research", href: "/research" },
  secondaryCTA = { label: "Our Mission", href: "/mission" }
}: HomepageHeroProps) => {
  const navigate = useNavigate();

  return (
    <HeroContainer>
      <MeshGradient />
      <GridPattern />

      <ContentWrapper
        initial="hidden"
        animate="visible"
        transition={{ staggerChildren: 0.2, delayChildren: 0.3 }}
      >
        <Overline variants={heroItemVariants}>
          {overline}
        </Overline>

        <Headline variants={heroItemVariants}>
          {headline}
        </Headline>

        <Subheadline variants={heroItemVariants}>
          {subheadline}
        </Subheadline>

        <ButtonGroup variants={heroItemVariants}>
          <Button variant="primary" size="lg" onClick={() => navigate({ to: primaryCTA.href as any })}>
            {primaryCTA.label}
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate({ to: secondaryCTA.href as any })}>
            {secondaryCTA.label}
          </Button>
        </ButtonGroup>
      </ContentWrapper>
    </HeroContainer>
  );
};
