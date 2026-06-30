import { motion } from 'framer-motion';
import { getSiteIdentity } from '@lib/data/site';
import { Wrapper, Inner, Title, Body, Email } from './HomeContact.styles';

const identity = getSiteIdentity();

const fadeUp: any = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] } },
};

export function HomeContact() {
  return (
    <Wrapper>
      <Inner
        as={motion.div}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        transition={{ staggerChildren: 0.1 }}
      >
        <motion.div variants={fadeUp}>
          <Title>Let's talk about research.</Title>
        </motion.div>
        <motion.div variants={fadeUp}>
          <Body>
            We are building a small, focused research lab. If you are working on
            related problems, we would like to hear from you.
          </Body>
        </motion.div>
        <motion.div variants={fadeUp}>
          <Email href={`mailto:${identity.contactEmail}`}>
            {identity.contactEmail}
          </Email>
        </motion.div>
      </Inner>
    </Wrapper>
  );
}
