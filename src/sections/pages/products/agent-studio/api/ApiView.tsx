import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Play, KeyRound } from 'lucide-react';
import { Segmented } from '@components/common/ui/Segmented';
import { ActionButton } from '@components/common/ui/ActionButton';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { pageItem } from '@styles/motion';
import api from '@neryva_data/products/agent_studio/api.json';
import {
  TwoColumn,
  Sidebar,
  SidebarSection,
  SidebarLabel,
  SidebarItem,
  MethodBadge,
  Detail,
  DetailHeader,
  DetailPath,
  Description,
  SubsectionLabel,
  ParamsList,
  ParamRow,
  ParamLeft,
  ParamName,
  ParamDesc,
  ParamType,
  CodeBlock,
  CodeRow,
  LineNumber,
  LineContent,
  ExampleBar,
  TryBar,
  TryNote,
  TryNoteStrong,
} from './ApiView.styles';

const SAMPLE_KEY = 'nv_live_4d2e7a91b6f3a8c1e2f5';

const SAMPLE_REQUEST: Record<string, string> = {
  chat: `curl -X POST https://api.neryva.ai/v1/chat \\
  -H "Authorization: Bearer nv_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "agent_id": "agt_support_concierge",
    "messages": [
      { "role": "user", "content": "How do I reset my password?" }
    ],
    "stream": true,
    "temperature": 0.3
  }'`,
  'chat-stream': `curl -X POST https://api.neryva.ai/v1/chat/stream \\
  -H "Authorization: Bearer nv_live_..." \\
  -H "Content-Type: application/json" \\
  -H "Accept: text/event-stream" \\
  -d '{
    "agent_id": "agt_support_concierge",
    "messages": [
      { "role": "user", "content": "Help me onboard" }
    ]
  }'`,
  'agents-list': `curl https://api.neryva.ai/v1/agents?limit=50 \\
  -H "Authorization: Bearer nv_live_..."`,
  'agents-create': `curl -X POST https://api.neryva.ai/v1/agents \\
  -H "Authorization: Bearer nv_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Refund Specialist",
    "model": "reasoner-pro",
    "system_prompt": "You are a refund specialist. Be concise and empathetic.",
    "tools": [
      { "type": "function", "function": { "name": "lookup_order" } }
    ]
  }'`,
  'agents-retrieve': `curl https://api.neryva.ai/v1/agents/agt_support_concierge \\
  -H "Authorization: Bearer nv_live_..."`,
  'agents-update': `curl -X PATCH https://api.neryva.ai/v1/agents/agt_support_concierge \\
  -H "Authorization: Bearer nv_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "system_prompt": "Updated prompt here."
  }'`,
  'agents-delete': `curl -X DELETE https://api.neryva.ai/v1/agents/agt_legacy \\
  -H "Authorization: Bearer nv_live_..."`,
  'knowledge-sources': `curl -X POST https://api.neryva.ai/v1/knowledge/sources \\
  -H "Authorization: Bearer nv_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "kind": "url",
    "url": "https://docs.aurora.example",
    "name": "Product documentation"
  }'`,
  'knowledge-query': `curl -X POST https://api.neryva.ai/v1/knowledge/query \\
  -H "Authorization: Bearer nv_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "refund policy",
    "top_k": 5
  }'`,
  'conversations-list': `curl "https://api.neryva.ai/v1/conversations?agent_id=agt_support&from=2026-04-01" \\
  -H "Authorization: Bearer nv_live_..."`,
  'webhooks-create': `curl -X POST https://api.neryva.ai/v1/webhooks \\
  -H "Authorization: Bearer nv_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://hooks.aurora.example/agent",
    "events": ["agent.published", "conversation.resolved"],
    "secret": "whsec_..."
  }'`,
  'analytics-usage': `curl "https://api.neryva.ai/v1/analytics/usage?from=2026-04-01&to=2026-04-30&group_by=day" \\
  -H "Authorization: Bearer nv_live_..."`,
};

const SAMPLE_RESPONSE: Record<string, string> = {
  chat: `{
  "id": "msg_8f3a1c",
  "object": "chat.completion",
  "agent_id": "agt_support_concierge",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "To reset your password, click 'Forgot password' on the sign-in page…"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 142,
    "completion_tokens": 84,
    "total_tokens": 226
  }
}`,
};

type Tab = 'request' | 'response';
const tabOptions: { value: Tab; label: string }[] = [
  { value: 'request', label: 'Request' },
  { value: 'response', label: 'Response' },
];

