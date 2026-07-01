import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TextLink } from '@/components/common/ui/TextLink';
import { CardVisual } from '@/components/common/ui/CardVisual';
import homeUpdatesData from '@data/pages/home/home_updates.json';
import {
  Wrapper,
  Inner,
  HeaderRow,
  HeaderLeft,
  SectionLabel,
  SectionTitle,
  ControlsContainer,
  ControlButton,
  QueueViewport,
  QueueTrack,
  UpdateCard,
  CardVisualWrapper,
  CardMeta,
  CardTag,
  CardTitle,
  CardDescription,
  CardFooter,
  CardDate,
  CardFooterArrow,
} from './HomeLatestWork.styles';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}

export function HomeLatestWork() {
  const { heading, items } = homeUpdatesData;
  const [startIndex, setStartIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const visibleCount = 3;

  const handleNext = useCallback(() => {
    setStartIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const handlePrev = useCallback(() => {
    setStartIndex((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  // Auto-advance every 5 seconds, pauses on hover
  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(handleNext, 5000);
    return () => clearInterval(interval);
  }, [handleNext, isHovered]);

  // Build the visible window
  const visibleItems = Array.from({ length: visibleCount }, (_, i) => {
    const index = (startIndex + i) % items.length;
    return { ...items[index], _uniqueKey: `${items[index].id}-${startIndex + i}` };
  });

  return (
    <Wrapper>
      <Inner>
        {/* Header */}
        <HeaderRow
          as={motion.div}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
        >
          <HeaderLeft>
            <motion.div variants={fadeUp}>
              <SectionLabel>{heading.label}</SectionLabel>
            </motion.div>
            <motion.div variants={fadeUp}>
              <SectionTitle>{heading.title}</SectionTitle>
            </motion.div>
          </HeaderLeft>

          <ControlsContainer as={motion.div} variants={fadeUp}>
            <TextLink to="/research" style={{ marginRight: 24 }}>
              See all updates
            </TextLink>
            <ControlButton onClick={handlePrev} aria-label="Previous">
              <ChevronLeft size={20} />
            </ControlButton>
            <ControlButton onClick={handleNext} aria-label="Next">
              <ChevronRight size={20} />
            </ControlButton>
          </ControlsContainer>
        </HeaderRow>

        {/* Queue */}
        <QueueViewport
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <QueueTrack>
            <AnimatePresence mode="popLayout">
              {visibleItems.map((item) => (
                <UpdateCard
                  key={item._uniqueKey}
                  to={item.link}
                  $accent={item.accent}
                  as={motion.a}
                  layout
                  initial={{ opacity: 0, x: 80, scale: 0.97 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -80, scale: 0.97, filter: 'blur(3px)' }}
                  transition={{ type: 'spring', stiffness: 220, damping: 28, mass: 0.9 }}
                >
                  {/* Row 1: Mosaic thumbnail */}
                  <CardVisualWrapper>
                    <CardVisual accent={item.accent} title={item.title} />
                  </CardVisualWrapper>

                  {/* Row 2: Tag pill */}
                  <CardMeta>
                    <CardTag $accent={item.accent}>{item.tag}</CardTag>
                  </CardMeta>

                  {/* Row 3: Title + Description */}
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>

                  {/* Row 4: Date (left) + Arrow (right) */}
                  <CardFooter>
                    <CardDate>{item.date}</CardDate>
                    <CardFooterArrow>
                      <ArrowIcon />
                    </CardFooterArrow>
                  </CardFooter>
                </UpdateCard>
              ))}
            </AnimatePresence>
          </QueueTrack>
        </QueueViewport>
      </Inner>
    </Wrapper>
  );
}
