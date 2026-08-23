import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Headphones,
  Compass,
  Receipt,
  BookOpen,
  Search,
  Filter,
  Calculator,
  ChartBar,
  Binoculars,
  Wrench,
  Terminal,
  Database,
  Search as SearchIcon,
  Star,
  ArrowRight,
} from 'lucide-react';
import templates from '@neryva_data/products/agent_studio/templates.json';
import {
  PageRoot,
  PageHeader,
  TitleBlock,
  PageTitle,
  PageSubtitle,
  SearchBox,
  SearchInput,
  FilterBar,
  FilterPill,
  Count,
  TemplateGrid,
  TemplateCard,
  CardTop,
  IconBox,
  FeaturedBadge,
  Name,
  Description,
  Meta,
  MetaItem,
  Integrations,
  IntegrationPill,
  Footer,
  Stats,
  UseBtn,
} from './TemplatesView.styles';

const premiumEase = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: premiumEase, delay: i * 0.04 },
  }),
};

const ICONS = {
  headphones: Headphones,
  compass: Compass,
  receipt: Receipt,
  book: BookOpen,
  search: Search,
  filter: Filter,
  calculator: Calculator,
  chart: ChartBar,
  binoculars: Binoculars,
  wrench: Wrench,
  terminal: Terminal,
  database: Database,
} as const;

export function TemplatesView() {
  const [active, setActive] = useState('all');
  const [query, setQuery] = useState('');

  const list = templates.templates.filter((t) => {
    if (active !== 'all' && t.category !== active) return false;
    if (query && !t.name.toLowerCase().includes(query.toLowerCase()) && !t.description.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <PageRoot>
      <PageHeader as={motion.div} initial="hidden" animate="visible" variants={fadeUp} custom={0}>
        <TitleBlock>
          <PageTitle>Templates</PageTitle>
          <PageSubtitle>
            Pre-built agent templates for common use cases. Clone one, customize it, and ship in
            minutes instead of days.
          </PageSubtitle>
        </TitleBlock>
        <SearchBox>
          <SearchIcon size={13} strokeWidth={1.7} style={{ color: 'rgba(229, 231, 235, 0.55)' }} />
          <SearchInput placeholder="Search templates…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </SearchBox>
      </PageHeader>

      <FilterBar as={motion.div} initial="hidden" animate="visible" variants={fadeUp} custom={1}>
        {templates.categories.map((c) => (
          <FilterPill key={c.id} type="button" $active={active === c.id} onClick={() => setActive(c.id)}>
            {c.label}
            <Count>{c.count}</Count>
          </FilterPill>
        ))}
      </FilterBar>

      <TemplateGrid>
        {list.map((t, i) => {
          const Icon = ICONS[t.icon as keyof typeof ICONS];
          return (
            <TemplateCard
              key={t.id}
              as={motion.div}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={i + 2}
            >
              <CardTop>
                <IconBox $tone={t.tone}>
                  <Icon size={18} strokeWidth={1.7} />
                </IconBox>
                {t.featured && <FeaturedBadge>Featured</FeaturedBadge>}
              </CardTop>
              <Name>{t.name}</Name>
              <Description>{t.description}</Description>
              <Meta>
                <MetaItem>Default model · <span style={{ color: 'rgba(229, 231, 235, 0.85)' }}>{t.model}</span></MetaItem>
              </Meta>
              <Integrations>
                {t.integrations.map((i) => (
                  <IntegrationPill key={i}>{i}</IntegrationPill>
                ))}
              </Integrations>
              <Footer>
                <Stats>
                  <span>
                    <Star size={10} strokeWidth={1.7} style={{ color: '#fbbf24', marginRight: 2 }} />
                    {t.rating}
                  </span>
                  <span>{t.uses.toLocaleString()} uses</span>
                </Stats>
                <UseBtn
                  type="button"
                  onClick={() => toast.success(`${t.name} template cloned — configure it now`)}
                >
                  Use template
                  <ArrowRight size={11} strokeWidth={1.8} />
                </UseBtn>
              </Footer>
            </TemplateCard>
          );
        })}
      </TemplateGrid>
    </PageRoot>
  );
}
