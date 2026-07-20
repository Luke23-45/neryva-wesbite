import { motion } from 'framer-motion';
import { Network } from 'lucide-react';
import {
  Wrapper,
  Inner,
  BentoGrid,
  BentoTile,
  TileIcon,
  TileContent,
  TileTitle,
  TileDescription,
  CornerDot,
  DiamondLabel,
} from './HomeProduct.styles';

// Custom 'N' Logo replicating the premium Mistral 'M' style
const NeryvaLogo = ({ color = "#FF4D4D" }: { color?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="4" fill={color} />
    <path d="M7 16V8l5 6V8l5 6V8h-2v5l-5-6v8H7z" fill="white" />
  </svg>
);

const OnPremBlueprint = () => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
    <rect x="12" y="12" width="40" height="40" stroke="currentColor" />
    <rect x="20" y="20" width="24" height="24" stroke="currentColor" />
    <circle cx="32" cy="32" r="4" fill="currentColor" />
    <path d="M12 12 L20 20 M52 12 L44 20 M12 52 L20 44 M52 52 L44 44" stroke="currentColor" />
  </svg>
);

const ApiBlueprint = () => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
    <circle cx="32" cy="32" r="28" stroke="currentColor" />
    <circle cx="32" cy="32" r="16" stroke="currentColor" strokeDasharray="4 4" />
    <circle cx="32" cy="32" r="4" fill="currentColor" />
    <path d="M32 4 L32 16 M32 48 L32 60 M4 32 L16 32 M48 32 L60 32" stroke="currentColor" />
  </svg>
);


export function HomeProduct() {
  const isDark = false; // Could be connected to theme later

  return (
    <Wrapper>
      <Inner>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          style={{ width: '100%' }}
        >
          <BentoGrid $isDark={isDark}>
            {/* ROW 1 */}
            
            {/* Col 1: High-Throughput API */}
            <BentoTile $isDark={isDark}>
              <CornerDot $top $right $isDark={isDark} />
              <TileIcon $color="transparent" style={{ color: isDark ? '#fff' : '#000' }}>
                <ApiBlueprint />
              </TileIcon>
              <TileContent>
                <TileTitle $isDark={isDark}>High-Throughput API</TileTitle>
                <TileDescription $isDark={isDark}>
                  Enterprise-grade rate limits with sub-millisecond routing for real-time inference.
                </TileDescription>
              </TileContent>
            </BentoTile>

            {/* Col 2 & 3: Enterprise Assistant (2x1) */}
            <BentoTile $colSpan={2} $isDark={isDark}>
              <CornerDot $top $left $isDark={isDark} />
              <TileIcon $color="transparent">
                <NeryvaLogo color="#FF5500" />
              </TileIcon>
              <TileContent>
                <TileTitle $isDark={isDark}>Enterprise Assistant</TileTitle>
                <TileDescription $isDark={isDark}>
                  The secure AI interface for internal operations and external customer resolution.
                </TileDescription>
              </TileContent>
            </BentoTile>

            {/* Col 4: Applied AI Services (1x2) */}
            <BentoTile $rowSpan={2} $isDark={isDark}>
              <CornerDot $top $left $isDark={isDark} />
              <TileIcon $color="transparent" style={{ color: isDark ? '#fff' : '#000' }}>
                <Network size={24} strokeWidth={1.5} />
              </TileIcon>
              <TileContent>
                <TileTitle $isDark={isDark}>Applied AI services</TileTitle>
                <TileDescription $isDark={isDark}>
                  Tailored AI implementations to accelerate your business goals.
                </TileDescription>
              </TileContent>
            </BentoTile>

            {/* ROW 2 */}
            
            {/* Col 1: Zero Data Retention */}
            <BentoTile $isDark={isDark}>
              <TileIcon $color="transparent" style={{ color: isDark ? '#fff' : '#000' }}>
                <OnPremBlueprint />
              </TileIcon>
              <TileContent>
                <TileTitle $isDark={isDark}>Zero Data Retention</TileTitle>
                <TileDescription $isDark={isDark}>
                  Your proprietary data is never logged, stored, or used for training.
                </TileDescription>
              </TileContent>
            </BentoTile>

            {/* Col 2: Internal Ops */}
            <BentoTile $isDark={isDark}>
              <TileIcon $color="transparent">
                <NeryvaLogo color="#0077FF" />
              </TileIcon>
              <TileContent>
                <TileTitle $isDark={isDark}>Internal Ops</TileTitle>
                <TileDescription $isDark={isDark}>
                  Automate complex workflows and internal knowledge retrieval.
                </TileDescription>
              </TileContent>
            </BentoTile>

            {/* Col 3: Customer Facing */}
            <BentoTile $isDark={isDark}>
              <TileIcon $color="transparent">
                <NeryvaLogo color="#0077FF" />
              </TileIcon>
              <TileContent>
                <TileTitle $isDark={isDark}>Customer Facing</TileTitle>
                <TileDescription $isDark={isDark}>
                  Resolve external inquiries with grounded execution.
                </TileDescription>
              </TileContent>
            </BentoTile>

            {/* ROW 3 */}
            
            {/* Col 1: Custom Models */}
            <BentoTile $isDark={isDark}>
              <TileIcon $color="transparent">
                <span style={{ fontSize: '28px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>🧠</span>
              </TileIcon>
              <TileContent>
                <TileTitle $isDark={isDark}>Custom Models</TileTitle>
                <TileDescription $isDark={isDark}>
                  Train and evaluate domain-specific models securely.
                </TileDescription>
              </TileContent>
            </BentoTile>

            {/* Col 2 & 3: Secure Infrastructure (2x1) */}
            <BentoTile $colSpan={2} $isDark={isDark}>
              <TileIcon $color="transparent">
                <NeryvaLogo color="#FF5500" />
              </TileIcon>
              <TileContent>
                <TileTitle $isDark={isDark}>Secure Infrastructure</TileTitle>
                <TileDescription $isDark={isDark}>
                  Deployed entirely within your enterprise boundary for complete data sovereignty.
                </TileDescription>
              </TileContent>
            </BentoTile>

            {/* Col 4: Grey Block */}
            <BentoTile $isGrey $isDark={isDark} className="hide-on-mobile">
              <CornerDot $top $left $isDark={isDark} />
              <DiamondLabel $isDark={isDark} style={{ top: 'auto', bottom: '-24px', left: '100%' }} />
            </BentoTile>
          </BentoGrid>
        </motion.div>
      </Inner>
    </Wrapper>
  );
}
