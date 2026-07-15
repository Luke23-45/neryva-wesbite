import { motion } from 'framer-motion';
import indData from '@neryva_data/solutions/industries.json';
import {
  IndustriesWrapper,
  InnerContainer,
  IndHeader,
  IndTitle,
  IndDesc,
  IndList,
  IndItemRow,
  IndItemNameBlock,
  IndItemName,
  IndItemAppsBlock,
  IndItemApp,
  IndItemAppText,
} from './SolutionsIndustries.styles';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1] as any,
      delay: custom * 0.15,
    },
  }),
};

export function SolutionsIndustries() {
  return (
    <IndustriesWrapper>
      <InnerContainer>
        <IndHeader>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} custom={0} variants={fadeUp}>
            <IndTitle>{indData.title}</IndTitle>
            <IndDesc>{indData.description}</IndDesc>
          </motion.div>
        </IndHeader>

        <IndList>
          {indData.industries.map((ind, i) => (
            <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} custom={1 + (i * 0.2)} variants={fadeUp}>
              <IndItemRow>
                <IndItemNameBlock>
                  <IndItemName>{ind.name}</IndItemName>
                </IndItemNameBlock>
                <IndItemAppsBlock>
                  {ind.applications.map((app, idx) => (
                    <IndItemApp key={idx}>
                      <IndItemAppText>{app}</IndItemAppText>
                    </IndItemApp>
                  ))}
                </IndItemAppsBlock>
              </IndItemRow>
            </motion.div>
          ))}
        </IndList>
      </InnerContainer>
    </IndustriesWrapper>
  );
}
