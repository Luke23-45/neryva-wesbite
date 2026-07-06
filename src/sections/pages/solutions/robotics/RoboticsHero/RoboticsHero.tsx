import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import heroData from '@neryva_data/solutions/robotics/section1_hero.json';
import {
  HeroWrapper,
  InnerContainer,
  Eyebrow,
  Title,
  Description,
  HeroCta,
  DiagramContainer,
} from './RoboticsHero.styles';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1] as const,
      delay: custom * 0.12,
    },
  }),
};

const EmbeddedArchitectureDiagram = () => (
  <svg viewBox="0 0 800 240" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Robot / Edge Device */}
    <rect x="40" y="50" width="180" height="140" rx="1" stroke="currentColor" strokeWidth="1" />
    <text x="130" y="82" textAnchor="middle" fill="currentColor" fontSize="11" fontFamily="IBM Plex Mono, monospace" letterSpacing="0.12em">ROBOT BODY</text>
    <text x="130" y="100" textAnchor="middle" fill="currentColor" fontSize="9" fontFamily="IBM Plex Mono, monospace" opacity="0.5">NVIDIA JETSON / ARM</text>
    {/* Sensor blocks */}
    <rect x="56" y="116" width="60" height="24" rx="1" stroke="currentColor" strokeWidth="0.75" />
    <text x="86" y="132" textAnchor="middle" fill="currentColor" fontSize="7" fontFamily="IBM Plex Mono, monospace">VISION</text>
    <rect x="126" y="116" width="60" height="24" rx="1" stroke="currentColor" strokeWidth="0.75" />
    <text x="156" y="132" textAnchor="middle" fill="currentColor" fontSize="7" fontFamily="IBM Plex Mono, monospace">LIDAR</text>
    <rect x="56" y="148" width="130" height="24" rx="1" stroke="currentColor" strokeWidth="0.75" />
    <text x="121" y="164" textAnchor="middle" fill="currentColor" fontSize="7" fontFamily="IBM Plex Mono, monospace">KINEMATIC TELEM</text>

    {/* Connection to inference */}
    <line x1="220" y1="120" x2="320" y2="120" stroke="currentColor" strokeWidth="0.75" strokeDasharray="4 3" />
    <path d="M315 117 L320 120 L315 123" stroke="#C084FC" strokeWidth="0.75" opacity="0.7" />

    {/* Neryva Edge Inference */}
    <rect x="320" y="40" width="180" height="160" rx="1" stroke="currentColor" strokeWidth="1" />
    <text x="410" y="72" textAnchor="middle" fill="currentColor" fontSize="11" fontFamily="IBM Plex Mono, monospace" letterSpacing="0.12em">NERYVA EDGE</text>
    <text x="410" y="90" textAnchor="middle" fill="currentColor" fontSize="9" fontFamily="IBM Plex Mono, monospace" opacity="0.5">LOCAL INFERENCE</text>
    <rect x="340" y="108" width="60" height="24" rx="1" stroke="currentColor" strokeWidth="0.75" />
    <text x="370" y="124" textAnchor="middle" fill="currentColor" fontSize="7" fontFamily="IBM Plex Mono, monospace">FUSE</text>
    <rect x="410" y="108" width="60" height="24" rx="1" stroke="currentColor" strokeWidth="0.75" />
    <text x="440" y="124" textAnchor="middle" fill="currentColor" fontSize="7" fontFamily="IBM Plex Mono, monospace">DECIDE</text>
    <rect x="340" y="144" width="130" height="24" rx="1" stroke="currentColor" strokeWidth="0.75" />
    <text x="405" y="160" textAnchor="middle" fill="currentColor" fontSize="7" fontFamily="IBM Plex Mono, monospace">RTOS EXEC LAYER</text>

    {/* Connection to actuator */}
    <line x1="500" y1="120" x2="580" y2="120" stroke="currentColor" strokeWidth="0.75" strokeDasharray="4 3" />
    <path d="M575 117 L580 120 L575 123" stroke="#C084FC" strokeWidth="0.75" opacity="0.7" />

    {/* Actuator / Control */}
    <rect x="580" y="60" width="180" height="120" rx="1" stroke="currentColor" strokeWidth="1" />
    <text x="670" y="92" textAnchor="middle" fill="currentColor" fontSize="11" fontFamily="IBM Plex Mono, monospace" letterSpacing="0.12em">ACTUATOR OUT</text>
    <text x="670" y="110" textAnchor="middle" fill="currentColor" fontSize="9" fontFamily="IBM Plex Mono, monospace" opacity="0.5">KINEMATIC TRAJECTORY</text>
    <rect x="600" y="124" width="140" height="24" rx="1" stroke="currentColor" strokeWidth="0.75" />
    <text x="670" y="140" textAnchor="middle" fill="currentColor" fontSize="8" fontFamily="IBM Plex Mono, monospace">VERIFIED ACTIONS</text>

    {/* Bottom label */}
    <text x="400" y="225" textAnchor="middle" fill="currentColor" fontSize="9" fontFamily="IBM Plex Mono, monospace" opacity="0.4" letterSpacing="0.15em">SUB-10MS EDGE INFERENCE PIPELINE</text>
  </svg>
);

export function RoboticsHero() {
  return (
    <HeroWrapper>
      <InnerContainer>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
          <Eyebrow>{heroData.eyebrow}</Eyebrow>
          <Title>{heroData.title}</Title>
          <Description>{heroData.description}</Description>
          <HeroCta href={heroData.cta.href}>
            {heroData.cta.label}
            <ArrowRight size={16} strokeWidth={2} />
          </HeroCta>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={1}
          style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
        >
          <DiagramContainer>
            <EmbeddedArchitectureDiagram />
          </DiagramContainer>
        </motion.div>
      </InnerContainer>
    </HeroWrapper>
  );
}
