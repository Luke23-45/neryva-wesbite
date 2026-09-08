/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion } from 'framer-motion';
import { Wrapper, LeftColumn, RightColumn, Eyebrow, Title, Description } from './ContactHero.styles';

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

export function ContactHero() {
  return (
    <Wrapper>
      <LeftColumn>
        <motion.div custom={1} initial="hidden" animate="visible" variants={fadeUp}>
          <Eyebrow>CONTACT</Eyebrow>
        </motion.div>
        <motion.div custom={2} initial="hidden" animate="visible" variants={fadeUp}>
          <Title>Get in touch with the team.</Title>
        </motion.div>
      </LeftColumn>
      
      <RightColumn>
        <motion.div custom={3} initial="hidden" animate="visible" variants={fadeUp}>
          <Description>Let's start your journey to the frontier.</Description>
        </motion.div>
      </RightColumn>
    </Wrapper>
  );
}
