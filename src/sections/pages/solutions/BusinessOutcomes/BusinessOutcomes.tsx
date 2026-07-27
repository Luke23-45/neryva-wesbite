import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import outcomesData from '@neryva_data/solutions/business_outcomes.json';
import {
  Wrapper,
  InnerGrid,
  StickyHeader,
  Title,
  Description,
  ListContainer,
  InteractiveRow,
  RowContent,
  OutcomeText,
  HoverPill
} from './BusinessOutcomes.styles';

const premiumEase = [0.16, 1, 0.3, 1] as const;

export function BusinessOutcomes() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <Wrapper>
      <InnerGrid>

        {/* ─── 40% LEFT MONOLITH ─── */}
        <StickyHeader
          as={motion.div}
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: premiumEase }}
        >
          <Title>{outcomesData.title}</Title>
          <Description>{outcomesData.description}</Description>
        </StickyHeader>

        {/* ─── 60% RIGHT GLIDING LIST ─── */}
        {/* MouseLeave clears the state, ensuring the pill cleanly dissolves when exiting the component block entirely */}
        <ListContainer onMouseLeave={() => setHoveredIdx(null)}>
          {outcomesData.list.map((outcome, idx) => {
            // Elegant micro-typographical prefix generator (e.g., "01", "02")
            // const serialIndex = String(idx + 1).padStart(2, '0');

            return (
              <InteractiveRow
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                as={motion.div}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                // Cascading sequence entry animation per row
                transition={{ duration: 0.8, ease: premiumEase, delay: idx * 0.08 }}
              >

                {/* ── THE APPLE-STYLE PHYSICS PILL ── */}
                <AnimatePresence>
                  {hoveredIdx === idx && (
                    <HoverPill
                      as={motion.div}
                      // Crucial LayoutID bridges instances to enable physical 'gliding' tracking 
                      layoutId="ios-hover-pill"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        // Tight Apple-hardware emulation curves
                        type: 'spring',
                        stiffness: 300,
                        damping: 30,
                        mass: 0.8,
                        opacity: { duration: 0.2 }
                      }}
                    />
                  )}
                </AnimatePresence>

                <RowContent>
                  <OutcomeText>{outcome}</OutcomeText>
                </RowContent>

              </InteractiveRow>
            );
          })}
        </ListContainer>

      </InnerGrid>
    </Wrapper>
  );
}