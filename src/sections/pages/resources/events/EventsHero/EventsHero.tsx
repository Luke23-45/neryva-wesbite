import { useState } from 'react';
import { motion } from 'framer-motion';
import heroImage from '@assets/page/event/events_hero.png';
import {
  Wrapper,
  ContentColumn,
  ImageColumn,
  Label,
  Title,
  Description,
  ArrowIndicator,
  CTAButton,
  ButtonLabelText,
  IconContainer
} from './EventsHero.styles';

const premiumEase = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.9,
      ease: premiumEase,
      delay: custom * 0.12,
    },
  }),
};

const premiumTransition = {
  duration: 0.4,
  ease: [0.16, 1, 0.3, 1]
};

function CyclicHeroCta({ label, href }: { label: string; href: string }) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <CTAButton
      href={href}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Icon 1: Enters from left of the text on hover */}
      <IconContainer
        as={motion.div}
        initial={false}
        animate={{
          width: isHovered ? 14 : 0,
          opacity: isHovered ? 1 : 0,
          x: isHovered ? 0 : -10,
          marginRight: isHovered ? 10 : 0
        }}
        transition={premiumTransition}
        style={{ overflow: 'hidden' }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </IconContainer>

      <ButtonLabelText>
        {label}
      </ButtonLabelText>

      {/* Icon 2: Visible at rest on right side, exits right on hover */}
      <IconContainer
        as={motion.div}
        initial={false}
        animate={{
          width: isHovered ? 0 : 14,
          opacity: isHovered ? 0 : 1,
          x: isHovered ? 10 : 0,
          marginLeft: isHovered ? 0 : 10
        }}
        transition={premiumTransition}
        style={{ overflow: 'hidden' }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </IconContainer>
    </CTAButton>
  );
}

interface Props {
  data: {
    label: string;
    title: string;
    description: string;
  };
}

export function EventsHero({ data }: Props) {
  return (
    <Wrapper>
      <ContentColumn>
        <motion.div custom={1} initial="hidden" animate="visible" variants={fadeUp}>
          <Label>{data.label}</Label>
        </motion.div>

        <motion.div custom={2} initial="hidden" animate="visible" variants={fadeUp}>
          <Title>{data.title}</Title>
        </motion.div>

        <motion.div custom={3} initial="hidden" animate="visible" variants={fadeUp}>
          <ArrowIndicator>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
          </ArrowIndicator>
        </motion.div>

        <motion.div custom={4} initial="hidden" animate="visible" variants={fadeUp}>
          <Description>{data.description}</Description>
        </motion.div>

        <motion.div custom={5} initial="hidden" animate="visible" variants={fadeUp}>
          <CyclicHeroCta href="#events" label="View Schedule" />
        </motion.div>
      </ContentColumn>

      <ImageColumn>
        <motion.img
          src={heroImage}
          alt="Neryva Events and Broadcasts"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </ImageColumn>
    </Wrapper>
  );
}
