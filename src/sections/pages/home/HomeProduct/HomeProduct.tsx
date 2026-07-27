import { motion } from 'framer-motion';
import {
  Wrapper,
  Inner,
  HeaderSection,
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
import { HomeProductIcon } from '@assets/visual/navigation/homeproducticon';

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
                  <TileIcon $color="transparent">
                    <HomeProductIcon id={product.id} />
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