async function copyText(text: string, successMessage: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMessage);
  } catch {
    toast.error('Clipboard unavailable');
  }
}

export function ApiView() {
  const [activeId, setActiveId] = useState('chat');
  const [tab, setTab] = useState<Tab>('request');

  const grouped = useMemo(() => {
    const out: Record<string, typeof api.endpoints> = {};
    for (const e of api.endpoints) {
      if (!out[e.group]) out[e.group] = [];
      out[e.group].push(e);
    }
    return out;
  }, []);

  const active = api.endpoints.find((e) => e.id === activeId)!;
  const hasResponse = Boolean(SAMPLE_RESPONSE[activeId]);
  const code = tab === 'request' ? SAMPLE_REQUEST[activeId] : SAMPLE_RESPONSE[activeId] ?? '';

  const selectTab = (next: Tab) => {
    if (next === 'response' && !hasResponse) return;
    setTab(next);
  };

  return (
    <ViewShell>
      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewHeader>
          <ViewTitle>API explorer</ViewTitle>
          <ViewSubtitle>
            Interactive reference for the Neryva API. Every endpoint, every parameter, with runnable
            examples.
          </ViewSubtitle>
        </ViewHeader>
        <ActionButton
          variant="secondary"
          size="sm"
          onClick={() => copyText(SAMPLE_KEY, 'API key copied')}
        >
          <KeyRound size={13} strokeWidth={1.8} />
          Copy API key
        </ActionButton>
      </ViewHeaderRow>

      <TwoColumn>
        <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
          <Sidebar>
            {Object.entries(grouped).map(([group, list]) => (
              <SidebarSection key={group}>
                <SidebarLabel>{group}</SidebarLabel>
                {list.map((e) => (
                  <SidebarItem
                    key={e.id}
                    type="button"
                    $active={activeId === e.id}
                    aria-current={activeId === e.id ? 'true' : undefined}
                    onClick={() => {
                      setActiveId(e.id);
                      setTab('request');
                    }}
                  >
                    <MethodBadge $method={e.method}>{e.method}</MethodBadge>
                    <span>{e.path}</span>
                  </SidebarItem>
                ))}
              </SidebarSection>
            ))}
          </Sidebar>
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
          <Detail>
            <DetailHeader>
              <MethodBadge $method={active.method}>{active.method}</MethodBadge>
              <DetailPath>{active.path}</DetailPath>
            </DetailHeader>
            <Description>{active.description}</Description>

            <div>
              <SubsectionLabel>Parameters</SubsectionLabel>
              <ParamsList>
                {active.params.map((p) => (
                  <ParamRow key={p.name}>
                    <ParamLeft>
                      <ParamName $required={p.required}>{p.name}</ParamName>
                      <ParamDesc>{p.desc}</ParamDesc>
                    </ParamLeft>
                    <ParamType>{p.type}</ParamType>
                  </ParamRow>
                ))}
              </ParamsList>
            </div>

            <div>
              <SubsectionLabel>Example</SubsectionLabel>
              <ExampleBar>
                <Segmented
                  options={tabOptions}
                  value={tab}
                  onChange={selectTab}
                  ariaLabel="Example type"
                />
                <ActionButton
                  variant="ghost"
                  size="sm"
                  onClick={() => copyText(code, 'Copied to clipboard')}
                >
                  Copy
                </ActionButton>
              </ExampleBar>
              <CodeBlock>
                {code.split('\n').map((line, i) => (
                  <CodeRow key={i}>
                    <LineNumber>{i + 1}</LineNumber>
                    <LineContent>{line}</LineContent>
                  </CodeRow>
                ))}
              </CodeBlock>
            </div>

            <TryBar>
              <TryNote>
                <TryNoteStrong>Try it</TryNoteStrong> — your live API key will be used to make the
                call.
              </TryNote>
              <ActionButton
                onClick={() => {
                  if (hasResponse) {
                    setTab('response');
                    toast.success('Request sent · 412ms · 200 OK');
                  } else {
                    toast('Live calls for this endpoint are coming to the explorer soon', {
                      icon: '🚧',
                    });
                  }
                }}
              >
                <Play size={12} strokeWidth={1.8} />
                Send request
              </ActionButton>
            </TryBar>
          </Detail>
        </motion.div>
      </TwoColumn>
    </ViewShell>
  );
}
