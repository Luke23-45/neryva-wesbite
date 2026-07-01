import { motion } from 'framer-motion';
import {
  Wrapper,
  Inner,
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
} from './CareersRoles.styles';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

interface Position {
  title: string;
  location: string;
  type: string;
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
  return (
    <Wrapper>
      <Inner>
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
              <DepartmentGroup as={motion.div} variants={fadeUp} key={dept.name}>
                <DepartmentName>{dept.name}</DepartmentName>
                <RoleList>
                  {dept.positions.map((pos) => (
                    <RoleRow key={pos.title} href="#">
                      <RoleTitle>{pos.title}</RoleTitle>
                      <RoleMeta>{pos.location}</RoleMeta>
                      <RoleMeta>{pos.type}</RoleMeta>
                      <RoleArrow aria-hidden="true">→</RoleArrow>
                    </RoleRow>
                  ))}
                </RoleList>
              </DepartmentGroup>
            ))}
          </div>
        </motion.div>
      </Inner>
    </Wrapper>
  );
}
