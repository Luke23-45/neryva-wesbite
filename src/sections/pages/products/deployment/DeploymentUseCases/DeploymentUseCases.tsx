import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import useCasesData from '@neryva_data/products/deployment/use_cases.json';
import {
  DeploymentUseCasesSection,
  DeploymentUseCasesInnerContainer,
  DeploymentUseCasesHeaderBlock,
  DeploymentUseCasesTitle,
  DeploymentUseCasesBentoGrid,
  DeploymentUseCasesBentoCell,
  DeploymentUseCasesCellInner,
  DeploymentUseCasesIconBox,
  DeploymentUseCasesProgressBarTrack,
  DeploymentUseCasesProgressBarFill,
  DeploymentUseCasesAppTitle,
  DeploymentUseCasesAppDesc,
} from './DeploymentUseCases.styles';

import { DeploymentUseCaseIcons } from '@assets/icons/products/DeploymentIcons';

const premiumEase = [0.16, 1, 0.3, 1] as const;

const BASE_DURATION_MS = 7000;
const PER_COLUMN_MS = 2000;

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

export function DeploymentUseCases() {
  const { header, items } = useCasesData;

  const [activeIndex, setActiveIndex] = useState(() =>
    Math.floor(Math.random() * items.length)
  );

  useEffect(() => {
    const currentItem = items[activeIndex];
    const duration = getDurationForCard(currentItem.layoutConfig);

    const timer = setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, duration);

    return () => clearTimeout(timer);
  }, [activeIndex, items]);

  return (
    <DeploymentUseCasesSection>
      <DeploymentUseCasesInnerContainer>

        <DeploymentUseCasesHeaderBlock
          as={motion.div}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, ease: premiumEase }}
        >
          <DeploymentUseCasesTitle>{header.title}</DeploymentUseCasesTitle>
        </DeploymentUseCasesHeaderBlock>

        <DeploymentUseCasesBentoGrid
          as={motion.div}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } },
          }}
        >
          {items.map((item, index) => {
            const Icon = DeploymentUseCaseIcons[item.icon.toLowerCase()];
            const isActive = index === activeIndex;
            const durationMs = getDurationForCard(item.layoutConfig);

            return (
              <DeploymentUseCasesBentoCell
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
                <DeploymentUseCasesCellInner>
                  <DeploymentUseCasesIconBox>
                    {Icon && <Icon />}
                  </DeploymentUseCasesIconBox>

                  <div>
                    <DeploymentUseCasesAppTitle>{item.title}</DeploymentUseCasesAppTitle>
                    <DeploymentUseCasesAppDesc>{item.description}</DeploymentUseCasesAppDesc>
                  </div>
                </DeploymentUseCasesCellInner>

                {isActive && (
                  <DeploymentUseCasesProgressBarTrack>
                    <DeploymentUseCasesProgressBarFill
                      key={item.id}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{
                        duration: durationMs / 1000,
                        ease: 'linear',
                      }}
                    />
                  </DeploymentUseCasesProgressBarTrack>
                )}
              </DeploymentUseCasesBentoCell>
            );
          })}
        </DeploymentUseCasesBentoGrid>

      </DeploymentUseCasesInnerContainer>
    </DeploymentUseCasesSection>
  );
}
