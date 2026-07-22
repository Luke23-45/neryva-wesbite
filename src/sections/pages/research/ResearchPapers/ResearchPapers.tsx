import { useState, useMemo } from 'react';
import { useTheme } from 'styled-components';
import { motion } from 'framer-motion';
import { Link } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';
import { getPapers } from '@lib/data/research';
import type { Paper } from '@types';
import { Section } from '@/sections/common/layout/Section';
import { Container } from '@/sections/common/layout/Container';

import {
  Header,
  Title,
  FilterBar,
  FilterButton,
  EmptyState,
  EmptyTitle,
  EmptyText,
  List,
  YearGroup,
  YearHeader,
  PaperRow,
  PaperLeft,
  PaperTitle,
  PaperMeta,
  Authors,
  StatusBadge,
  VenueSpan,
  DateSpan,
  PaperArrow,
} from './ResearchPapers.styles';

// Premium hardware-accelerated easing (Apple-tier)
const premiumEase = [0.16, 1, 0.3, 1] as const;

// Create an animated version of the PaperRow to prevent DOM wrapper layout slop
const AnimatedPaperRow = motion(PaperRow);

const programLabels: Record<string, string> = {
  'language-systems': 'Language Systems',
  'robotics-task-transfer': 'Robotics',
  'biomedical-clinical-ai': 'Biomedical & Clinical',
  'energy-systems': 'Energy Systems',
  'computational-science': 'Computational Science',
};

const programAccents: Record<string, string> = {
  'language-systems': '#2458D3',
  'robotics-task-transfer': '#0B7F79',
  'biomedical-clinical-ai': '#1F7A4D',
  'energy-systems': '#D99100',
  'computational-science': '#8B5CF6',
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: premiumEase }
  },
};

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  },
};

function groupByYear(papers: Paper[]): Record<string, Paper[]> {
  const groups: Record<string, Paper[]> = {};
  for (const p of papers) {
    const year = p.date.slice(0, 4);
    if (!groups[year]) groups[year] = [];
    groups[year].push(p);
  }
  return groups;
}

export function ResearchPapers() {
  const theme = useTheme();
  const { items, earlyStageMessage } = getPapers();
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(
    () => (filter === 'all' ? items : items.filter((p) => p.program === filter)),
    [items, filter],
  );

  const isEmpty = items.length === 0;
  const filteredEmpty = !isEmpty && filtered.length === 0;
  const grouped = useMemo(() => groupByYear(filtered), [filtered]);

  return (
    <Section paddingYTop="md" paddingYBottom="lg" background={theme.colors.background.primary}>
      <Container variant="page">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
        >
          {/* ── Header & Editorial Filters ── */}
          <Header>
            <motion.div variants={fadeUp}>
              <Title>Papers & Preprints</Title>
            </motion.div>

            {!isEmpty && (
              <motion.div variants={fadeUp}>
                <FilterBar>
                  {['all', 'language-systems', 'robotics-task-transfer', 'biomedical-clinical-ai', 'energy-systems', 'computational-science'].map(
                    (id) => (
                      <FilterButton
                        key={id}
                        $active={filter === id}
                        // Fallback accent passed to satisfy styled-component prop types
                        $accent={programAccents[id] || theme.colors.text.primary}
                        onClick={() => setFilter(id)}
                      >
                        <span>{id === 'all' ? 'All Publications' : programLabels[id]}</span>
                      </FilterButton>
                    ),
                  )}
                </FilterBar>
              </motion.div>
            )}
          </Header>

          {/* ── Global Empty State ── */}
          {isEmpty && (
            <EmptyState
              as={motion.div}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: premiumEase }}
            >
              <EmptyTitle>Papers are on the way.</EmptyTitle>
              <EmptyText>{earlyStageMessage}</EmptyText>
              <EmptyText>
                In the meantime, explore our{' '}
                <Link
                  to="/research"
                  style={{
                    color: theme.colors.text.primary,
                    textDecoration: 'underline',
                    textUnderlineOffset: '4px'
                  }}
                >
                  research agenda
                </Link>.
              </EmptyText>
            </EmptyState>
          )}

          {/* ── Filter Empty State ── */}
          {filteredEmpty && (
            <EmptyState
              as={motion.div}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: premiumEase }}
            >
              <EmptyTitle>No papers for this program yet.</EmptyTitle>
              <EmptyText>Results will appear here as they become available and pass peer review.</EmptyText>
            </EmptyState>
          )}

          {/* ── Catalog List ── */}
          {!isEmpty && filtered.length > 0 && (
            <List>
              {Object.entries(grouped)
                .sort(([a], [b]) => Number(b) - Number(a))
                .map(([year, papers]) => (
                  <YearGroup key={year}>
                    <YearHeader
                      as={motion.div}
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, ease: premiumEase }}
                    >
                      {year}
                    </YearHeader>

                    {papers.map((paper, i) => (
                      <AnimatedPaperRow
                        key={paper.title}
                        // Casts the component to Link if URL exists, maintaining correct DOM structure
                        // @ts-expect-error TS complains about 'as' with framer-motion and styled-components
                        as={paper.url ? Link : 'div'}
                        to={paper.url || undefined}
                        $accent={programAccents[paper.program] || theme.colors.text.primary}

                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.6,
                          ease: premiumEase,
                          delay: i * 0.05, // Elegant cascading entrance
                        }}
                      >
                        <DateSpan>{paper.date.substring(0, 7)}</DateSpan>

                        <PaperLeft>
                          <PaperTitle>{paper.title}</PaperTitle>
                          <Authors>{paper.authors.join(', ')}</Authors>
                        </PaperLeft>

                        <PaperMeta>
                          <StatusBadge $status={paper.status}>
                            {paper.status}
                          </StatusBadge>
                          {paper.venue && (
                            <VenueSpan>
                              {paper.venue}
                            </VenueSpan>
                          )}
                        </PaperMeta>

                        {paper.url ? (
                          <PaperArrow>
                            <ArrowRight size={18} strokeWidth={1.5} />
                          </PaperArrow>
                        ) : <div />}
                      </AnimatedPaperRow>
                    ))}
                  </YearGroup>
                ))}
            </List>
          )}
        </motion.div>
      </Container>
    </Section>
  );
}