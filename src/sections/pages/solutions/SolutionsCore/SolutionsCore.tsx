import { motion } from 'framer-motion';
import { ChevronRight, Layers } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import coreData from '@neryva_data/solutions/core_offers.json';
import {
  CoreWrapper,
  ProductSection,
  SectionHeader,
  SectionTitle,
  SectionDesc,
  CTAButton,
  BentoGrid,
  GridCell,
  DecorativeCell,
  Diamond,
  CornerDot,
  InternalDecor,
  IconBox,
  CardTitle,
  CardDesc,
} from './SolutionsCore.styles';

const premiumEase = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: premiumEase, delay: custom * 0.1 },
  }),
};

/* Generate corner dots at all 4×3 grid line intersections (5 cols × 4 rows = 20 dots) */
function renderCornerDots() {
  const dots = [];
  for (let r = 0; r <= 3; r++) {
    for (let c = 0; c <= 4; c++) {
      dots.push(
        <CornerDot
          key={`dot-${r}-${c}`}
          $top={`${(r / 3) * 100}%`}
          $left={`${(c / 4) * 100}%`}
        />
      );
    }
  }
  return dots;
}

export function SolutionsCore() {
  return (
    <CoreWrapper>

      {/* ── PRODUCT SECTIONS (Deployment & Agents) ── */}
      {coreData.products.map((product, pIndex) => (
        <ProductSection key={product.id}>

          {/* Top Header: Title & CTA */}
          <SectionHeader
            as={motion.div}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
          >
            <motion.div variants={fadeUp} custom={0}>
              <SectionTitle>{product.title}</SectionTitle>
            </motion.div>

            <motion.div variants={fadeUp} custom={1}>
              <SectionDesc>{product.description}</SectionDesc>
            </motion.div>

            <motion.div variants={fadeUp} custom={2}>
              <Link to={product.href} style={{ textDecoration: 'none' }}>
                <CTAButton>
                  {product.link_label} <ChevronRight size={16} strokeWidth={2} />
                </CTAButton>
              </Link>
            </motion.div>
          </SectionHeader>

          {/* Bottom Area: The Asymmetric Bento Grid */}
          <BentoGrid
            as={motion.div}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
          >
            {/* Corner dots at all grid intersections — Mistral signature detail */}
            {renderCornerDots()}

            {/* Decorative Floating Diamonds at key intersections */}
            {pIndex === 0 ? (
              <>
                <Diamond $top="33.33%" $left="25%" />
                <Diamond $top="100%" $left="100%" />
              </>
            ) : (
              <>
                <Diamond $top="33.33%" $left="75%" />
                <Diamond $top="100%" $left="0%" />
              </>
            )}

            {/* Core Capability Blocks */}
            {product.blocks.map((block, bIndex) => {
              const hasDecor = block.internal_decor;
              return (
                <GridCell
                  key={block.title}
                  $area={block.area}
                  as={motion.div}
                  variants={fadeUp}
                  custom={3 + bIndex}
                >
                  <IconBox
                    $color={block.icon_color}
                    style={hasDecor ? { marginBottom: '16px' } : undefined}
                  >
                    <Layers size={16} />
                  </IconBox>

                  {/* Two stacked beige blocks for tall-left cards (Mistral "Frontier models" pattern) */}
                  {hasDecor === 'top' && (
                    <>
                      <InternalDecor style={{ minHeight: '130px' }} />
                      <InternalDecor style={{ minHeight: '65px', marginTop: '24px' }} />
                    </>
                  )}

                  <CardTitle
                    style={
                      hasDecor === 'bottom'
                        ? { marginTop: '0', marginBottom: '0' }
                        : undefined
                    }
                  >
                    {block.title}
                  </CardTitle>

                  {block.description && <CardDesc>{block.description}</CardDesc>}

                  {/* Single beige block at bottom for tall-right cards */}
                  {hasDecor === 'bottom' && (
                    <InternalDecor style={{ marginTop: 'auto', minHeight: '240px' }} />
                  )}
                </GridCell>
              );
            })}

            {/* Beige Editorial Spacer — top-left decorative cell */}
            {product.decorative_cell && (
              <DecorativeCell
                $area={product.decorative_cell}
                as={motion.div}
                variants={fadeUp}
                custom={7}
              />
            )}
          </BentoGrid>

        </ProductSection>
      ))}

    </CoreWrapper>
  );
}