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
  LocationText,
  EmailFallback,
} from './CareersRoles.styles';
import CyclicNextButton from '@components/common/ui/CyclicNextButton/CyclicNextButton';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const PixelRightArrow = () => (
  <svg viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
    <rect x="4" y="1" width="2" height="2" />
    <rect x="6" y="3" width="2" height="2" />
    <rect x="8" y="5" width="2" height="2" />
    <rect x="10" y="6" width="2" height="2" />
    <rect x="8" y="7" width="2" height="2" />
    <rect x="6" y="9" width="2" height="2" />
    <rect x="4" y="11" width="2" height="2" />
  </svg>
);

interface Position {
  title: string;
  location: string;
  type: string;
  description: string;
  applyLink?: string;
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
  const [showEmailFor, setShowEmailFor] = useState<string | null>(null);

  const toggleRole = (title: string) => {
    setOpenRole(openRole === title ? null : title);
    setShowEmailFor(null);
  };

  const handleApplyClick = (pos: Position) => {
    if (pos.applyLink) {
      window.location.href = pos.applyLink;
    } else {
      setShowEmailFor(pos.title);
    }
  };

  return (
    <Section paddingY="none" background={theme.colors.background.secondary}>
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
                            <RoleMeta>{pos.type}</RoleMeta>
                            <RoleArrow $isOpen={isOpen} aria-hidden="true">
                              <PixelRightArrow />
                            </RoleArrow>
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
                                  <div>
                                    <LocationText>Location: {pos.location}</LocationText>
                                    <AccordionDesc>{pos.description}</AccordionDesc>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <AnimatePresence mode="wait">
                                      {showEmailFor === pos.title ? (
                                        <motion.div
                                          key="email"
                                          initial={{ opacity: 0, x: -10 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          exit={{ opacity: 0, x: 10 }}
                                          transition={{ duration: 0.3, ease: 'easeOut' }}
                                        >
                                          <EmailFallback href="mailto:jobs@neryva.com">
                                            Send CV to <span>jobs@neryva.com</span>
                                          </EmailFallback>
                                        </motion.div>
                                      ) : (
                                        <motion.div
                                          key="button"
                                          initial={{ opacity: 0, x: -10 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          exit={{ opacity: 0, x: 10 }}
                                          transition={{ duration: 0.3, ease: 'easeOut' }}
                                        >
                                          <CyclicNextButton 
                                            label="Apply for this role" 
                                            onClick={() => handleApplyClick(pos)} 
                                          />
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
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
