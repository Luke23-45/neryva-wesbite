import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUiStore } from '@store/uiStore';
import heroData from '@neryva_data/products/ai_enterprised/section1.json';
import { EnterpriseHeroVisual } from './EnterpriseHeroVisual';
import {
  HeroWrapper,
  MeshOverlay,
  ContentGrid,
  LeftColumn,
  Eyebrow,
  Headline,
  Description,
  CtaGroup,
  CtaPrimary,
  CtaSecondary,
  TrustBar,
  TrustLabel,
  TrustLogos,
  TrustDot,
  TrustLogoPlaceholder,
  RightColumn,
  ScrollHint,
  ScrollLine,
  ScrollLabel,
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
    setHeaderTheme('dark');
    return () => setHeaderTheme('light');
  }, [setHeaderTheme]);

  return (
    <HeroWrapper>
      <MeshOverlay />

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

          <motion.div initial="hidden" animate="visible" custom={0.36} variants={fadeUp}>
            <Description>{heroData.hero.description}</Description>
          </motion.div>

          <motion.div initial="hidden" animate="visible" custom={0.5} variants={fadeUp}>
            <CtaGroup>
              <CtaPrimary href={heroData.hero.ctas[0].href}>
                {heroData.hero.ctas[0].label}
              </CtaPrimary>
              <CtaSecondary href={heroData.hero.ctas[1].href}>
                {heroData.hero.ctas[1].label}
              </CtaSecondary>
            </CtaGroup>
          </motion.div>

          <motion.div initial="hidden" animate="visible" custom={0.65} variants={fadeUp}>
            <TrustBar>
              <TrustLabel>Trusted by</TrustLabel>
              <TrustLogos>
                <TrustLogoPlaceholder>Fortune 500</TrustLogoPlaceholder>
                <TrustDot />
                <TrustLogoPlaceholder>Global Banks</TrustLogoPlaceholder>
                <TrustDot />
                <TrustLogoPlaceholder>Health Systems</TrustLogoPlaceholder>
              </TrustLogos>
            </TrustBar>
          </motion.div>
        </LeftColumn>

        {/* ── Right: visual composition ── */}
        <RightColumn>
          <EnterpriseHeroVisual />
        </RightColumn>
      </ContentGrid>

      {/* ── Scroll hint ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.0, delay: 1.6 }}
      >
        <ScrollHint>
          <ScrollLine />
          <ScrollLabel>Scroll</ScrollLabel>
        </ScrollHint>
      </motion.div>
    </HeroWrapper>
  );
}
