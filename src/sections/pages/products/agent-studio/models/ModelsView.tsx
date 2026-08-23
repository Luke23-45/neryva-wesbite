import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Cpu, ArrowRight, Settings as SettingsIcon } from 'lucide-react';
import { ProgressBar } from '@components/common/ui/ProgressBar';
import { StatusPill } from '@components/common/ui/StatusPill';
import { Switch } from '@components/common/ui/Switch';
import { ViewShell, ViewHeader, ViewTitle, ViewSubtitle, SectionTitle } from '@components/common/ui/ViewLayout';
import { pageItem } from '@styles/motion';
import models from '@neryva_data/products/agent_studio/models.json';
import {
  RoutingCard,
  RoutingLeft,
  RoutingTitle,
  RoutingMeta,
  RoutingBadges,
  RoutingBadge,
  RoutingArrow,
  ModelGrid,
  ModelCard,
  ModelTop,
  ModelInfo,
  ModelName,
  PrimaryTag,
  ModelProvider,
  KindBadge,
  MetricsGrid,
  MetricCell,
  MetricLabel,
  MetricValue,
  QualityBar,
  QualityHeader,
  QualityValue,
  ModelFoot,
  ModelUpdated,
  ProviderGrid,
  ProviderCard,
  ProviderTop,
  ProviderName,
  ProviderMeta,
} from './ModelsView.styles';

const toneToGradient: Record<string, 'emerald' | 'azure' | 'lilac' | 'amber'> = {
  emerald: 'emerald',
  azure: 'azure',
  warning: 'amber',
};

export function ModelsView() {
  const [autoRoute, setAutoRoute] = useState(models.routing.autoRoute);

  return (
    <ViewShell>
      <ViewHeader as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewTitle>Models</ViewTitle>
        <ViewSubtitle>
          The models available to your agents. Configure routing rules, fallbacks, and per-agent
          preferences.
        </ViewSubtitle>
      </ViewHeader>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <RoutingCard>
          <RoutingLeft>
            <RoutingTitle>
              <SettingsIcon size={14} strokeWidth={1.7} />
              Routing policy
            </RoutingTitle>
            <RoutingMeta>
              {models.routing.rulesCount} rules · auto-route {autoRoute ? 'enabled' : 'disabled'}
            </RoutingMeta>
          </RoutingLeft>
          <RoutingBadges>
            <RoutingBadge $variant="primary">
              <Cpu size={11} strokeWidth={1.7} />
              default · {models.routing.default}
            </RoutingBadge>
            <RoutingArrow aria-hidden="true">
              <ArrowRight size={11} strokeWidth={1.7} />
            </RoutingArrow>
            <RoutingBadge $variant="default">fallback · {models.routing.fallback}</RoutingBadge>
          </RoutingBadges>
          <Switch
            checked={autoRoute}
            onChange={(next) => {
              setAutoRoute(next);
              toast.success(`Auto-routing ${next ? 'enabled' : 'disabled'}`);
            }}
            aria-label="Toggle auto-routing"
          />
        </RoutingCard>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
        <SectionTitle>
          <Cpu size={14} strokeWidth={1.7} />
          Available models
        </SectionTitle>
        <ModelGrid>
          {models.models.map((m, i) => (
            <ModelCard
              key={m.id}
              as={motion.div}
              initial="hidden"
              animate="visible"
              variants={pageItem}
              custom={i + 3}
            >
              <ModelTop>
                <ModelInfo>
                  <ModelName>
                    {m.name}
                    {m.primary && <PrimaryTag>Primary</PrimaryTag>}
                  </ModelName>
                  <ModelProvider>{m.provider}</ModelProvider>
                </ModelInfo>
                <KindBadge>{m.kind}</KindBadge>
              </ModelTop>
              <MetricsGrid>
                <MetricCell>
                  <MetricLabel>Context</MetricLabel>
                  <MetricValue>{m.context}</MetricValue>
                </MetricCell>
                <MetricCell>
                  <MetricLabel>Latency</MetricLabel>
                  <MetricValue>{m.latency}</MetricValue>
                </MetricCell>
                <MetricCell>
                  <MetricLabel>Throughput</MetricLabel>
                  <MetricValue>{m.throughput}</MetricValue>
                </MetricCell>
                <MetricCell>
                  <MetricLabel>Cost in/out</MetricLabel>
                  <MetricValue>
                    {m.costInput}
                    <br />
                    {m.costOutput}
                  </MetricValue>
                </MetricCell>
              </MetricsGrid>
              <QualityBar>
                <QualityHeader>
                  <span>Quality score</span>
                  <QualityValue>{m.quality} / 100</QualityValue>
                </QualityHeader>
                <ProgressBar value={m.quality} tone={toneToGradient[m.tone] ?? 'azure'} />
              </QualityBar>
              <ModelFoot>
                <StatusPill tone={m.tone === 'emerald' ? 'success' : 'azure'}>
                  {m.status}
                </StatusPill>
                <ModelUpdated>Updated 2 days ago</ModelUpdated>
              </ModelFoot>
            </ModelCard>
          ))}
        </ModelGrid>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={11}>
        <SectionTitle>
          <Cpu size={14} strokeWidth={1.7} />
          Providers
        </SectionTitle>
        <ProviderGrid>
          {models.providers.map((p, i) => (
            <ProviderCard
              key={p.name}
              as={motion.div}
              initial="hidden"
              animate="visible"
              variants={pageItem}
              custom={i + 12}
            >
              <ProviderTop>
                <ProviderName>{p.name}</ProviderName>
                <StatusPill
                  tone={p.status === 'primary' ? 'success' : p.tone === 'emerald' ? 'emerald' : 'neutral'}
                  dot={false}
                >
                  {p.status}
                </StatusPill>
              </ProviderTop>
              <ProviderMeta>
                {p.models} models · {p.region}
              </ProviderMeta>
            </ProviderCard>
          ))}
        </ProviderGrid>
      </motion.div>
    </ViewShell>
  );
}
