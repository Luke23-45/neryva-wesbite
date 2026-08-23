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
  Star,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { EmptyState } from '@components/common/ui/EmptyState';
import { SearchField } from '@components/common/ui/SearchField';
import { ActionButton } from '@components/common/ui/ActionButton';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { pageItem } from '@styles/motion';
import templates from '@neryva_data/products/agent_studio/templates.json';
import {
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
  ModelName,
  Integrations,
  IntegrationPill,
  Footer,
  Stats,
  RatingStar,
} from './TemplatesView.styles';

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
    <ViewShell>
      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewHeader>
          <ViewTitle>Templates</ViewTitle>
          <ViewSubtitle>
            Pre-built agent templates for common use cases. Clone one, customize it, and ship in
            minutes instead of days.
          </ViewSubtitle>
        </ViewHeader>
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search templates…"
          ariaLabel="Search templates"
          width={240}
        />
      </ViewHeaderRow>

      <FilterBar as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={1}>
        {templates.categories.map((c) => (
          <FilterPill
            key={c.id}
            type="button"
            $active={active === c.id}
            aria-pressed={active === c.id}
            onClick={() => setActive(c.id)}
          >
            {c.label}
            <Count $active={active === c.id}>{c.count}</Count>
          </FilterPill>
        ))}
      </FilterBar>

      {list.length === 0 ? (
        <EmptyState
          icon={<Sparkles size={26} strokeWidth={1.5} />}
          title="No templates match"
          description="Try a different category or search term."
        />
      ) : (
        <TemplateGrid>
          {list.map((t, i) => {
            const Icon = ICONS[t.icon as keyof typeof ICONS];
            return (
              <TemplateCard
                key={t.id}
                as={motion.div}
                initial="hidden"
                animate="visible"
                variants={pageItem}
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
                  <MetaItem>
                    Default model · <ModelName>{t.model}</ModelName>
                  </MetaItem>
                </Meta>
                <Integrations>
                  {t.integrations.map((integration) => (
                    <IntegrationPill key={integration}>{integration}</IntegrationPill>
                  ))}
                </Integrations>
                <Footer>
                  <Stats>
                    <span>
                      <RatingStar aria-hidden="true">
                        <Star size={10} strokeWidth={1.7} />
                      </RatingStar>
                      {t.rating}
                    </span>
                    <span>{t.uses.toLocaleString()} uses</span>
                  </Stats>
                  <ActionButton
                    variant="secondary"
                    size="sm"
                    onClick={() => toast.success(`${t.name} template cloned — configure it now`)}
                  >
                    Use template
                    <ArrowRight size={11} strokeWidth={1.8} />
                  </ActionButton>
                </Footer>
              </TemplateCard>
            );
          })}
        </TemplateGrid>
      )}
    </ViewShell>
  );
}
