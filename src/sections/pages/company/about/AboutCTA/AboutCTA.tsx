import { motion } from 'framer-motion';
import { Section } from '@/sections/common/layout/Section';
import { Container } from '@/sections/common/layout/Container';
import { theme } from '@/styles/theme';
import { Title, Description, CTAButton, CTAWrapper } from './AboutCTA.styles';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as any } },
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
    <Section paddingY="lg" background={theme.colors.text.primary}>
      <Container>
        <CTAWrapper
          as={motion.div}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
        >
          <motion.div variants={fadeUp}>
            <Title>{data.title}</Title>
          </motion.div>
          <motion.div variants={fadeUp}>
            <Description>{data.description}</Description>
          </motion.div>
          <motion.div variants={fadeUp}>
            <CTAButton to={data.buttonLink}>{data.buttonText}</CTAButton>
          </motion.div>
        </CTAWrapper>
      </Container>
    </Section>
  );
}
