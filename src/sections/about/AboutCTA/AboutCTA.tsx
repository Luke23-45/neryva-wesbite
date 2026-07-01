import { motion } from 'framer-motion';
import { Wrapper, Title, Description, CTAButton } from './AboutCTA.styles';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};

interface Props {
  data: {
    title: string;
    description: string;
    buttonText: string;
    buttonLink: string;
  };
}

export function AboutCTA({ data }: Props) {
  return (
    <Wrapper as={motion.section} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }}>
      <motion.div variants={fadeUp}>
        <Title>{data.title}</Title>
      </motion.div>
      <motion.div variants={fadeUp}>
        <Description>{data.description}</Description>
      </motion.div>
      <motion.div variants={fadeUp}>
        <CTAButton to={data.buttonLink}>{data.buttonText}</CTAButton>
      </motion.div>
    </Wrapper>
  );
}
