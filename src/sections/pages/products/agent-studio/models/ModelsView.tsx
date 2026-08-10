import { motion } from 'framer-motion';
import { Cpu, ArrowRight, Settings as SettingsIcon } from 'lucide-react';
import { ProgressBar } from '@components/common/ui/ProgressBar';
import { StatusPill } from '@components/common/ui/StatusPill';
import { Switch } from '@components/common/ui/Switch';
import models from '@neryva_data/products/agent_studio/models.json';
import {
  PageRoot,
  PageHeader,
  PageTitle,
  PageSubtitle,
  RoutingCard,
  RoutingLeft,
  RoutingTitle,
  RoutingMeta,
  RoutingBadges,
  RoutingBadge,
  SectionTitle,
  ModelGrid,
  ModelCard,
  ModelTop,
  ModelInfo,
  ModelName,
  ModelProvider,
  KindBadge,
  MetricsGrid,
  MetricCell,
  MetricLabel,
  MetricValue,
  QualityBar,
  QualityHeader,
  QualityValue,
  ProviderGrid,
  ProviderCard,
  ProviderTop,
  ProviderName,
  ProviderMeta,
} from './ModelsView.styles';

const premiumEase = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: premiumEase, delay: i * 0.05 },
  }),
};

const toneToGradient: Record<string, 'emerald' | 'azure' | 'lilac' | 'amber'> = {
  emerald: 'emerald',
  azure: 'azure',
  warning: 'amber',
};

export function ModelsView() {
  return (
    <PageRoot>
      <PageHeader as={motion.div} initial="hidden" animate="visible" variants={fadeUp} custom={0}>
        <PageTitle>Models</PageTitle>
        <PageSubtitle>
          The models available to your agents. Configure routing rules, fallbacks, and per-agent
          preferences.
        </PageSubtitle>
      </PageHeader>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
        <RoutingCard>
          <RoutingLeft>
            <RoutingTitle>
              <SettingsIcon size={14} strokeWidth={1.7} />
              Routing policy
            </RoutingTitle>
            <RoutingMeta>
              {models.routing.rulesCount} rules · auto-route{' '}
              {models.routing.autoRoute ? 'enabled' : 'disabled'}
            </RoutingMeta>
          </RoutingLeft>
          <RoutingBadges>
            <RoutingBadge $variant="primary">
              <Cpu size={11} strokeWidth={1.7} />
              default · {models.routing.default}
            </RoutingBadge>
            <span style={{ color: 'rgba(229, 231, 235, 0.45)' }}>
              <ArrowRight size={11} strokeWidth={1.7} />
            </span>
            <RoutingBadge $variant="default">fallback · {models.routing.fallback}</RoutingBadge>
          </RoutingBadges>
          <Switch checked={models.routing.autoRoute} onChange={() => {}} />
        </RoutingCard>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
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
              variants={fadeUp}
              custom={i + 3}
            >
              <ModelTop>
                <ModelInfo>
                  <ModelName>
                    {m.name}
                    {m.primary && (
                      <span
                        style={{
                          fontSize: 10,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: 'rgba(192, 132, 252, 0.18)',
                          color: '#d8b4fe',
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          fontWeight: 600,
                        }}
                      >
                        Primary
                      </span>
                    )}
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
                  <MetricValue style={{ fontSize: 11.5 }}>
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <StatusPill tone={m.tone === 'emerald' ? 'success' : 'azure'}>
                  {m.status}
                </StatusPill>
                <span style={{ fontSize: 11.5, color: 'rgba(229, 231, 235, 0.45)' }}>
                  Updated 2 days ago
                </span>
              </div>
            </ModelCard>
          ))}
        </ModelGrid>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={11}>
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
              variants={fadeUp}
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
    </PageRoot>
  );
}
