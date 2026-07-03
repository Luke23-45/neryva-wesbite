import { motion } from 'framer-motion';
import { Section } from '@/sections/common/layout/Section';
import { Container } from '@/sections/common/layout/Container';
import { theme } from '@/styles/theme';
import {
  BorderTop,
  SectionHeader,
  Label,
  Title,
  EventGroup,
  GroupName,
  EventListContainer,
  EventRow,
  EventDate,
  EventDetails,
  EventTitle,
  EventDesc,
  EventMetaGroup,
  EventMetaLabel,
  EventMetaValue,
  ActionColumn,
  RegisterButton,
} from './EventsList.styles';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] as any } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

interface Event {
  id: string;
  date: string;
  title: string;
  location: string;
  type: string;
  description: string;
  link: string;
}

interface EventGroupData {
  name: string;
  events: Event[];
}

interface Props {
  data: {
    label: string;
    title: string;
    groups: EventGroupData[];
  };
}

export function EventsList({ data }: Props) {
  return (
    <Section paddingY="lg" background={theme.colors.background.secondary} id="events">
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
              {data.groups.map((group) => (
                <EventGroup as={motion.div} variants={fadeUp} key={group.name}>
                  <GroupName>{group.name}</GroupName>
                  <EventListContainer>
                    {group.events.map((event) => (
                      <EventRow key={event.id}>
                        <EventDate>{event.date}</EventDate>
                        
                        <EventDetails>
                          <EventTitle>{event.title}</EventTitle>
                          <EventDesc>{event.description}</EventDesc>
                        </EventDetails>
                        
                        <EventMetaGroup>
                          <EventMetaLabel>Location</EventMetaLabel>
                          <EventMetaValue>{event.location}</EventMetaValue>
                          <EventMetaLabel style={{ marginTop: '8px' }}>Type</EventMetaLabel>
                          <EventMetaValue>{event.type}</EventMetaValue>
                        </EventMetaGroup>
                        
                        <ActionColumn>
                          <RegisterButton href={event.link}>
                            {group.name === 'Past Events' ? 'Watch Replay' : 'Register'}
                          </RegisterButton>
                        </ActionColumn>
                      </EventRow>
                    ))}
                  </EventListContainer>
                </EventGroup>
              ))}
            </div>
          </motion.div>
        </Container>
      </BorderTop>
    </Section>
  );
}
