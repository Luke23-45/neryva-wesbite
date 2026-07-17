import { motion } from 'framer-motion';
import { ChevronRight, Layers, Check } from 'lucide-react';
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
  IconBox,
  CardTitle,
  CardDesc,
  OutcomesSection,
  OutcomesHeader,
  OutcomesGrid,
  OutcomeCell,
  OutcomeText
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
            {/* Decorative Floating Diamonds for Mistral-style depth */}
            {pIndex === 0 ? (
              <>
                <Diamond $top="33.33%" $left="25%" />
                <Diamond $top="66.66%" $left="75%" />
              </>
            ) : (
              <>
                <Diamond $top="33.33%" $left="75%" />
                <Diamond $top="66.66%" $left="25%" />
              </>
            )}

            {/* Core Capability Blocks */}
            {product.blocks.map((block, bIndex) => (
              <GridCell
                key={block.title}
                $area={block.area}
                as={motion.div}
                variants={fadeUp}
                custom={3 + bIndex}
              >
                <IconBox $color={block.icon_color}><Layers size={16} /></IconBox>
                <CardTitle>{block.title}</CardTitle>
                <CardDesc>{block.description}</CardDesc>
              </GridCell>
            ))}

            {/* Beige Editorial Spacers */}
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

      {/* ── BUSINESS OUTCOMES SECTION ── */}
      <OutcomesSection
        as={motion.div}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
      >
        <OutcomesHeader>
          <motion.div variants={fadeUp} custom={0}>
            <SectionTitle style={{ fontSize: '32px', marginBottom: '16px' }}>
              {coreData.businessOutcomes.title}
            </SectionTitle>
          </motion.div>
          <motion.div variants={fadeUp} custom={1}>
            <SectionDesc>
              {coreData.businessOutcomes.description}
            </SectionDesc>
          </motion.div>
        </OutcomesHeader>

        <OutcomesGrid>
          {coreData.businessOutcomes.list.map((outcome, idx) => (
            <OutcomeCell
              key={idx}
              as={motion.div}
              variants={fadeUp}
              custom={2 + (idx * 0.05)}
            >
              <Check size={18} strokeWidth={2} color="#000" style={{ flexShrink: 0, marginTop: '2px' }} />
              <OutcomeText>{outcome}</OutcomeText>
            </OutcomeCell>
          ))}
        </OutcomesGrid>
      </OutcomesSection>

    </CoreWrapper>
  );
}