import { motion } from 'framer-motion';
import { Headset, BadgeCheck, Users, Workflow } from 'lucide-react';
import useCasesData from '@neryva_data/products/ai_enterprised/use_cases.json';
import {
  UseCasesSection,
  InnerContainer,
  HeaderBlock,
  Subtitle,
  Title,
  Description,
  BentoGrid,
  BentoCell,
  IconBox,
  AppTitle,
  AppDesc
} from './EnterpriseUseCases.styles';

const iconMap: Record<string, React.ElementType> = {
  Headset,
  BadgeCheck,
  Users,
  Workflow,
};

const premiumEase = [0.16, 1, 0.3, 1] as const;

export function EnterpriseUseCases() {
  const { header, items } = useCasesData;

  return (
    <UseCasesSection>
      <InnerContainer>

        {/* ─── HEADER ENTRY ─── */}
        <HeaderBlock
          as={motion.div}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, ease: premiumEase }}
        >
          <Subtitle>// {header.subtitle}</Subtitle>
          <Title>{header.title}</Title>
          <Description>{header.description}</Description>
        </HeaderBlock>

        {/* ─── BENTO GRID ASSEBMLY ─── */}
        <BentoGrid
          as={motion.div}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } } // Cascading entrance
          }}
        >
          {items.map((item) => {
            const Icon = iconMap[item.icon];

            return (
              <BentoCell
                key={item.id}
                $layoutArea={item.layoutConfig}
                as={motion.div}
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.8, ease: premiumEase }
                  }
                }}
              >
                {/* Visual Anchor pushed to top */}
                <IconBox>
                  {Icon && <Icon />}
                </IconBox>

                {/* Content pinned gracefully to the bottom via CSS margin trick */}
                <div>
                  <AppTitle>{item.title}</AppTitle>
                  <AppDesc>{item.description}</AppDesc>
                </div>
              </BentoCell>
            );
          })}
        </BentoGrid>

      </InnerContainer>
    </UseCasesSection>
  );
}