import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ArrowRight, PlayCircle } from 'lucide-react';
import eventData from '@neryva_data/events/sections/events_list.json';
import event1Img from '@assets/page/event/event1.jpg';
import event2Img from '@assets/page/event/event2.jpg';
import event3Img from '@assets/page/event/event3.jpg';

const eventImages: Record<string, string> = {
  '/assets/page/event/event1.jpg': event1Img,
  '/assets/page/event/event2.jpg': event2Img,
  '/assets/page/event/event3.jpg': event3Img,
};

import {
  Wrapper,
  InnerGrid,
  FiltersContainer,
  FilterGroup,
  FilterLabel,
  ControlsRow,
  SlantedTab,
  DropdownContainer,
  DropdownHeader,
  DropdownList,
  DropdownItem,
  CardMatrix,
  EventCard,
  VisualHeader,
  BodyPayload,
  MetaLine,
  CardTitle,
  InteractionButton
} from './EventsList.styles';

const premiumEase = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: premiumEase, delay: custom * 0.1 },
  }),
};

function FilterDropdown({ options, activeOption, defaultLabel, onSelect }: { options: string[], activeOption: string, defaultLabel: string, onSelect: (val: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = options.includes(activeOption);
  const displayLabel = isActive ? activeOption : defaultLabel;

  return (
    <DropdownContainer ref={containerRef}>
      <DropdownHeader $isOpen={isOpen} $isActive={isActive} onClick={() => setIsOpen(!isOpen)}>
        <span>{displayLabel}</span>
        <ChevronDown size={16} strokeWidth={2} color={isActive ? "#ffffff" : "#64748b"} style={{ transform: isOpen ? 'skewX(14deg) rotate(180deg)' : 'skewX(14deg)', transition: 'transform 0.2s ease' }} />
      </DropdownHeader>

      <AnimatePresence>
        {isOpen && (
          <DropdownList
            as={motion.div}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {/* Always provide the default "All" option to clear selection if we are acting as a filter */}
            <DropdownItem $selected={!isActive && activeOption === defaultLabel} onClick={() => { onSelect(defaultLabel); setIsOpen(false); }}>
              {defaultLabel}
            </DropdownItem>
            {options.map((opt) => (
              <DropdownItem key={opt} $selected={activeOption === opt} onClick={() => { onSelect(opt); setIsOpen(false); }}>
                {opt}
              </DropdownItem>
            ))}
          </DropdownList>
        )}
      </AnimatePresence>
    </DropdownContainer>
  );
}

export function EventsList() {
  const [activeType, setActiveType] = useState('All Types');
  const [activeLoc, setActiveLoc] = useState('All Cities');
  const [activeTiming, setActiveTiming] = useState('All Timing');

  const filteredEvents = eventData.events.filter((evt) => {
    const matchType = activeType === 'All Types' || evt.type === activeType;
    const matchLoc = activeLoc === 'All Cities' || evt.format === activeLoc;
    const matchTiming = activeTiming === 'All Timing' || (activeTiming.toLowerCase() === evt.status);
    return matchType && matchLoc && matchTiming;
  });

  // Split logic as per screenshot
  const typeTabs = ['Business', 'Technical', 'Research'];
  const typeDropdownOptions = eventData.filters.types.filter(t => !typeTabs.includes(t) && t !== 'All Types');

  const locTabs = ['In-person', 'Online'];
  const locDropdownOptions = eventData.filters.locations.filter(l => !locTabs.includes(l) && l !== 'All Cities');

  return (
    <Wrapper id="events">
      <InnerGrid>

        {/* ─── COMMAND CENTER: EXACT PIXEL MATCH ─── */}
        <FiltersContainer
          as={motion.div}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-50px' }}
        >

          <FilterGroup>
            <FilterLabel>Event Type</FilterLabel>
            <ControlsRow>
              {typeTabs.map((type) => (
                <SlantedTab
                  key={type}
                  $active={activeType === type}
                  onClick={() => setActiveType(type)}
                >
                  <span>{type}</span>
                </SlantedTab>
              ))}
              <FilterDropdown
                options={typeDropdownOptions}
                activeOption={activeType}
                defaultLabel="All Types"
                onSelect={setActiveType}
              />
            </ControlsRow>
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>Location</FilterLabel>
            <ControlsRow>
              {locTabs.map((loc) => (
                <SlantedTab
                  key={loc}
                  $active={activeLoc === loc}
                  onClick={() => setActiveLoc(loc)}
                >
                  <span>{loc}</span>
                </SlantedTab>
              ))}
              <FilterDropdown
                options={locDropdownOptions}
                activeOption={activeLoc}
                defaultLabel="All Cities"
                onSelect={setActiveLoc}
              />
            </ControlsRow>
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>Timing</FilterLabel>
            <ControlsRow>
              {eventData.filters.timing.map((timing) => (
                <SlantedTab
                  key={timing}
                  $active={activeTiming === timing}
                  onClick={() => setActiveTiming(timing)}
                >
                  <span>{timing}</span>
                </SlantedTab>
              ))}
            </ControlsRow>
          </FilterGroup>

        </FiltersContainer>


        {/* ─── CINEMATIC CARD RENDERER ─── */}
        <CardMatrix>
          {filteredEvents.length > 0 ? (
            filteredEvents.map((evt, idx) => (
              <motion.div
                key={evt.id}
                custom={idx}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                style={{ display: 'flex' }}
              >
                <EventCard href="#!">

                  {/* Visual Asset Wrapper */}
                  <VisualHeader>
                    {/* <FloatTag>{evt.type}</FloatTag> */}
                    {evt.image ? (
                      <img src={eventImages[evt.image] || evt.image} alt={evt.title} loading="lazy" />
                    ) : null}
                  </VisualHeader>

                  <BodyPayload>
                    <MetaLine>{evt.date} &mdash; {evt.format}</MetaLine>
                    <CardTitle>{evt.title}</CardTitle>

                    {evt.status === 'upcoming' ? (
                      <InteractionButton $status="upcoming">
                        Join Registration <ArrowRight />
                      </InteractionButton>
                    ) : (
                      <InteractionButton $status="past">
                        Watch Replay <PlayCircle />
                      </InteractionButton>
                    )}
                  </BodyPayload>

                </EventCard>
              </motion.div>
            ))
          ) : (
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#64748b' }}>
              No events found matching the selected filters.
            </motion.div>
          )}
        </CardMatrix>

      </InnerGrid>
    </Wrapper>
  );
}