import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import { useUiStore } from '@store/uiStore';
import heroData from '@neryva_data/solutions/hero.json';
import { SolutionsHeroVisual } from './SolutionsHeroVisual';

import {
import { ease } from '@styles/motion';
  HeroWrapper,
  InnerGrid,
  ContentColumn,
  VisualColumn,
  Eyebrow,
  Title,
  TripleArrowCluster,
  Description,
  SolidCta,
  ButtonLabelText,
  IconContainer,
} from './SolutionsHero.styles';


const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.9,
      ease: ease.premium,
      delay: custom * 0.12,
    },
  }),
};

const premiumTransition = {
  duration: 0.4,
  ease: [0.16, 1, 0.3, 1] as const
};

function CyclicHeroCta({ label, href }: { label: string; href: string }) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <SolidCta
      href={href}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Icon 1: Enters from left of the text on hover */}
      <IconContainer
        as={motion.div}
        initial={false}
        animate={{
          width: isHovered ? 16 : 0,
          opacity: isHovered ? 1 : 0,
          x: isHovered ? 0 : -10,
          marginRight: isHovered ? 12 : 0
        }}
        transition={premiumTransition}
        style={{ overflow: 'hidden' }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </IconContainer>

      <ButtonLabelText>
        {label}
      </ButtonLabelText>

      {/* Icon 2: Visible at rest on right side, exits right on hover */}
      <IconContainer
        as={motion.div}
        initial={false}
        animate={{
          width: isHovered ? 0 : 16,
          opacity: isHovered ? 0 : 1,
          x: isHovered ? 10 : 0,
          marginLeft: isHovered ? 0 : 12
        }}
        transition={premiumTransition}
        style={{ overflow: 'hidden' }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </IconContainer>
    </SolidCta>
  );
}


export function SolutionsHero() {
  const { setHeaderTheme } = useUiStore();

  useEffect(() => {
    // This premium off-white layout rigorously demands a 'light' theme setting 
    // to contrast nicely with the navigation components above.
    setHeaderTheme('light');
  }, [setHeaderTheme]);

  return (
    <HeroWrapper>
      <InnerGrid>

        {/* ─── 55% LEFT SIDE: TYPOGRAPHICAL ANCHOR ─── */}
        <ContentColumn>

          <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}>
            <Eyebrow>{heroData.eyebrow}</Eyebrow>
          </motion.div>

          <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp}>
            <Title dangerouslySetInnerHTML={{ __html: heroData.title.replace(/\n/g, '<br />') }} />
          </motion.div>

          <motion.div initial="hidden" animate="visible" custom={3} variants={fadeUp}>
            {/* The absolute marker of meticulous bespoke layout — identical stack as ref */}
            <TripleArrowCluster>
              <ArrowDown />
              <ArrowDown />
              <ArrowDown />
            </TripleArrowCluster>
          </motion.div>

          <motion.div initial="hidden" animate="visible" custom={4} variants={fadeUp}>
            <Description>{heroData.description}</Description>
          </motion.div>

          <motion.div initial="hidden" animate="visible" custom={5} variants={fadeUp}>
            <CyclicHeroCta href={heroData.cta.href} label={heroData.cta.label} />
          </motion.div>

        </ContentColumn>

        {/* ─── 45% RIGHT SIDE: VISUAL RESERVE ─── */}
        <VisualColumn>
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.4, ease: ease.premium, delay: 0.4 }}
            style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
          >
            {/* Whatever visual component gets routed here will sit in flawless proportion to text */}
            <SolutionsHeroVisual />
          </motion.div>
        </VisualColumn>

      </InnerGrid>
    </HeroWrapper>
  );
}