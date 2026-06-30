import { motion } from 'framer-motion';
import { TextLink } from '@components/common/ui/TextLink';
import { getLatestWork } from '@lib/data/research';
import { Wrapper, Inner, Eyebrow, Title, Message } from './HomeLatestWork.styles';

const latestWork = getLatestWork();

const fadeUp: any = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] } },
};

export function HomeLatestWork() {
  return (
    <Wrapper>
      <Inner>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          transition={{ staggerChildren: 0.1 }}
        >
          <motion.div variants={fadeUp}>
            <Eyebrow>Latest Work</Eyebrow>
            <Title>What we are working on.</Title>
          </motion.div>

          <motion.div variants={fadeUp}>
            {latestWork.items.length > 0 ? (
              <p>Work items will appear here.</p>
            ) : (
              <>
                <Message>{latestWork.earlyStageMessage}</Message>
                <TextLink to="/research">See open research problems</TextLink>
              </>
            )}
          </motion.div>
        </motion.div>
      </Inner>
    </Wrapper>
  );
}
