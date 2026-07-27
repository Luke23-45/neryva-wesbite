import { motion } from 'framer-motion';
import { LockKeyhole, Network, Zap, LineChart } from 'lucide-react';
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
} from './DeploymentCapabilities.styles';

const capabilities = [
  {
    id: 'secure-provisioning',
    title: 'Secure Provisioning',
    description: 'Set up the environment needed for controlled production use. We manage identity, access control, network segmentation, and baseline hardening to ensure secure execution.',
    icon: LockKeyhole,
    colorType: 'emerald' as const,
    highlight: false,
  },
  {
    id: 'model-serving',
    title: 'Model Serving & Routing',
    description: 'Put the model into a usable production interface. This includes API exposure, load balancing, request routing, and robust fallback behaviors for critical operations.',
    icon: Network,
    colorType: 'azure' as const,
    highlight: false,
  },
  {
    id: 'performance',
    title: 'Performance Optimization',
    description: 'Improve practical efficiency with latency reduction, throughput tuning, batching strategies, and model quantization tailored to your computational limits.',
    icon: Zap,
    colorType: 'amethyst' as const,
    highlight: false,
  },
  {
    id: 'governance',
    title: 'Governance & Reliability',
    description: 'Maintain visibility and control over time. Implement uptime monitoring, structured rollback planning, comprehensive audit logs, and clear operational handoff documentation.',
    icon: LineChart,
    colorType: 'lilac' as const,
    highlight: false,
  },
];

export function DeploymentCapabilities() {
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
            <Subtext>The Secure Runtime Foundation</Subtext>
            <SectionHeading>Engineering Core Service Areas</SectionHeading>
            <SectionDescription>
              We deliver the tangible structure needed to run an AI system in production, ensuring it is secure, fast, and continuously monitored.
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
