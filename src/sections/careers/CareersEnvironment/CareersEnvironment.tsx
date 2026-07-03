import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Section } from '@/sections/common/layout/Section';
import { Container } from '@/sections/common/layout/Container';
import { theme } from '@/styles/theme';
import {
  HeaderLayout,
  SectionHeader,
  Label,
  Title,
  ControlsContainer,
  ProgressIndicator,
  NavButton,
  SliderContainer,
  SlideCell,
  PerkCard,
  TopSection,
  IconWrapper,
  PerkTitle,
  PerkDesc,
} from './CareersEnvironment.styles';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

interface Perk {
  id: string;
  title: string;
  description: string;
  accentColor?: string;
}

interface Props {
  data: {
    label: string;
    title: string;
    items: Perk[];
  };
}

const renderIcon = (id: string) => {
  switch (id) {
    case '01':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 2h4v4h2v2h2v6h-2v4h-2v2h-4v-2H8v-4H6v-6h2V6h2V2z" />
          <path d="M12 10h2v4h-2v-4z" fill="white" />
        </svg>
      );
    case '02':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M15 2H9v8H5l8 12v-8h4l-2-12z" />
        </svg>
      );
    case '03':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 4h-4v4h4V4z" />
          <path d="M14 10H6v8h2v-6h4v6h2v-8z" />
        </svg>
      );
    case '04':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 2h12v10H8v10H6V2z" />
        </svg>
      );
    default:
      return null;
  }
};

export function CareersEnvironment({ data }: Props) {
  const sliderRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (sliderRef.current) {
      const scrollAmount = sliderRef.current.clientWidth / 2;
      sliderRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (sliderRef.current) {
      const scrollAmount = sliderRef.current.clientWidth / 2;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <Section paddingY="lg" background={theme.colors.background.primary} style={{ overflow: 'hidden' }}>
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={stagger}>
        <Container>
          <HeaderLayout>
            <SectionHeader>
              <motion.div variants={fadeUp}>
                <Label>{data.label}</Label>
              </motion.div>
              <motion.div variants={fadeUp}>
                <Title>{data.title}</Title>
              </motion.div>
            </SectionHeader>
            
            <motion.div variants={fadeUp}>
              <ControlsContainer>
                <ProgressIndicator>
                  <div className="bar" />
                  <div className="dot" />
                </ProgressIndicator>
                <NavButton onClick={scrollLeft} aria-label="Previous">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </NavButton>
                <NavButton onClick={scrollRight} aria-label="Next">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </NavButton>
              </ControlsContainer>
            </motion.div>
          </HeaderLayout>
          <motion.div variants={fadeUp}>
            <SliderContainer ref={sliderRef}>
              {data.items.map((item) => (
                <SlideCell key={item.id}>
                  <PerkCard $accentColor={item.accentColor}>
                    <TopSection>
                      <IconWrapper>
                        {renderIcon(item.id)}
                      </IconWrapper>
                      <PerkTitle>{item.title}</PerkTitle>
                    </TopSection>
                    <PerkDesc>{item.description}</PerkDesc>
                  </PerkCard>
                </SlideCell>
              ))}
            </SliderContainer>
          </motion.div>
        </Container>
      </motion.div>
    </Section>
  );
}
