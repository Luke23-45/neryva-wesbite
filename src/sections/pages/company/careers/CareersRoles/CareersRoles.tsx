import { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Section } from '@/sections/common/layout/Section';
import { Container } from '@/sections/common/layout/Container';
import { theme } from '@/styles/theme';
import {
  BorderTop,
  SectionHeader,
  Label,
  Title,
  DepartmentGroup,
  DepartmentName,
  RoleList,
  RoleRow,
  RoleTitle,
  RoleMeta,
  RoleArrow,
  AccordionBody,
  AccordionContent,
  AccordionDesc,
  ApplyButton,
} from './CareersRoles.styles';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

interface Position {
  title: string;
  location: string;
  type: string;
  description: string;
}

interface Department {
  name: string;
  positions: Position[];
}

interface Props {
  data: {
    label: string;
    title: string;
    departments: Department[];
  };
}

export function CareersRoles({ data }: Props) {
  const [openRole, setOpenRole] = useState<string | null>(null);

  const toggleRole = (title: string) => {
    setOpenRole(openRole === title ? null : title);
  };

  return (
    <Section paddingY="lg" background={theme.colors.background.secondary}>
      <BorderTop>
        <Container>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={stagger}>
            <SectionHeader>
              <motion.div variants={fadeUp}>
                <Label>{data.label}</Label>
              </motion.div>
              <motion.div variants={fadeUp}>
                <Title>{data.title}</Title>
              </motion.div>
            </SectionHeader>

            <div>
              {data.departments.map((dept) => (
                <DepartmentGroup variants={fadeUp} key={dept.name}>
                  <DepartmentName>{dept.name}</DepartmentName>
                  <RoleList>
                    {dept.positions.map((pos) => {
                      const isOpen = openRole === pos.title;
                      
                      return (
                        <div key={pos.title}>
                          <RoleRow onClick={() => toggleRole(pos.title)} $isOpen={isOpen} aria-expanded={isOpen}>
                            <RoleTitle>{pos.title}</RoleTitle>
                            <RoleMeta>{pos.location}</RoleMeta>
                            <RoleMeta>{pos.type}</RoleMeta>
                            <RoleArrow $isOpen={isOpen} aria-hidden="true">→</RoleArrow>
                          </RoleRow>
                          
                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <AccordionBody
                                as={motion.div}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                              >
                                <AccordionContent>
                                  <AccordionDesc>{pos.description}</AccordionDesc>
                                  <ApplyButton href="#apply">Apply for this role</ApplyButton>
                                </AccordionContent>
                              </AccordionBody>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </RoleList>
                </DepartmentGroup>
              ))}
            </div>
          </motion.div>
        </Container>
      </BorderTop>
    </Section>
  );
}
