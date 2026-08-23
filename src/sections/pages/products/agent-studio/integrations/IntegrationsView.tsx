import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { Plug, ArrowRight } from 'lucide-react';
import { Panel } from '@components/common/ui/Panel';
import { Modal } from '@components/common/ui/Modal';
import { Segmented } from '@components/common/ui/Segmented';
import { ActionButton } from '@components/common/ui/ActionButton';
import { ViewShell, ViewHeader, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { pageItem } from '@styles/motion';
import integrations from '@neryva_data/products/agent_studio/integrations.json';

import {
  Grid,
  FilterRow,
  Card,
  CardHead,
  Icon,
  CardName,
  CardCategory,
  CardDescription,
  CardFoot,
  StatusDot,
  StatusText,
  PanelCopy,
  ModalIntro,
  ModalTitleRow,
  ScopeList,
  ScopeItem,
  ScopeDot,
  ScopeLabel,
} from './IntegrationsView.styles';

const ICONS: Record<string, string> = {
  slack: 'M5 9a2 2 0 114 0v6a2 2 0 11-4 0V9zm10 6a2 2 0 114 0 2 2 0 01-4 0zm-2-10a2 2 0 100 4h6a2 2 0 100-4h-6zM9 15a2 2 0 110 4 2 2 0 010-4zm10-2a2 2 0 100 4 2 2 0 000-4z',
  gmail: 'M3 6.5A2.5 2.5 0 015.5 4h13A2.5 2.5 0 0121 6.5v11A2.5 2.5 0 0118.5 20h-13A2.5 2.5 0 013 17.5v-11zm2 .7v10.3h14V7.2L12 13 5 7.2z',
  outlook: 'M3 6h10v12H3zM14 6h7v3h-7zm0 4h7v3h-7zm0 4h7v4h-7z',
  twilio: 'M5 5h6v6H5zm8 0h6v6h-6zm-8 8h6v6H5zm8 0h6v6h-6z',
  salesforce: 'M5 14a4 4 0 014-4 4 4 0 014-4 4 4 0 014 4 4 4 0 010 8H7a4 4 0 01-2-4z',
  hubspot: 'M12 4a3 3 0 110 6 3 3 0 010-6zm0 8a4 4 0 014 4v4h-8v-4a4 4 0 014-4z',
  zendesk: 'M3 12a9 9 0 0118 0 9 9 0 01-18 0zm9-3l-3 3 3 3 3-3-3-3z',
  notion: 'M5 4h14v16H5z M9 8h6 M9 12h6 M9 16h3',
  gdrive: 'M9 4l-6 10h12L9 4z M12 14l-3 5h12l-3-5z',
  confluence: 'M5 6a3 3 0 013-3h8a3 3 0 013 3v12a3 3 0 01-3 3H8a3 3 0 01-3-3z M8 9h8 M8 13h8',
  snowflake: 'M12 2v20M4 6l16 12M4 18l16-12 M9 4l3 3 3-3 M9 20l3-3 3 3',
  bigquery: 'M5 8a4 4 0 014-4h6a4 4 0 014 4v8a4 4 0 01-4 4H9a4 4 0 01-4-4z M9 8h6 M9 12h6',
  webhook: 'M9 14a3 3 0 003 3h2a4 4 0 004-4V8a4 4 0 00-4-4h-2 M5 10a3 3 0 003-3V5a4 4 0 014-4h2',
  zapier: 'M5 12a3 3 0 116 0 3 3 0 01-6 0zm8 0a3 3 0 116 0 3 3 0 01-6 0z',
};

/** Brand accent per connector — content data, not theme surface colors. */
const toneColor: Record<string, string> = {
  lilac: '#c084fc',
  azure: '#60a5fa',
  emerald: '#34d399',
  amber: '#fbbf24',
  rose: '#fb7185',
  neutral: '#94a3b8',
};

export function IntegrationsView() {
  const data = integrations;
  const [filter, setFilter] = useState<string>(data.categories[0]);
  const [connectTarget, setConnectTarget] = useState<null | (typeof data.connectors)[number]>(null);
  const [scopes, setScopes] = useState<Record<string, boolean>>({
    'Read messages': true,
    'Send messages': true,
    'Read channels': false,
    'Manage channels': false,
  });

  const list = useMemo(() => {
    if (filter === 'All') return data.connectors;
    return data.connectors.filter((c) => c.category === filter);
  }, [filter, data]);

  const categoryOptions = data.categories.map((c) => ({ value: c, label: c }));

  return (
    <ViewShell>
      <ViewHeader as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewTitle>Integrations</ViewTitle>
        <ViewSubtitle>Connect your tools so your agents always have the full picture.</ViewSubtitle>
      </ViewHeader>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <Panel>
          <FilterRow>
            <Segmented
              options={categoryOptions}
              value={filter}
              onChange={setFilter}
              size="md"
              ariaLabel="Filter integrations by category"
            />
          </FilterRow>
          <Grid>
            {list.map((c, i) => (
              <Card
                key={c.id}
                as={motion.div}
                initial="hidden"
                animate="visible"
                variants={pageItem}
                custom={i + 2}
              >
                <CardHead>
                  <Icon $color={toneColor[c.tone] ?? '#94a3b8'}>
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d={ICONS[c.id] ?? 'M5 5h14v14H5z'}
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </svg>
                  </Icon>
                  <div style={{ minWidth: 0 }}>
                    <CardName>{c.name}</CardName>
                    <CardCategory>{c.category}</CardCategory>
                  </div>
                </CardHead>
                <CardDescription>{c.description}</CardDescription>
                <CardFoot>
                  <StatusDot $connected={c.connected} aria-hidden="true" />
                  <StatusText $connected={c.connected}>
                    {c.connected ? 'Connected' : 'Not connected'}
                  </StatusText>
                  <ActionButton
                    size="sm"
                    variant={c.connected ? 'secondary' : 'primary'}
                    onClick={() => {
                      if (c.connected) {
                        toast.success(`Manage ${c.name}`);
                      } else {
                        setConnectTarget(c);
                      }
                    }}
                  >
                    {c.connected ? 'Manage' : 'Connect'}
                  </ActionButton>
                </CardFoot>
              </Card>
            ))}
          </Grid>
        </Panel>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={20}>
        <Panel
          title="Webhooks"
          subtitle="Send every agent event to your own HTTP endpoint."
          action={
            <Link to="/agent-studio/integrations/webhooks">
              <ActionButton variant="secondary" size="sm">
                Configure
                <ArrowRight size={11} strokeWidth={1.8} />
              </ActionButton>
            </Link>
          }
        >
          <PanelCopy>
            POST signed JSON payloads to your endpoint with HMAC-SHA256. Subscribe to the events
            that matter and inspect deliveries in the log.
          </PanelCopy>
        </Panel>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={21}>
        <Panel
          title="Need a custom integration?"
          subtitle="Build a connector with our SDK, or send events to any HTTPS endpoint."
          action={
            <ActionButton
              variant="secondary"
              size="sm"
              onClick={() => toast('The interactive API explorer has request/response examples for every connector.')}
            >
              <Plug size={13} strokeWidth={1.8} />
              Explore the API
            </ActionButton>
          }
        >
          <PanelCopy>
            Every integration runs in an isolated runtime with row-level permission scoping. You
            decide which agents can call which connectors, and every call is logged.
          </PanelCopy>
        </Panel>
      </motion.div>

      <Modal
        open={!!connectTarget}
        onClose={() => setConnectTarget(null)}
        title={connectTarget ? `Connect ${connectTarget.name}` : ''}
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setConnectTarget(null)}>
              Cancel
            </ActionButton>
            <ActionButton
              onClick={() => {
                toast.success(`${connectTarget?.name} connected`);
                setConnectTarget(null);
              }}
            >
              Authorize
            </ActionButton>
          </>
        }
      >
        <ModalIntro>
          {connectTarget ? (
            <ModalTitleRow>
              <Icon $color={toneColor[connectTarget.tone] ?? '#94a3b8'} style={{ width: 22, height: 22 }}>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d={ICONS[connectTarget.id] ?? 'M5 5h14v14H5z'}
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </Icon>
              {connectTarget.description} Choose the scopes you want to grant.
            </ModalTitleRow>
          ) : null}
        </ModalIntro>
        <ScopeList>
          {Object.entries(scopes).map(([label, on]) => (
            <ScopeItem
              key={label}
              type="button"
              aria-pressed={on}
              onClick={() => setScopes((s) => ({ ...s, [label]: !s[label] }))}
            >
              <ScopeDot $on={on} aria-hidden="true">{on ? '✓' : ''}</ScopeDot>
              <ScopeLabel>{label}</ScopeLabel>
            </ScopeItem>
          ))}
        </ScopeList>
      </Modal>
    </ViewShell>
  );
}
