import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import heroData from '@neryva_data/solutions/healthcare/section1_hero.json';
import {
  HeroWrapper,
  InnerContainer,
  Eyebrow,
  Title,
  Description,
  HeroCta,
  DiagramContainer
} from './HealthcareHero.styles';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as any, delay: custom * 0.15 },
  }),
};

// A pristine, minimalist technical diagram SVG showing air-gapped security
const SecurityArchitectureDiagram = () => (
  <svg viewBox="0 0 800 240" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Base structure line for isolation boundary */}
    <line x1="300" y1="40" x2="300" y2="200" stroke="currentColor" strokeDasharray="4 4" />
    <text x="310" y="55" fill="currentColor" fontSize="10" fontFamily="monospace" letterSpacing="0.1em">AIR-GAP ISOLATION</text>
    
    {/* Public/EHR side */}
    <rect x="80" y="80" width="140" height="80" stroke="currentColor" />
    <text x="150" y="115" textAnchor="middle" fill="currentColor" fontSize="12" fontFamily="monospace" letterSpacing="0.1em">EHR SYSTEMS</text>
    <text x="150" y="135" textAnchor="middle" fill="currentColor" fontSize="10" fontFamily="monospace" color="rgba(0,0,0,0.5)">PUBLIC NETWORK</text>
    
    {/* Data flow across secure boundary */}
    <path d="M220 120 L380 120" stroke="currentColor" />
    <path d="M375 115 L380 120 L375 125" stroke="currentColor" />
    <circle cx="300" cy="120" r="16" fill="white" stroke="currentColor" />
    <path d="M294 116 L306 124 M306 116 L294 124" stroke="currentColor" /> {/* Blocked symbol for standard traffic */}
    <path d="M300 100 L300 140" stroke="currentColor" /> {/* Gate symbol */}
    
    <text x="300" y="165" textAnchor="middle" fill="currentColor" fontSize="9" fontFamily="monospace">SECURE TUNNEL ONLY</text>

    {/* Secure Neryva VPC side */}
    <rect x="420" y="60" width="300" height="120" stroke="currentColor" />
    <text x="570" y="90" textAnchor="middle" fill="currentColor" fontSize="12" fontFamily="monospace" letterSpacing="0.1em">NERYVA COMPLIANT VPC</text>
    
    {/* Internal secure nodes */}
    <rect x="460" y="110" width="80" height="40" stroke="currentColor" />
    <text x="500" y="133" textAnchor="middle" fill="currentColor" fontSize="10" fontFamily="monospace">INFERENCE</text>
    
    <rect x="580" y="110" width="80" height="40" stroke="currentColor" />
    <text x="620" y="133" textAnchor="middle" fill="currentColor" fontSize="10" fontFamily="monospace">AUDIT LOG</text>
    
    <path d="M540 130 L580 130" stroke="currentColor" />
    <path d="M575 125 L580 130 L575 135" stroke="currentColor" />
  </svg>
);

export function HealthcareHero() {
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
            <ArrowRight size={18} strokeWidth={2} />
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
            <SecurityArchitectureDiagram />
          </DiagramContainer>
        </motion.div>
      </InnerContainer>
    </HeroWrapper>
  );
}
