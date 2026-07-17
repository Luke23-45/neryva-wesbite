import { motion } from 'framer-motion';
import { Palette, Database, ShieldAlert, Activity } from 'lucide-react';
import { Container } from '@/sections/common/layout/Container';
import {
  CapabilitiesSection,
  HeaderWrapper,
  Subtext,
  SectionHeading,
  SectionDescription,
  BentoGrid,
  BentoCard,
  CardHeader,
  IconContainer,
  CardTitle,
  CardBody,
} from './EnterpriseCapabilities.styles';

const capabilities = [
  {
    id: 'brand-voice',
    title: 'Brand & Voice Design',
    description: 'Shape how the agent speaks. Enforce brand voice, professional tone, approved phrasing patterns, and strictly prohibit disallowed language so it reflects your company perfectly.',
    icon: Palette,
    colorType: 'lilac' as const,
    highlight: false,
  },
  {
    id: 'knowledge-integration',
    title: 'Business Knowledge Integration',
    description: 'Ground responses in reality. Feed the agent with company FAQs, product info, and structured business data so it can answer real customer questions accurately.',
    icon: Database,
    colorType: 'azure' as const,
    highlight: false,
  },
  {
    id: 'guardrails',
    title: 'Guardrails & Escalation',
    description: 'Keep the agent aligned with business policy. Define allowed topics, hard restrict unrelated prompts (like programming or trivia), and establish clear human handoff triggers.',
    icon: ShieldAlert,
    colorType: 'emerald' as const,
    highlight: false,
  },
  {
    id: 'workflow-support',
    title: 'Tool & Workflow Support',
    description: 'Allow the agent to execute practical tasks such as ticket routing, form completion, and status checks directly within your existing systems.',
    icon: Activity,
    colorType: 'amethyst' as const,
    highlight: false,
  },
];

export function EnterpriseCapabilities() {
  return (
    <CapabilitiesSection>
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <HeaderWrapper>
            <Subtext>The Professional Experience Layer</Subtext>
            <SectionHeading>Control, Guardrails, and Voice</SectionHeading>
            <SectionDescription>
              A raw AI model is a liability. We provide the control layer that gives your assistant discipline, ensures it stays on topic, and guarantees a premium experience for every interaction.
            </SectionDescription>
          </HeaderWrapper>
        </motion.div>

        <BentoGrid>
          {capabilities.map((cap, index) => {
            const Icon = cap.icon;
            return (
              <motion.div
                key={cap.id}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{
                  duration: 0.5,
                  ease: [0.16, 1, 0.3, 1],
                  delay: index * 0.1, // Stagger effect
                }}
                style={{ height: '100%' }}
              >
                <BentoCard $highlight={cap.highlight}>
                  <CardHeader>
                    <IconContainer $colorType={cap.colorType}>
                      <Icon size={24} strokeWidth={1.5} />
                    </IconContainer>
                    <CardTitle>{cap.title}</CardTitle>
                  </CardHeader>
                  <CardBody>{cap.description}</CardBody>
                </BentoCard>
              </motion.div>
            );
          })}
        </BentoGrid>
      </Container>
    </CapabilitiesSection>
  );
}
