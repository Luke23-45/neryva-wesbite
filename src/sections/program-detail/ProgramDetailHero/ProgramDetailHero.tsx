import { motion } from 'framer-motion';
import type { ProgramPage } from '@types';
import { LLMIcon } from '@/assets/visual/home/programs/LLMIcon';
import { RoboticsIcon } from '@/assets/visual/home/programs/RoboticsIcon';
import { ClinicalIcon } from '@/assets/visual/home/programs/ClinicalIcon';
import { EnergyIcon } from '@/assets/visual/home/programs/EnergyIcon';
import {
  Wrapper,
  Inner,
  LeftColumn,
  MetaRow,
  ProgramNumber,
  StatusBadge,
  Title,
  Summary,
  RightColumn,
  IconFrame,
} from './ProgramDetailHero.styles';

const spring = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (d: number) => ({ opacity: 1, y: 0, transition: { duration: 0.8, ease: spring, delay: d } }),
};

const ICONS: Record<string, JSX.Element> = {
  'large-language-models': <LLMIcon />,
  'robotics-task-transfer': <RoboticsIcon />,
  'clinical-ai': <ClinicalIcon />,
  'energy-engineering-optimization': <EnergyIcon />,
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
            <MetaRow>
              <ProgramNumber>Program {String(program.number).padStart(2, '0')}</ProgramNumber>
              <StatusBadge $accent={program.accent}>{program.status}</StatusBadge>
            </MetaRow>
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
            transition={{ duration: 1.0, ease: spring, delay: 0.5 }}
          >
            <IconFrame $accent={program.accent}>
              {ICONS[slug] ?? null}
            </IconFrame>
          </motion.div>
        </RightColumn>
      </Inner>
    </Wrapper>
  );
}
