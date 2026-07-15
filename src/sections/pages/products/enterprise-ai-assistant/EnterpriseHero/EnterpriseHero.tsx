import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUiStore } from '@store/uiStore';
import heroData from '@neryva_data/products/ai_enterprised/section1.json';
import { EnterpriseHeroVisual } from './EnterpriseHeroVisual';
import {
  HeroWrapper,
  ContentGrid,
  LeftColumn,
  Eyebrow,
  Headline,
  DownArrows,
  Description,
  CtaGroup,
  CtaPrimary,
  RightColumn,
} from './EnterpriseHero.styles';

const spring = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: spring, delay },
  }),
};

export function EnterpriseHero() {
  const { setHeaderTheme } = useUiStore();

  useEffect(() => {
    // Header should be light since the left background is white
    setHeaderTheme('light');
    return () => setHeaderTheme('light');
  }, [setHeaderTheme]);

  return (
    <HeroWrapper>
      <ContentGrid>
        {/* ── Left: text content ── */}
        <LeftColumn>
          <motion.div initial="hidden" animate="visible" custom={0.1} variants={fadeUp}>
            <Eyebrow>
              <span>{heroData.hero.eyebrow}</span>
            </Eyebrow>
          </motion.div>

          <motion.div initial="hidden" animate="visible" custom={0.22} variants={fadeUp}>
            <Headline>{heroData.hero.title}</Headline>
          </motion.div>

          <motion.div initial="hidden" animate="visible" custom={0.3} variants={fadeUp}>
            <DownArrows>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M19 12l-7 7-7-7" />
              </svg>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M19 12l-7 7-7-7" />
              </svg>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M19 12l-7 7-7-7" />
              </svg>
            </DownArrows>
          </motion.div>

          <motion.div initial="hidden" animate="visible" custom={0.36} variants={fadeUp}>
            <Description>{heroData.hero.description}</Description>
          </motion.div>

          <motion.div initial="hidden" animate="visible" custom={0.5} variants={fadeUp}>
            <CtaGroup>
              <CtaPrimary href={heroData.hero.ctas[0].href}>
                {heroData.hero.ctas[0].label}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </CtaPrimary>
            </CtaGroup>
          </motion.div>
        </LeftColumn>

        {/* ── Right: visual composition ── */}
        <RightColumn>
          <EnterpriseHeroVisual />
        </RightColumn>
      </ContentGrid>
    </HeroWrapper>
  );
}
