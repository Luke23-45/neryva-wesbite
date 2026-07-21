import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import useCasesData from '@neryva_data/products/ai_enterprised/use_cases.json';
import {
  UseCasesSection,
  InnerContainer,
  HeaderBlock,
  Title,
  BentoGrid,
  BentoCell,
  CellInner,
  IconBox,
  ProgressBarTrack,
  ProgressBarFill,
  AppTitle,
  AppDesc,
} from './EnterpriseUseCases.styles';

import { EnterpriseIcons } from '@/assets/icons/products/EnterpriseCapabilityIcons';

const premiumEase = [0.16, 1, 0.3, 1] as const;

/* ─── DYNAMIC DWELL TIME ───.
   Wider cards get extra attention. Base duration is generous by default;
   each additional column span adds PER_COLUMN_MS on top, so the bento's
   larger cells naturally anchor the eye longer. */
const BASE_DURATION_MS = 7000;
const PER_COLUMN_MS = 2000;

/* Parse 'rowStart / colStart / rowEnd / colEnd' → column span (≥ 1). */
const getColumnSpan = (layoutConfig: string): number => {
  const parts = layoutConfig.trim().split(/\s*\/\s*/);
  if (parts.length !== 4) return 1;
  const colStart = parseInt(parts[1], 10);
  const colEnd = parseInt(parts[3], 10);
  if (Number.isNaN(colStart) || Number.isNaN(colEnd)) return 1;
  return Math.max(1, colEnd - colStart);
};

const getDurationForCard = (layoutConfig: string): number =>
  BASE_DURATION_MS + (getColumnSpan(layoutConfig) - 1) * PER_COLUMN_MS;

export function EnterpriseUseCases() {
  const { header, items } = useCasesData;

  /* Pick a random starting card so the first reveal feels organic,
     not always pinned to the first item in the array. */
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.floor(Math.random() * items.length)
  );

  /* Schedule the next rotation based on the *current* active card's width.
     When activeIndex changes, this effect re-runs with a fresh
     duration-matched timeout — wider cards stay longer on screen. */
  useEffect(() => {
    const currentItem = items[activeIndex];
    const duration = getDurationForCard(currentItem.layoutConfig);

    const timer = setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, duration);

    return () => clearTimeout(timer);
  }, [activeIndex, items]);

  return (
    <UseCasesSection>
      <InnerContainer>

        {/* ─── HEADER ENTRY ─── */}
        <HeaderBlock
          as={motion.div}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, ease: premiumEase }}
        >
          <Title>{header.title}</Title>
        </HeaderBlock>

        {/* ─── BENTO GRID ASSEMBLY ─── */}
        <BentoGrid
          as={motion.div}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } }, // Cascading entrance
          }}
        >
          {items.map((item, index) => {
            const Icon = EnterpriseIcons[item.icon.toLowerCase()];
            const isActive = index === activeIndex;
            /* Width-matched duration — wider cards dwell longer,
               and the bar's animation synchronises exactly with this timer. */
            const durationMs = getDurationForCard(item.layoutConfig);

            return (
              <BentoCell
                key={item.id}
                $layoutArea={item.layoutConfig}
                $isActive={isActive}
                as={motion.div}
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.8, ease: premiumEase },
                  },
                }}
              >
                {/* CellInner carries the padding so the ProgressBar
                    can stretch to the true outer edges of the cell. */}
                <CellInner>
                  {/* Visual Anchor pushed to top */}
                  <IconBox>
                    {Icon && <Icon />}
                  </IconBox>

                  {/* Content pinned gracefully to the bottom via CSS margin trick */}
                  <div>
                    <AppTitle>{item.title}</AppTitle>
                    <AppDesc>{item.description}</AppDesc>
                  </div>
                </CellInner>

                {/* Active-only progress bar. Remounts on rotation,
                    animates scaleX 0 → 1 in lockstep with durationMs. */}
                {isActive && (
                  <ProgressBarTrack>
                    <ProgressBarFill
                      key={item.id}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{
                        duration: durationMs / 1000,
                        ease: 'linear',
                      }}
                    />
                  </ProgressBarTrack>
                )}
              </BentoCell>
            );
          })}
        </BentoGrid>

      </InnerContainer>
    </UseCasesSection>
  );
}
