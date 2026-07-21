import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useUiStore } from '@store/uiStore';
import heroData from '@neryva_data/products/deployment/section1_hero.json';
import { DeploymentHeroVisual } from './DeploymentHeroVisual';

import {
  DeploymentHeroWrapper,
  DeploymentHeroRow1,
  DeploymentHeroCellTopLeft,
  DeploymentHeroEyebrow,
  DeploymentHeroHeadline,
  DeploymentHeroCellTopRight,
  DeploymentHeroSidebarMetric,
  DeploymentHeroRow2,
  DeploymentHeroCellBottomLeft,
  DeploymentHeroDescription,
  DeploymentHeroCtaGroup,
  DeploymentHeroCtaPrimary,
  DeploymentHeroCellBottomRight,
} from './DeploymentHero.styles';

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

export function DeploymentHero() {
  const { setHeaderTheme } = useUiStore();

  useEffect(() => {
    setHeaderTheme('light');
    return () => setHeaderTheme('light');
  }, [setHeaderTheme]);

  const ctaHref = heroData.cta?.href ?? '/contact';
  const ctaLabel = heroData.cta?.label ?? 'Talk to Solutions';

  return (
    <DeploymentHeroWrapper>

      {/* ─── ROW 1 (65/35 split) ─── */}
      <DeploymentHeroRow1>
        <DeploymentHeroCellTopLeft as={motion.div} initial="hidden" animate="visible" custom={0}>
          <motion.div variants={fadeUp} custom={1}>
            <DeploymentHeroEyebrow>
              <span>{heroData.eyebrow}</span>
              <span>&middot;</span>
              <span>Operations</span>
            </DeploymentHeroEyebrow>
          </motion.div>
          <motion.div variants={fadeUp} custom={2}>
            <DeploymentHeroHeadline>{heroData.title}</DeploymentHeroHeadline>
          </motion.div>
        </DeploymentHeroCellTopLeft>

        <DeploymentHeroCellTopRight as={motion.div} initial="hidden" animate="visible" custom={0}>
          <motion.div variants={fadeUp} custom={4}>
            <DeploymentHeroSidebarMetric>
              Dedicated GPU clusters. Cloud-native speed. Maximum performance.
            </DeploymentHeroSidebarMetric>
          </motion.div>
        </DeploymentHeroCellTopRight>
      </DeploymentHeroRow1>

      {/* ─── ROW 2 (45/55 split) ─── */}
      <DeploymentHeroRow2>
        <DeploymentHeroCellBottomLeft as={motion.div} initial="hidden" animate="visible" custom={0}>
          <motion.div variants={fadeUp} custom={5}>
            <DeploymentHeroDescription>
              {heroData.description}
            </DeploymentHeroDescription>
          </motion.div>

          <motion.div variants={fadeUp} custom={6}>
            <DeploymentHeroCtaGroup>
              <DeploymentHeroCtaPrimary href={ctaHref}>
                {ctaLabel}
                <ChevronRight size={18} strokeWidth={1.5} />
              </DeploymentHeroCtaPrimary>
            </DeploymentHeroCtaGroup>
          </motion.div>
        </DeploymentHeroCellBottomLeft>

        <DeploymentHeroCellBottomRight
          as={motion.div}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.2, ease: premiumEase, delay: 0.8 }}
        >
          <DeploymentHeroVisual />
        </DeploymentHeroCellBottomRight>
      </DeploymentHeroRow2>

    </DeploymentHeroWrapper>
  );
}
