import { motion } from 'framer-motion';
import { Network } from 'lucide-react';
import {
  Wrapper,
  Inner,
  HeaderSection,
  SectionEyebrow,
  SectionTitle,
  BentoGrid,
  BentoTile,
  TileIcon,
  TileContent,
  TileTitle,
  TileDescription,
  CornerDot,
  DiamondLabel,
} from './HomeProduct.styles';
import productsData from '@neryva_data/home/sections/products.json';

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

const renderIcon = (iconStr: string, color: string) => {
  switch (iconStr) {
    case 'api_blueprint': return <ApiBlueprint />;
    case 'neryva_logo': return <NeryvaLogo color={color} />;
    case 'network': return <Network size={24} strokeWidth={1.5} />;
    case 'on_prem_blueprint': return <OnPremBlueprint />;
    case 'brain': return <span style={{ fontSize: '28px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>🧠</span>;
    default: return null;
  }
};

export function HomeProduct() {
  const isDark = false; // Could be connected to theme later

  return (
    <Wrapper>
      <Inner>
        <HeaderSection as={motion.div} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }}>
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } } }}>
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 } } }}>
            <SectionTitle>{productsData.title}</SectionTitle>
          </motion.div>
        </HeaderSection>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          style={{ width: '100%' }}
        >
          <BentoGrid $isDark={isDark}>
            {productsData.products.map((product) => {
              const needsThemeColor = ['api_blueprint', 'network', 'on_prem_blueprint'].includes(product.icon);
              return (
                <BentoTile
                  key={product.id}
                  $colSpan={product.colSpan}
                  $rowSpan={product.rowSpan}
                  $isDark={isDark}
                >
                  {product.dots.map((corner) => (
                    <CornerDot key={`${product.id}-${corner}`} $corner={corner as 'tl' | 'tr' | 'bl' | 'br'} $isDark={isDark} />
                  ))}
                  {product.diamond && (
                    <DiamondLabel $isDark={isDark} style={{ top: 0, left: 0, translate: '-50% -50%' }} />
                  )}
                  <TileIcon
                    $color="transparent"
                    style={needsThemeColor ? { color: isDark ? '#fff' : '#000' } : undefined}
                  >
                    {renderIcon(product.icon, product.iconColor)}
                  </TileIcon>
                  <TileContent>
                    <TileTitle $isDark={isDark}>{product.title}</TileTitle>
                    <TileDescription $isDark={isDark}>{product.description}</TileDescription>
                  </TileContent>
                </BentoTile>
              );
            })}

            {/* Col 4: Grey Block */}
            <BentoTile $isGrey $isDark={isDark} className="hide-on-mobile">
              <CornerDot $corner="tl" $isDark={isDark} />
              <CornerDot $corner="tr" $isDark={isDark} />
              <DiamondLabel $isDark={isDark} style={{ bottom: 0, right: 0, translate: '50% 50%' }} />
            </BentoTile>
          </BentoGrid>
        </motion.div>
      </Inner>
    </Wrapper>
  );
}
