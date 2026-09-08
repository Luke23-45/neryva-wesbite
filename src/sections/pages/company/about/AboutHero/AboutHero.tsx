/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion } from 'framer-motion';
import {
  Wrapper,
  ContentColumn,
  ImageColumn,
  Label,
  Title,
  ArrowIndicator,
  Description,
} from './AboutHero.styles';
import heroimage from "@assets/page/about/about_hero.png"
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1] as any,
      delay: custom * 0.1,
    },
  }),
};

interface Props {
  data: {
    label: string;
    title: string;
    description: string;
  };
}

export function AboutHero({ data }: Props) {
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
      </ContentColumn>

      <ImageColumn>
        <motion.img
          src={heroimage}
          alt="Abstract representation of physical AI"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </ImageColumn>
    </Wrapper>
  );
}
