import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import heroData from '@neryva_data/solutions/hero.json';
import { SolutionsHeroVisual } from './SolutionsHeroVisual';
import {
  HeroWrapper,
  ContentColumn,
  VisualColumn,
  Eyebrow,
  Title,
  Description,
  ScrollIndicator,
} from './SolutionsHero.styles';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1] as any,
      delay: custom * 0.15,
    },
  }),
};

export function SolutionsHero() {
  return (
    <HeroWrapper>
      <ContentColumn>
        <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}>
          <Eyebrow>{heroData.eyebrow}</Eyebrow>
        </motion.div>
        
        <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp}>
          <Title>{heroData.title}</Title>
        </motion.div>
        
        <motion.div initial="hidden" animate="visible" custom={2} variants={fadeUp}>
          <Description>{heroData.description}</Description>
        </motion.div>
        
        <motion.div initial="hidden" animate="visible" custom={3} variants={fadeUp} style={{ marginTop: '32px' }}>
          <ScrollIndicator href={heroData.cta.href}>
            {heroData.cta.label}
            <ArrowDown size={16} />
          </ScrollIndicator>
        </motion.div>
      </ContentColumn>

      <VisualColumn>
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
        >
          <SolutionsHeroVisual />
        </motion.div>
      </VisualColumn>
    </HeroWrapper>
  );
}
