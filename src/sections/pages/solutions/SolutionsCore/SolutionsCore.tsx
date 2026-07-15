import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import coreData from '@neryva_data/solutions/core_offers.json';
import {
  CoreWrapper,
  InnerContainer,
  SectionHeader,
  SectionTitle,
  SectionDescription,
  OfferGrid,
  OfferCard,
  OfferTitle,
  OfferDescription,
  OutcomesList,
  OutcomeItem,
  OfferLink,
  OutcomesBox,
  OutcomesBoxHeader,
  OutcomesBoxTitle,
  OutcomesBoxDesc,
  BusinessOutcomesList,
  BusinessOutcomeItem,
} from './SolutionsCore.styles';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1] as any,
      delay: custom * 0.1,
    },
  }),
};

export function SolutionsCore() {
  return (
    <CoreWrapper id="core-offers">
      <InnerContainer>
        <SectionHeader>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} custom={0} variants={fadeUp}>
            <SectionTitle>{coreData.title}</SectionTitle>
            <SectionDescription>{coreData.description}</SectionDescription>
          </motion.div>
        </SectionHeader>

        <OfferGrid>
          {coreData.offers.map((offer, i) => (
            <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} custom={1 + i} variants={fadeUp} style={{ display: 'flex' }}>
              <OfferCard>
                <OfferTitle>{offer.title}</OfferTitle>
                <OfferDescription>{offer.description}</OfferDescription>
                <OutcomesList>
                  {offer.outcomes.map((outcome, idx) => (
                    <OutcomeItem key={idx}>{outcome}</OutcomeItem>
                  ))}
                </OutcomesList>
                <OfferLink to={offer.href}>
                  {offer.link_label} <ArrowRight size={14} />
                </OfferLink>
              </OfferCard>
            </motion.div>
          ))}
        </OfferGrid>

        <OutcomesBox>
          <OutcomesBoxHeader>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} custom={3} variants={fadeUp}>
              <OutcomesBoxTitle>{coreData.businessOutcomes.title}</OutcomesBoxTitle>
              <OutcomesBoxDesc>{coreData.businessOutcomes.description}</OutcomesBoxDesc>
            </motion.div>
          </OutcomesBoxHeader>
          <BusinessOutcomesList>
            {coreData.businessOutcomes.list.map((item, idx) => (
              <motion.div key={idx} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} custom={4 + (idx * 0.1)} variants={fadeUp}>
                <BusinessOutcomeItem>{item}</BusinessOutcomeItem>
              </motion.div>
            ))}
          </BusinessOutcomesList>
        </OutcomesBox>
      </InnerContainer>
    </CoreWrapper>
  );
}
