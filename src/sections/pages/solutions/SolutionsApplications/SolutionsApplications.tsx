import { motion } from 'framer-motion';
import appsData from '@neryva_data/solutions/applications.json';
import { AppliesFeatureIcon } from '@assets/visual/solution/solutionapplicatioinicon';
import { ease } from '@styles/motion';
import {
  AppsWrapper,
  InnerContainer,
  AppsHeader,
  HeaderIcons,
  AppsTitle,
  AppsDesc,
  AppsGrid,
  AppCell,
  CellIcon,
  CellTitle,
  CellDesc,
} from './SolutionsApplications.styles';


const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: ease.premium,
      delay: custom * 0.1,
    },
  }),
};

export function SolutionsApplications() {
  return (
    <AppsWrapper>
      <InnerContainer>

        {/* ── HEADER ── */}
        <AppsHeader
          as={motion.div}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          <motion.div variants={fadeUp} custom={0}>
            <HeaderIcons>
              {appsData.header.icons.map((icon, idx) => (
                <AppliesFeatureIcon key={idx} id={icon.icon_id} style={{ width: 32, height: 32 }} />
              ))}
            </HeaderIcons>
          </motion.div>

          <motion.div variants={fadeUp} custom={1}>
            <AppsTitle>{appsData.header.title}</AppsTitle>
          </motion.div>

          <motion.div variants={fadeUp} custom={2}>
            <AppsDesc>{appsData.header.description}</AppsDesc>
          </motion.div>
        </AppsHeader>

        {/* ── MASTER GRID ── */}
        <AppsGrid
          as={motion.div}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {appsData.items.map((item, i) => {
            return (
              <AppCell
                key={i}
                as={motion.div}
                variants={fadeUp}
                custom={3 + i}
              >
                <CellIcon>
                  <AppliesFeatureIcon id={item.icon_id} />
                </CellIcon>

                <CellTitle>{item.title}</CellTitle>

                {/* The CSS 'margin-top: auto' automatically pushes this to the floor */}
                <CellDesc>{item.description}</CellDesc>
              </AppCell>
            );
          })}
        </AppsGrid>

      </InnerContainer>
    </AppsWrapper>
  );
}