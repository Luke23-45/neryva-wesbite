import { motion } from 'framer-motion';
import ctaData from '@neryva_data/home/sections/cta.json';
import {
  CtaWrapper,
  InnerGrid,
  TextColumn,
  Eyebrow,
  Title,
  ButtonGroup
} from './HomeCta.styles';
import CyclicNextButton from '@components/common/ui/CyclicNextButton/CyclicNextButton';

// Premium Hardware Entrance Easing
const premiumEase = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: premiumEase, delay: custom * 0.1 },
  }),
};



export function HomeCta() {
  return (
    <CtaWrapper>
      <InnerGrid>

        {/* ── MASSIVE DOMINATING ANCHOR TEXT ── */}
        <TextColumn
          as={motion.div}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          <motion.div variants={fadeUp} custom={0}>
            <Eyebrow>{ctaData.eyebrow}</Eyebrow>
          </motion.div>
          <motion.div variants={fadeUp} custom={1}>
            <Title>{ctaData.title}</Title>
          </motion.div>
        </TextColumn>

        {/* ── TACTILE HARDWARE INTERACTIONS ── */}
        <ButtonGroup
          as={motion.div}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {ctaData.buttons.map((btn, i) => (
            <motion.div key={i} variants={fadeUp} custom={3 + i} style={{ display: 'flex', width: '100%' }}>
              <CyclicNextButton
                label={btn.label}
                onClick={() => { window.location.href = btn.href; }}
                bgColor={btn.variant === 'white' ? '#ffffff' : '#090909'}
                textColor={btn.variant === 'white' ? '#050505' : '#ffffff'}
                borderRadius={4}
              />
            </motion.div>
          ))}
        </ButtonGroup>

      </InnerGrid>
    </CtaWrapper>
  );
}