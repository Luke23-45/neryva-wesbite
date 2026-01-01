import styled from 'styled-components';
import { motion, Variants } from 'framer-motion';
import { GridPattern } from '@components/atoms';
import { Heart, Globe, BookOpen } from 'lucide-react';
const SectionContainer = styled.section`
  padding: ${({ theme }) => theme.spacing[32]} ${({ theme }) => theme.spacing[6]};
  background: ${({ theme }) => theme.colors.background.primary};
  position: relative;
  overflow: hidden;
`;

const ContentWrapper = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
`;

const QuoteContainer = styled(motion.div)`
  margin-bottom: ${({ theme }) => theme.spacing[24]};
  text-align: center;
  position: relative;
  padding: ${({ theme }) => theme.spacing[12]};
  
  &::before {
    content: '"';
    position: absolute;
    top: -20px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 8rem;
    font-family: ${({ theme }) => theme.typography.fontFamily.heading};
    color: ${({ theme }) => theme.colors.accent.teal};
    opacity: 0.1;
    line-height: 1;
  }
`;

const Quote = styled.blockquote`
  font-family: ${({ theme }) => theme.typography.fontFamily.heading};
  font-size: clamp(1.75rem, 5vw, 3rem);
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};
  color: ${({ theme }) => theme.colors.text.primary};
  font-style: italic;
  
  em {
    color: ${({ theme }) => theme.colors.accent.teal};
    font-style: normal;
    background: ${({ theme }) => theme.colors.accent.tealMuted};
    padding: 0 0.2em;
    border-radius: ${({ theme }) => theme.radii.sm};
  }
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: ${({ theme }) => theme.spacing[12]};
`;

const IconWrapper = styled.div`
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.accent.tealMuted};
  color: ${({ theme }) => theme.colors.accent.teal};
  border-radius: ${({ theme }) => theme.radii.lg};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  border: 1px solid rgba(20, 184, 166, 0.2);
`;

const GridItem = styled(motion.div)`
  h3 {
    font-size: ${({ theme }) => theme.typography.fontSize.xl};
    font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
    color: ${({ theme }) => theme.colors.text.primary};
    margin-bottom: ${({ theme }) => theme.spacing[4]};
    letter-spacing: -0.01em;
  }

  p {
    color: ${({ theme }) => theme.colors.text.secondary};
    line-height: 1.6;
    font-size: ${({ theme }) => theme.typography.fontSize.md};
  }
`;

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
} as const;

export const MissionSection = () => {
  return (
    <SectionContainer>
      <GridPattern />
      <ContentWrapper>
        <QuoteContainer
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <Quote>
            "Pursuing universally accessible healthcare is a cornerstone of global equity. We are <em>bridging the gap</em> between medical science and those who need it most."
          </Quote>
        </QuoteContainer>

        <GridContainer>
          <GridItem
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <IconWrapper>
              <Globe size={24} />
            </IconWrapper>
            <h3>Decentralized Intelligence</h3>
            <p>
              We engineer models that transcend cloud dependency. By optimizing for edge deployment, we bring SOTA diagnostic capabilities to devices that already exist in clinics worldwide.
            </p>
          </GridItem>

          <GridItem
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <IconWrapper>
              <Heart size={24} />
            </IconWrapper>
            <h3>Global Equity</h3>
            <p>
              Technology designed for everywhere, not just wealthy nations. We build for the "missing billions"—tuning our models for diverse populations and resource-constrained environments.
            </p>
          </GridItem>

          <GridItem
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <IconWrapper>
              <BookOpen size={24} />
            </IconWrapper>
            <h3>Open Science</h3>
            <p>
              Black-box medicine is dangerous. We commit to radical transparency, open-sourcing our core architectures like APEX-MoE to invite verification, adaptation, and global trust.
            </p>
          </GridItem>
        </GridContainer>
      </ContentWrapper>
    </SectionContainer>
  );
};
