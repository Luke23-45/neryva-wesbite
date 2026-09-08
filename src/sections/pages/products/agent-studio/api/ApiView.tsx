import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Play, KeyRound } from 'lucide-react';
import { Segmented } from '@components/common/ui/Segmented';
import { ActionButton } from '@components/common/ui/ActionButton';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { pageItem } from '@styles/motion';
import catalogJson from '@neryva_data/products/agent_studio/api-catalog.json';
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

/**
 * API explorer (ledger I-4/I-5) — generated from the runtime's pinned
 * OpenAPI contract (regenerate: `node scripts/generate-api-catalog.mjs`).
 *
 * The request builder composes real calls from the endpoint's parameters;
 * GET requests execute live through the runtime proxy with the key you
 * paste (kept in memory for this tab only — never persisted). Mutating
 * methods show the exact curl instead of firing. The fake sample key,
 * hand-written examples, and the single fake response are gone.
 */

interface CatalogParam {
  name: string;
  in: string;
  required: boolean;
  description: string | null;
  type: string | null;
}

interface CatalogEndpoint {
  id: string;
  path: string;
  method: string;
  tag: string;
  summary: string;
  description: string | null;
  params: CatalogParam[];
  body: { required: boolean; fields: Array<{ name: string; type: string; required: boolean }> } | null;
}

interface Catalog {
  title: string;
  version: string;
  endpointCount: number;
  endpoints: CatalogEndpoint[];
}

const catalog = catalogJson as unknown as Catalog;

/** Dev: the Vite proxy forwards /runtime → the local runtime. Prod: the edge routes it. */
const RUNTIME_BASE = (import.meta.env.VITE_RUNTIME_BASE as string | undefined) ?? '/runtime';

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

interface SendResult {
  status: number;
  statusText: string;
  ms: number;
  body: string;
}

