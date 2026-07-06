import { motion } from 'framer-motion';
import workflowsData from '@neryva_data/solutions/engineering/section3_workflows.json';
import {
  SectionWrapper,
  InnerContainer,
  HeaderContent,
  Eyebrow,
  Title,
  WorkflowsList,
  WorkflowItem,
  WorkflowNumber,
  WorkflowContent,
  WorkflowTitle,
  WorkflowDescription,
} from './EngineeringWorkflows.styles';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1] as const,
      delay: custom * 0.08,
    },
  }),
};

export function EngineeringWorkflows() {
  return (
    <SectionWrapper>
      <InnerContainer>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
          custom={0}
        >
          <HeaderContent>
            <Eyebrow>{workflowsData.title}</Eyebrow>
            <Title>{workflowsData.subtitle}</Title>
          </HeaderContent>
        </motion.div>

        <WorkflowsList>
          {workflowsData.workflows.map((workflow, index) => (
            <motion.div
              key={workflow.step}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={fadeUp}
              custom={1 + index * 0.3}
            >
              <WorkflowItem>
                <WorkflowNumber>[ {workflow.step} ]</WorkflowNumber>
                <WorkflowContent>
                  <WorkflowTitle>{workflow.title}</WorkflowTitle>
                  <WorkflowDescription>{workflow.description}</WorkflowDescription>
                </WorkflowContent>
              </WorkflowItem>
            </motion.div>
          ))}
        </WorkflowsList>
      </InnerContainer>
    </SectionWrapper>
  );
}
