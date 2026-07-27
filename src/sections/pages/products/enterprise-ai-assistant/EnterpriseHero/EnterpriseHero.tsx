import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useUiStore } from '@store/uiStore';
import heroData from '@neryva_data/products/ai_enterprised/section1.json';
import { EnterpriseHeroVisual } from './EnterpriseHeroVisual';
import CyclicNextButton from '@components/common/ui/CyclicNextButton/CyclicNextButton';

import {
  HeroWrapper,
  Row1,
  CellTopLeft,
  Eyebrow,
  Headline,
  CellTopRight,
  SidebarMetric,
  Row2,
  CellBottomLeft,
  Description,
  CtaGroup,
  CellBottomRight,
} from './EnterpriseHero.styles';

const premiumEase = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.85,
      ease: premiumEase,
      delay: custom * 0.1
    },
  }),
};

export function EnterpriseHero() {
  const { setHeaderTheme } = useUiStore();

  useEffect(() => {
    // Both top blocks are overwhelmingly white/light. Lock the nav header explicitly to light theme.
    setHeaderTheme('light');
    return () => setHeaderTheme('light');
  }, [setHeaderTheme]);

  return (
    <HeroWrapper>

      {/* ─── ROW 1 (65/35 split) ─── */}
      <Row1>
        <CellTopLeft as={motion.div} initial="hidden" animate="visible" custom={0}>
          <motion.div variants={fadeUp} custom={1}>
            <Eyebrow>
              {/* The dot creates that exact premium editorial separator from the reference */}
              <span>{heroData.hero.eyebrow}</span>
              <span>&middot;</span>
              <span>Studio</span>
            </Eyebrow>
          </motion.div>
          <motion.div variants={fadeUp} custom={2}>
            <Headline>{heroData.hero.title}</Headline>
          </motion.div>
        </CellTopLeft>

        <CellTopRight as={motion.div} initial="hidden" animate="visible" custom={0}>
          <motion.div variants={fadeUp} custom={4}>
            <SidebarMetric>
              Dedicated GPU clusters. Cloud-native speed. Maximum performance.
            </SidebarMetric>
          </motion.div>
        </CellTopRight>
      </Row1>

      {/* ─── ROW 2 (40/60 split) ─── */}
      <Row2>
        <CellBottomLeft as={motion.div} initial="hidden" animate="visible" custom={0}>
          <motion.div variants={fadeUp} custom={5}>
            {/* Sourced specifically via prompt directive for exact matching */}
            <Description>
              The professional customer-service and brand-representation layer for enterprise AI. We build and operate AI agents that represent your business professionally, stay on-brand, on-scope, and useful.
            </Description>
          </motion.div>

          <motion.div variants={fadeUp} custom={6}>
            <CtaGroup>
              <CyclicNextButton 
                label="Talk to Solutions" 
                size="large"
                onClick={() => { window.location.href = heroData.hero.ctas?.[0]?.href || "/contact"; }}
              />
            </CtaGroup>
          </motion.div>
        </CellBottomLeft>

        <CellBottomRight
          as={motion.div}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.2, ease: premiumEase, delay: 0.8 }}
        >
          <EnterpriseHeroVisual />
        </CellBottomRight>
      </Row2>

    </HeroWrapper>
  );
}