export function ApiView() {
  const [activeId, setActiveId] = useState(catalog.endpoints[0]?.id ?? '');
  const [tab, setTab] = useState<Tab>('request');
  const [apiKey, setApiKey] = useState('');
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [bodyText, setBodyText] = useState<Record<string, string>>({});
  const [result, setResult] = useState<SendResult | null>(null);
  const [sending, setSending] = useState(false);

  const grouped = useMemo(() => {
    const out: Record<string, CatalogEndpoint[]> = {};
    for (const e of catalog.endpoints) {
      if (!out[e.tag]) out[e.tag] = [];
      out[e.tag].push(e);
    }
    return out;
  }, []);

  const active = catalog.endpoints.find((e) => e.id === activeId) ?? catalog.endpoints[0];

  const paramKey = (p: CatalogParam) => `${active.id}|${p.in}|${p.name}`;
  const paramValue = (p: CatalogParam) => paramValues[paramKey(p)] ?? '';

  const builtPath = useMemo(() => {
    let path = active.path;
    for (const p of active.params.filter((x) => x.in === 'path')) {
      const value = paramValue(p).trim();
      path = path.replace(`{${p.name}}`, value ? encodeURIComponent(value) : `{${p.name}}`);
    }
    const query = active.params
      .filter((x) => x.in === 'query')
      .filter((x) => paramValue(x).trim() !== '')
      .map((x) => `${encodeURIComponent(x.name)}=${encodeURIComponent(paramValue(x).trim())}`);
    return query.length > 0 ? `${path}?${query.join('&')}` : path;
  }, [active, paramValues]);

  const bodyTextFor = useMemo(() => {
    if (!active.body) return undefined;
    return bodyText[active.id] ?? JSON.stringify(Object.fromEntries(active.body.fields.map((f) => [f.name, defaultForType(f.type)])), null, 2);
  }, [active, bodyText]);

  const setBody = (next: string) => setBodyText((m) => ({ ...m, [active.id]: next }));

  const curl = useMemo(() => {
    const lines = [`curl -X ${active.method.toUpperCase()} "https://api.neryva.ai${builtPath}" \\`, `  -H "Authorization: Bearer nv_live_..."`];
    if (active.body) {
      lines.push(`  -H "Content-Type: application/json" \\`);
      lines.push(`  -d '${bodyTextFor ?? '{}'}'`);
    }
    return lines.join('\n');
  }, [active, builtPath, bodyTextFor]);

  const send = async () => {
    if (active.method !== 'get') {
      toast.error('Try-it is GET-only in this explorer — mutating calls use the curl');
      return;
    }
    setSending(true);
    setTab('response');
    const started = performance.now();
    try {
      const response = await fetch(`${RUNTIME_BASE}${builtPath}`, {
        headers: {
          accept: 'application/json',
          ...(apiKey.trim() ? { 'X-API-Key': apiKey.trim() } : {}),
        },
      });
      const text = await response.text();
      setResult({
        status: response.status,
        statusText: response.statusText,
        ms: Math.round(performance.now() - started),
        body: pretty(text),
      });
    } catch {
      setResult({ status: 0, statusText: 'network error', ms: Math.round(performance.now() - started), body: 'The request could not reach the runtime.' });
    } finally {
      setSending(false);
    }
  };

  const code = tab === 'request' ? curl : result ? `HTTP ${result.status} ${result.statusText} · ${result.ms}ms\n\n${result.body}` : 'Send the request to see the live response here.';
  const responseReady = tab === 'response' && result !== null;

  return (
    <ViewShell>
      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewHeader>
          <ViewTitle>API explorer</ViewTitle>
          <ViewSubtitle>
            Generated from the runtime's OpenAPI contract — {catalog.endpointCount} endpoints. Build a request,
            copy the curl, or fire GETs live.
          </ViewSubtitle>
        </ViewHeader>
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
                      setResult(null);
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
            {active.description && <Description>{active.description}</Description>}

            {active.params.length > 0 && (
              <div>
                <SubsectionLabel>Parameters</SubsectionLabel>
                <ParamsList>
                  {active.params.map((p) => (
                    <ParamRow key={`${p.in}:${p.name}`}>
                      <ParamLeft>
                        <ParamName $required={p.required}>{p.name}</ParamName>
                        <ParamDesc>{p.description ?? `${p.in} parameter`}</ParamDesc>
                      </ParamLeft>
                      <ParamType>{p.type ?? p.in}</ParamType>
                      {(p.in === 'path' || p.in === 'query') && (
                        <ParamValueInput
                          value={paramValue(p)}
                          onChange={(e) => setParamValues((m) => ({ ...m, [paramKey(p)]: e.target.value }))}
                          placeholder={p.in === 'path' ? 'value' : 'filter value'}
                          aria-label={`Value for ${p.name}`}
                        />
                      )}
                    </ParamRow>
                  ))}
                </ParamsList>
              </div>
            )}

            {active.body && (
              <div>
                <SubsectionLabel>
                  Request body {active.body.required ? '(required)' : '(optional)'}
                </SubsectionLabel>
                <BodyEditor
                  value={bodyTextFor ?? '{}'}
                  onChange={(e) => setBody(e.target.value)}
                  rows={Math.min(12, Math.max(4, (bodyTextFor ?? '').split('\n').length))}
                  spellCheck={false}
                  aria-label="Request body JSON"
                />
                {active.body.fields.length > 0 && (
                  <ParamsList>
                    {active.body.fields.map((f) => (
                      <ParamRow key={f.name}>
                        <ParamLeft>
                          <ParamName $required={f.required}>{f.name}</ParamName>
                        </ParamLeft>
                        <ParamType>{f.type}</ParamType>
                      </ParamRow>
                    ))}
                  </ParamsList>
                )}
              </div>
            )}

            <div>
              <SubsectionLabel>Example</SubsectionLabel>
              <ExampleBar>
                <Segmented
                  options={tabOptions}
                  value={tab}
                  onChange={setTab}
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
              <TryKeyWrap>
                <KeyRound size={13} strokeWidth={1.8} aria-hidden="true" />
                <TryKeyInput
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste an org API key (nv_live_…) — stays in this tab"
                  aria-label="API key for live requests"
                  autoComplete="off"
                />
              </TryKeyWrap>
              <TryNote>
                <TryNoteStrong>Try it</TryNoteStrong> — {active.method === 'get' ? 'GET requests fire live through the runtime proxy.' : 'Mutating calls show the exact curl — fire it from your terminal.'}
              </TryNote>
              <ActionButton
                disabled={active.method !== 'get' || sending}
                title={active.method !== 'get' ? 'Try-it is GET-only — mutating calls use the curl' : undefined}
                onClick={() => void send()}
              >
                <Play size={12} strokeWidth={1.8} />
                {sending ? 'Sending…' : 'Send request'}
              </ActionButton>
            </TryBar>
            {tab === 'response' && !responseReady && !sending && (
              <TryNote>
                <TryNoteStrong>No response yet</TryNoteStrong> — send the request to capture status, latency, and body.
              </TryNote>
            )}
          </Detail>
        </motion.div>
      </TwoColumn>
    </ViewShell>
  );
}

function defaultForType(type: string): string {
  if (type === 'string') return '';
  if (type === 'integer' || type === 'number') return '0';
  if (type === 'boolean') return 'false';
  if (type === 'array') return '[]';
  return 'null';
}

function pretty(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2).slice(0, 50_000);
  } catch {
    return text.slice(0, 50_000);
  }
}

const ParamValueInput = styled.input`
  width: 150px;
  background: ${({ theme }) => theme.app.surface.tint};
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  border-radius: 7px;
  color: ${({ theme }) => theme.app.text.primary};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  padding: 5px 8px;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }

  &::placeholder {
    color: ${({ theme }) => theme.app.text.ghost};
  }
`;

const BodyEditor = styled.textarea`
  width: 100%;
  background: rgba(0, 0, 0, 0.30);
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  border-radius: 10px;
  color: ${({ theme }) => theme.app.text.primary};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.caption};
  line-height: 1.55;
  padding: 12px;
  resize: vertical;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

const TryKeyWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 220px;
  padding: 7px 10px;
  border-radius: 9px;
  background: ${({ theme }) => theme.app.surface.tint};
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  color: ${({ theme }) => theme.app.text.muted};

  &:focus-within {
    border-color: ${({ theme }) => theme.app.border.focus};
  }
`;

const TryKeyInput = styled.input`
  flex: 1;
  border: 0;
  background: transparent;
  outline: none;
  color: ${({ theme }) => theme.app.text.primary};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.caption};
`;
