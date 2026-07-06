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
  EmptyRule,
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
  DateSpan,
  PaperArrow,
} from './ResearchPapers.styles';

const programLabels: Record<string, string> = {
  'large-language-models': 'LLM',
  'robotics-task-transfer': 'Robotics',
  'clinical-ai': 'Clinical',
  'energy-engineering-optimization': 'Energy',
};

const programAccents: Record<string, string> = {
  'large-language-models': '#2458D3',
  'robotics-task-transfer': '#0B7F79',
  'clinical-ai': '#1F7A4D',
  'energy-engineering-optimization': '#D99100',
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] as const } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
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
  //paddingYTop="md" paddingYBottom="none"
  return (
    <Section paddingY="md" background={theme.colors.background.primary}>
      <Container>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={stagger}>
          <Header>
            <motion.div variants={fadeUp}>
              <Title>Papers & Preprints</Title>
            </motion.div>

            {!isEmpty && (
              <motion.div variants={fadeUp}>
                <FilterBar>
                  {['all', 'large-language-models', 'robotics-task-transfer', 'clinical-ai', 'energy-engineering-optimization'].map(
                    (id) => (
                      <FilterButton
                        key={id}
                        $active={filter === id}
                        $accent={programAccents[id] || '#64748B'}
                        onClick={() => setFilter(id)}
                      >
                        {id === 'all' ? 'All' : programLabels[id]}
                      </FilterButton>
                    ),
                  )}
                </FilterBar>
              </motion.div>
            )}
          </Header>

          {isEmpty && (
            <EmptyState
              as={motion.div}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] as const }}
            >
              <EmptyTitle>Papers are on the way.</EmptyTitle>
              <EmptyRule />
              <EmptyText>{earlyStageMessage}</EmptyText>
              <EmptyText>
                In the meantime, explore our{' '}
                <Link to="/research" style={{ color: '#14B8A6', textDecoration: 'none' }}>
                  research agenda
                </Link>
                .
              </EmptyText>
            </EmptyState>
          )}

          {filteredEmpty && (
            <EmptyState
              as={motion.div}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] as const }}
            >
              <EmptyTitle>No papers for this program yet.</EmptyTitle>
              <EmptyRule />
              <EmptyText>Results will appear here as they become available.</EmptyText>
            </EmptyState>
          )}

          {!isEmpty && filtered.length > 0 && (
            <List>
              {Object.entries(grouped)
                .sort(([a], [b]) => Number(b) - Number(a))
                .map(([year, papers]) => (
                  <YearGroup key={year}>
                    <YearHeader
                      as={motion.div}
                      initial={{ opacity: 0, x: -8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] as const }}
                    >
                      {year}
                    </YearHeader>
                    {papers.map((paper, i) => (
                      <motion.div
                        key={paper.title}
                        initial={{ opacity: 0, y: 8 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.4,
                          ease: [0.2, 0, 0, 1] as const,
                          delay: i * 0.04,
                        }}
                      >
                        <PaperRow
                          as={paper.url ? Link : 'div'}
                          to={paper.url || '#'}
                          $accent={programAccents[paper.program] || '#64748B'}
                        >
                          <PaperLeft>
                            <PaperTitle>{paper.title}</PaperTitle>
                            <PaperMeta>
                              <Authors>{paper.authors.join(', ')}</Authors>
                              <StatusBadge $status={paper.status} $accent={programAccents[paper.program] || '#64748B'}>
                                {paper.status}
                              </StatusBadge>
                              <DateSpan>{paper.date}</DateSpan>
                              {paper.venue && (
                                <span style={{ color: '#64748B' }}>{paper.venue}</span>
                              )}
                            </PaperMeta>
                          </PaperLeft>
                          {paper.url && (
                            <PaperArrow>
                              <ArrowRight size={14} />
                            </PaperArrow>
                          )}
                        </PaperRow>
                      </motion.div>
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
