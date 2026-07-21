import { motion } from 'framer-motion';
import { Server, Wrench, ShieldCheck, FileSearch } from 'lucide-react';
import { Container } from '@/sections/common/layout/Container';
import {
  TypesSection,
  HeaderWrapper,
  Subtitle,
  Title,
  Description,
  GridContainer,
  TypeCard,
  IconWrapper,
  CardTitle,
  CardDescription,
} from './DeploymentTypes.styles';

const deploymentTypes = [
  {
    id: 'private',
    title: 'Private Deployment',
    description: 'Run the model entirely inside a secure, customer-controlled environment with strict data boundaries and network segmentation.',
    icon: Server,
  },
  {
    id: 'hardening',
    title: 'Production Hardening',
    description: 'Take your existing pilots and prototypes and rebuild them into highly dependable, secure production systems.',
    icon: ShieldCheck,
  },
  {
    id: 'managed',
    title: 'Managed Operations',
    description: 'We provide external, ongoing operational support to keep your deployed AI systems secure, efficient, and reliable over time.',
    icon: Wrench,
  },
  {
    id: 'advisory',
    title: 'Deployment Advisory',
    description: 'Receive architecture and implementation guidance before committing to a costly build or complex environment change.',
    icon: FileSearch,
  },
];

export function DeploymentTypes() {
  return (
    <TypesSection>
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <HeaderWrapper>
            <Subtitle>Bridging the Production Gap</Subtitle>
            <Title>Delivering Operational AI</Title>
            <Description>
              Most enterprises do not fail because they cannot access a model. They fail because they cannot productionize it. We turn your chosen models into trusted systems that can be owned and monitored.
            </Description>
          </HeaderWrapper>
        </motion.div>

        <GridContainer>
          {deploymentTypes.map((type, index) => {
            const Icon = type.icon;
            return (
              <motion.div
                key={type.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{
                  duration: 0.6,
                  ease: [0.16, 1, 0.3, 1],
                  delay: index * 0.1, // stagger
                }}
              >
                <TypeCard>
                  <IconWrapper>
                    <Icon size={24} strokeWidth={1.5} />
                  </IconWrapper>
                  <CardTitle>{type.title}</CardTitle>
                  <CardDescription>{type.description}</CardDescription>
                </TypeCard>
              </motion.div>
            );
          })}
        </GridContainer>
      </Container>
    </TypesSection>
  );
}
