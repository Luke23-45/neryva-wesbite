import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import { useUiStore } from '@store/uiStore';
import heroData from '@neryva_data/solutions/hero.json';
import { SolutionsHeroVisual } from './SolutionsHeroVisual';

import {
  HeroWrapper,
  InnerGrid,
  ContentColumn,
  VisualColumn,
  Eyebrow,
  Title,
  TripleArrowCluster,
  Description,
  SolidCta,
} from './SolutionsHero.styles';

const premiumEase = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.9,
      ease: premiumEase,
      delay: custom * 0.12,
    },
  }),
};

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
            <SolidCta href={heroData.cta.href}>
              {heroData.cta.label}
              {/* Emulates the pixel/geometric right arrow indicator from image */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </SolidCta>
          </motion.div>

        </ContentColumn>

        {/* ─── 45% RIGHT SIDE: VISUAL RESERVE ─── */}
        <VisualColumn>
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.4, ease: premiumEase, delay: 0.4 }}
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