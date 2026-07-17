import { motion } from 'framer-motion';
import { Headset, BadgeCheck, Users, Workflow } from 'lucide-react';
import { Container } from '@/sections/common/layout/Container';
import {
  UseCasesSection,
  HeaderContainer,
  Subtitle,
  Title,
  Description,
  GridContainer,
  Card,
  IconWrapper,
  CardTitle,
  CardDescription,
} from './EnterpriseUseCases.styles';

const useCases = [
  {
    id: 'customer-service',
    title: 'Customer Service Agent',
    description: 'Resolve product inquiries, triage support requests, and seamlessly handle common customer interactions with precision and empathy.',
    icon: Headset,
  },
  {
    id: 'brand-assistant',
    title: 'Brand Assistant',
    description: 'Represent your organization on your website and support channels with a consistent, professional, and strictly on-brand tone.',
    icon: BadgeCheck,
  },
  {
    id: 'internal-assistant',
    title: 'Internal Assistant',
    description: 'Empower your employees by helping them find information, complete internal tasks, and follow company procedures effortlessly.',
    icon: Users,
  },
  {
    id: 'workflow-agent',
    title: 'Workflow Agent',
    description: 'Support structured operational workflows by routing tickets, collecting necessary details, and preparing next steps autonomously.',
    icon: Workflow,
  },
];

export function EnterpriseUseCases() {
  return (
    <UseCasesSection>
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <HeaderContainer>
            <Subtitle>Built for Professional Interactions</Subtitle>
            <Title>What You Can Build</Title>
            <Description>
              Deploy specialized agents designed to handle specific operational roles within your business, staying on-brand and within bounds.
            </Description>
          </HeaderContainer>
        </motion.div>

        <GridContainer>
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon;
            return (
              <motion.div
                key={useCase.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{
                  duration: 0.6,
                  ease: [0.16, 1, 0.3, 1],
                  delay: index * 0.1, // stagger effect
                }}
              >
                <Card>
                  <IconWrapper>
                    <Icon size={28} strokeWidth={1.5} />
                  </IconWrapper>
                  <CardTitle>{useCase.title}</CardTitle>
                  <CardDescription>{useCase.description}</CardDescription>
                </Card>
              </motion.div>
            );
          })}
        </GridContainer>
      </Container>
    </UseCasesSection>
  );
}
