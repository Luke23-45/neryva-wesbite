import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import industryData from '@neryva_data/solutions/industries.json';
import { IndustryFeatureIcon } from '@assets/visual/solution/solutionindustry';
import {
  Wrapper,
  InnerContainer,
  HeaderBlock,
  Title,
  Desc,
  SplitLayout,
  Sidebar,
  NavItem,
  NavLabel,
  ActiveIndicator,
  ContentArea,
  IndustryBlock,
  IndustryName,
  AppsGrid,
  AppCell,
  AppIcon,
  AppTitle,
  AppDesc
} from './SolutionsIndustries.styles';

const premiumEase = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: premiumEase, delay: custom * 0.08 },
  }),
};

export function SolutionsIndustries() {
  const { header, industries } = industryData;
  const [activeId, setActiveId] = useState(industries[0].id);

  /* Scroll-to handler: smooth scroll to the target industry block */
  const scrollToIndustry = useCallback((id: string) => {
    setActiveId(id);
    const el = document.getElementById(`industry-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <Wrapper>
      <InnerContainer>

        {/* ── HEADER ── */}
        <HeaderBlock
          as={motion.div}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.8, ease: premiumEase }}
        >
          <Title>{header.title}</Title>
          <Desc>{header.description}</Desc>
        </HeaderBlock>

        {/* ── SPLIT LAYOUT: Sticky Sidebar + Vertical Content ── */}
        <SplitLayout>

          {/* LEFT: Sticky scroll-to navigation */}
          <Sidebar>
            {industries.map((ind) => (
              <NavItem
                key={ind.id}
                $isActive={activeId === ind.id}
                onClick={() => scrollToIndustry(ind.id)}
              >
                {activeId === ind.id && (
                  <ActiveIndicator
                    as={motion.div}
                    layoutId="neryva-industry-nav"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <NavLabel>{ind.name}</NavLabel>
              </NavItem>
            ))}
          </Sidebar>

          {/* RIGHT: All industries stacked vertically */}
          <ContentArea>
            {industries.map((ind) => (
              <IndustryBlock
                key={ind.id}
                id={`industry-${ind.id}`}
                as={motion.div}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-80px' }}
              >
                <motion.div variants={fadeUp} custom={0}>
                  <IndustryName>{ind.name}</IndustryName>
                </motion.div>

                <AppsGrid>
                  {ind.applications.map((app, appIndex) => {
                    return (
                      <AppCell
                        key={app.title}
                        as={motion.div}
                        variants={fadeUp}
                        custom={1 + appIndex}
                      >
                        <AppIcon>
                          <IndustryFeatureIcon id={app.icon_id} />
                        </AppIcon>
                        <AppTitle>{app.title}</AppTitle>
                        <AppDesc>{app.description}</AppDesc>
                      </AppCell>
                    );
                  })}
                </AppsGrid>
              </IndustryBlock>
            ))}
          </ContentArea>

        </SplitLayout>

      </InnerContainer>
    </Wrapper>
  );
}