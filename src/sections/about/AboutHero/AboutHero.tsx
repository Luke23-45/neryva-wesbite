import { motion } from 'framer-motion';
import { Wrapper, Inner, GlowBackground, Label, Title, Description } from './AboutHero.styles';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 1.0,
      ease: [0.16, 1, 0.3, 1],
      delay: custom * 0.15,
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
      <GlowBackground />
      <Inner>
        <motion.div custom={1} initial="hidden" animate="visible" variants={fadeUp}>
          <Label>{data.label}</Label>
        </motion.div>
        
        <motion.div custom={2} initial="hidden" animate="visible" variants={fadeUp}>
          <Title>{data.title}</Title>
        </motion.div>
        
        <motion.div custom={3} initial="hidden" animate="visible" variants={fadeUp}>
          <Description>{data.description}</Description>
        </motion.div>
      </Inner>
    </Wrapper>
  );
}
