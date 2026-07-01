import type { FC } from 'react';
import { motion } from 'framer-motion';
import { TextLink } from '@/components/common/ui/TextLink';
import homeResearchData from '@data/pages/home/home_research.json';
import focusAreas from '@data/pages/home/focus-areas.json';
import { Section } from '@/sections/common/layout/Section';
import { Container } from '@/sections/common/layout/Container';
import { theme } from '@/styles/theme';
import { MoEIcon, SparseIcon, StabilityIcon, InferenceIcon } from '@assets/visual/home/research';
import {
  HeaderSection,
  SectionLabel,
  Title,
  BentoGrid,
  BentoCard,
  CardIconWrapper,
  CardTitle,
  CardDescription,
  FooterAction,
} from './HomeResearch.styles';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
};

const AreaIcons: Record<string, FC> = {
  'moe-routing': MoEIcon,
  'sparse-computation': SparseIcon,
  'training-stability': StabilityIcon,
  'inference-optimization': InferenceIcon,
};

export function HomeResearch() {
  const { heading, footer } = homeResearchData;
  const cards = focusAreas;

  return (
    <Section paddingYTop="lg" paddingYBottom="none" background={theme.colors.background.secondary}>
      <Container>
        {/* Section header */}
        <HeaderSection
          as={motion.div}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
        >
          <motion.div variants={fadeUp}>
            <Title>{heading.title}</Title>
          </motion.div>
        </HeaderSection>

        {/* Cards grid */}
        <BentoGrid
          as={motion.div}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={staggerContainer}
        >
          {cards.map((area) => {
            const IconComponent = AreaIcons[area.id] || null;
            return (
              <BentoCard key={area.id} as={motion.div} variants={fadeUp}>
                {IconComponent && (
                  <CardIconWrapper>
                    <IconComponent />
                  </CardIconWrapper>
                )}
                <CardTitle>{area.title}</CardTitle>
                <CardDescription>{area.description}</CardDescription>
              </BentoCard>
            );
          })}
        </BentoGrid>

        {/* Footer CTA */}
        <FooterAction
          as={motion.div}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <TextLink to={footer.linkUrl}>
            {footer.linkText}
          </TextLink>
        </FooterAction>
      </Container>
    </Section>
  );
}
