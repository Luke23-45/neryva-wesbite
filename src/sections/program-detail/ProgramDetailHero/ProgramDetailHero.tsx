import { motion } from 'framer-motion';
import type { ProgramPage } from '@types';
import { ProgramHeroVisual } from './ProgramHeroVisual';
import {
  Wrapper,
  Inner,
  LeftColumn,
  StatusBadge,
  Title,
  Summary,
  RightColumn,
  IconFrame,
} from './ProgramDetailHero.styles';

const spring = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (d: number) => ({ opacity: 1, y: 0, transition: { duration: 0.8, ease: spring as any, delay: d } }),
};



interface Props {
  program: ProgramPage;
  slug: string;
}

export function ProgramDetailHero({ program, slug }: Props) {
  return (
    <Wrapper $accent={program.accent}>
      <Inner>
        <LeftColumn>
          <motion.div initial="hidden" animate="visible" custom={0.1} variants={fadeUp}>
            <StatusBadge $accent={program.accent}>{program.status}</StatusBadge>
          </motion.div>

          <motion.div initial="hidden" animate="visible" custom={0.22} variants={fadeUp}>
            <Title $accent={program.accent}>{program.title}</Title>
          </motion.div>

          <motion.div initial="hidden" animate="visible" custom={0.34} variants={fadeUp}>
            <Summary>{program.summary}</Summary>
          </motion.div>
        </LeftColumn>

        <RightColumn>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.0, ease: spring as any, delay: 0.5 }}
          >
            <IconFrame>
              <ProgramHeroVisual slug={slug} accent={program.accent} />
            </IconFrame>
          </motion.div>
        </RightColumn>
      </Inner>
    </Wrapper>
  );
}
