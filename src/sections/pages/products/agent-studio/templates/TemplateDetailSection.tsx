import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { ArrowRight } from 'lucide-react';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { Panel } from '@components/common/ui/Panel';
import { ActionButton } from '@components/common/ui/ActionButton';
import { QueryView } from '@components/common/ui/AsyncStates';
import { MarkdownText } from '@/sections/pages/products/agent-studio/chat/ChatMessages/MarkdownText';
import { pageItem } from '@styles/motion';
import {
  useAssistantTemplates,
  reasonFix,
  reasonLabel,
  type TemplateListEntry,
  type RegistryTemplate,
} from '@hooks/studio/useSetupTemplates';
import { useChannels } from '@hooks/studio/useSetupChannels';
import { canSetup, setupDeniedCopy } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import {
  DetailSection,
  ReasonList,
  ReasonRow,
  ReasonCode,
  Rubric,
  TabRow,
  Tab,
} from './TemplatesView.styles';
import { SectionBackRow } from './SectionBackRow';

const GALLERY_PATH = '/agent-studio/templates';

/** Full route id (child of agentStudioTemplatesRoute, path '/$templateId'). */
export const TEMPLATE_DETAIL_ROUTE_ID = '/agent-studio/templates/$templateId' as const;

const Mono = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
`;

const Muted = styled.span`
  opacity: 0.55;
`;

const ActionsRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
`;

type DetailTab = 'definition' | 'tools' | 'knowledge' | 'channels' | 'evaluation' | 'release';

/**
 * Template detail — dedicated section replacing the TemplateDetailModal.
 * Byte-faithful to the modal: identifier title, incompatibility advisory
 * with reason codes and fix links (identical copy), the six tabs
 * (Definition / Tools / Knowledge / Channels / Evaluation / Release), and
 * the Install action (disabled for non-authors with the same denied copy).
 * Install threads the originating context as ?returnTo (guarded to
 * /agent-studio/*) and ?autoLand=builder (builder origin — the R-1 shim
 * contract: success auto-lands in the builder) so Cancel/Close/success land
 * exactly where the old modal flows did. Unknown template ids bounce to the
 * gallery (server gates the write too; the id can only arrive from a stale
 * link).
 */
export function TemplateDetailSection() {
  const { role } = useOrg();
  const navigate = useNavigate();
  const canInstall = canSetup(role, 'setup:author');
  const installDenied = setupDeniedCopy(role, 'setup:author');
  // Strict-from against the route id the parent registers in routes.tsx
  // (this id must match the registered route's id exactly).
  const params = useParams({ from: TEMPLATE_DETAIL_ROUTE_ID });
  const search = useSearch({ strict: false }) as { returnTo?: unknown; autoLand?: unknown };
  // Guarded returnTo: the gallery threads its embedding context (the
  // builder origin passes /agent-studio/agents/new + autoLand=builder).
  const returnTo =
    typeof search.returnTo === 'string' && search.returnTo.startsWith('/agent-studio/')
      ? search.returnTo
      : null;
  const autoLandBuilder = search.autoLand === 'builder';
  const exitTarget = returnTo ?? GALLERY_PATH;
  const templates = useAssistantTemplates();
  const templateId = params.templateId ?? '';
  const entry = (templates.data ?? []).find((e) => e.template.slug === templateId) ?? null;
  const unknownId = !templates.isPending && !templates.isError && entry === null;

  useEffect(() => {
    if (unknownId) {
      navigate({ to: GALLERY_PATH });
    }
  }, [unknownId, navigate]);

  if (unknownId) {
    return null;
  }

  return (
    <ViewShell>
      <SectionBackRow to={exitTarget}>
        <span aria-hidden="true">‹</span> {exitTarget === GALLERY_PATH ? 'Templates' : 'Back'}
      </SectionBackRow>
      <QueryView query={templates}>
        {(rows) => {
          const current = rows.find((e) => e.template.slug === templateId);
          return current ? (
            <DetailBody
              key={`${current.template.slug}@${current.template.version}`}
              entry={current}
              canInstall={canInstall}
              installDenied={installDenied}
              returnTo={returnTo}
              autoLandBuilder={autoLandBuilder}
              exitTarget={exitTarget}
            />
          ) : null;
        }}
      </QueryView>
    </ViewShell>
  );
}

function DetailBody({
  entry,
  canInstall,
  installDenied,
  returnTo,
  autoLandBuilder,
  exitTarget,
}: {
  entry: TemplateListEntry;
  canInstall: boolean;
  installDenied: string;
  returnTo: string | null;
  autoLandBuilder: boolean;
  exitTarget: string;
}) {
  const navigate = useNavigate();
  const template = entry.template;
  const [tab, setTab] = useState<DetailTab>('definition');
  const [showAllCases, setShowAllCases] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // Focus the heading on mount (preventScroll) — matches shell announcement pattern.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  const tabs: { value: DetailTab; label: string }[] = [
    { value: 'definition', label: 'Definition' },
    { value: 'tools', label: `Tools (${template.bindings.tools.required.length})` },
    { value: 'knowledge', label: `Knowledge (${template.bindings.knowledge.required.length})` },
    { value: 'channels', label: 'Channels' },
    { value: 'evaluation', label: 'Evaluation' },
    { value: 'release', label: 'Release' },
  ];

  /** WAI-ARIA tabs keyboard pattern: arrows move between tabs (roving tabindex). */
  const onTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    let next: number | null = null;
    if (e.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    if (next === null) return;
    e.preventDefault();
    setTab(tabs[next].value);
    tabRefs.current[next]?.focus();
  };

  const tabId = (value: DetailTab) => `template-tab-${value}`;
  const panelId = (value: DetailTab) => `template-panel-${value}`;

  const install = () => {
    navigate({
      to: '/agent-studio/templates/$templateId/install',
      params: { templateId: template.slug },
      search: {
        ...(returnTo ? { returnTo } : {}),
        ...(autoLandBuilder ? { autoLand: 'builder' as const } : {}),
      },
    });
  };

  return (
    <>
      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewHeader>
          <ViewTitle ref={headingRef} tabIndex={-1}>
            <Mono>{template.slug}@{template.version}</Mono>
          </ViewTitle>
          <ViewSubtitle>
            {template.family} · {template.status} · sha <Mono>{template.hash?.slice(0, 12) ?? '—'}</Mono>
          </ViewSubtitle>
        </ViewHeader>
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <Panel title="Template contract" titleAs="h2" subtitle="Function, bill of materials, compatibility, and release policy — everything install checks.">
          {!entry.compatible && (
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 650 }}>Compatibility</h3>
              <ReasonList>
                {entry.reasons.map((reason) => {
                  const fix = reasonFix(reason.code);
                  return (
                    <ReasonRow key={reason.code}>
                      <ReasonCode title={reason.code}>{reasonLabel(reason.code)}</ReasonCode>
                      <span>{reason.detail}</span>
                      {fix ? <Link to={fix.to} aria-label={`${fix.label} for ${template.slug}`}>{fix.label} →</Link> : <Muted>resolve in the install checklist</Muted>}
                    </ReasonRow>
                  );
                })}
              </ReasonList>
            </div>
          )}
          <TabRow role="tablist" aria-label="Template sections">
            {tabs.map((t, i) => (
              <Tab
                key={t.value}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={tabId(t.value)}
                aria-selected={tab === t.value}
                aria-controls={panelId(t.value)}
                tabIndex={tab === t.value ? 0 : -1}
                $on={tab === t.value}
                onClick={() => setTab(t.value)}
                onKeyDown={(e) => onTabKeyDown(e, i)}
              >
                {t.label}
              </Tab>
            ))}
          </TabRow>

          {tab === 'definition' && (
            <div role="tabpanel" id={panelId('definition')} aria-labelledby={tabId('definition')} tabIndex={0}>
              <DefinitionTab template={template} />
            </div>
          )}
          {tab === 'tools' && (
            <div role="tabpanel" id={panelId('tools')} aria-labelledby={tabId('tools')} tabIndex={0}>
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 650 }}>Required tool bindings</h3>
                <ul>
                  {template.bindings.tools.required.map((tool) => (
                    <li key={tool.name} style={{ fontSize: 13, lineHeight: 1.6 }}>
                      <Mono>{tool.name}</Mono>
                      {tool.built_in ? ' (built-in)' : ''}
                      {tool.effect_class ? ` · ${tool.effect_class}` : ''}
                      {tool.approval_requirement ? ` · approval ${tool.approval_requirement}` : ''}
                      {tool.when_to_use ? ` — ${tool.when_to_use}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {tab === 'knowledge' && (
            <div role="tabpanel" id={panelId('knowledge')} aria-labelledby={tabId('knowledge')} tabIndex={0}>
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 650 }}>Required knowledge slugs</h3>
                {template.bindings.knowledge.required.length === 0 ? (
                  <p><Muted>No required sources.</Muted></p>
                ) : (
                  <ul>
                    {template.bindings.knowledge.required.map((slug) => (
                      <li key={slug} style={{ fontSize: 13, lineHeight: 1.6 }}><Mono>{slug}</Mono></li>
                    ))}
                  </ul>
                )}
                {template.bindings.knowledge.notes && <p>{template.bindings.knowledge.notes}</p>}
              </div>
            </div>
          )}
          {tab === 'channels' && (
            <div role="tabpanel" id={panelId('channels')} aria-labelledby={tabId('channels')} tabIndex={0}>
              <ChannelsTab template={template} />
            </div>
          )}
          {tab === 'evaluation' && (
            <div role="tabpanel" id={panelId('evaluation')} aria-labelledby={tabId('evaluation')} tabIndex={0}>
              <EvaluationTab template={template} showAllCases={showAllCases} onToggleCases={() => setShowAllCases((v) => !v)} />
            </div>
          )}
          {tab === 'release' && (
            <div role="tabpanel" id={panelId('release')} aria-labelledby={tabId('release')} tabIndex={0}>
              <ReleaseTab template={template} />
            </div>
          )}
          <ActionsRow>
            <ActionButton variant="secondary" onClick={() => navigate({ to: exitTarget })}>
              {exitTarget === GALLERY_PATH ? 'Back to gallery' : 'Back'}
            </ActionButton>
            <ActionButton disabled={!canInstall} title={canInstall ? 'Install as a draft (never live)' : installDenied} aria-label={`Install ${template.slug} as draft`} onClick={install}>
              Install
              <ArrowRight size={11} strokeWidth={1.8} />
            </ActionButton>
          </ActionsRow>
        </Panel>
      </motion.div>
    </>
  );
}

function DefinitionTab({ template }: { template: RegistryTemplate }) {
  const { name: workspaceName } = useOrg();
  const definition = template.definition as Record<string, unknown>;
  const modelPolicy = (definition.model_policy ?? {}) as Record<string, unknown>;
  const contextPolicy = (definition.context_policy ?? {}) as Record<string, unknown>;
  const knowledgePolicy = (definition.knowledge_policy ?? {}) as Record<string, unknown>;
  const budgetPolicy = (definition.budget_policy ?? {}) as Record<string, unknown>;
  // Template-author placeholder: {org_name} means "this workspace's name".
  // Nothing in the pipeline resolves it, so the preview renders it resolved
  // for readability (the installed draft keeps the literal placeholder).
  const orgName = workspaceName ?? 'your workspace';
  const instructions = typeof definition.instructions === 'string' ? definition.instructions.replaceAll('{org_name}', orgName) : '';
  return (
    <DetailSection>
      <h3>Definition (engine payload)</h3>
      <ul>
        <li>Instructions: {instructions.length > 0 ? `${instructions.slice(0, 160)}…` : <Muted>—</Muted>}</li>
        <li>Models: <Mono>{Array.isArray(modelPolicy.allowed_models) ? (modelPolicy.allowed_models as string[]).join(', ') : '—'}</Mono></li>
        <li>History: {typeof contextPolicy.history_limit === 'number' ? contextPolicy.history_limit : '—'} · memory: {typeof contextPolicy.memory_scope === 'string' ? contextPolicy.memory_scope : '—'}</li>
        <li>Knowledge: {knowledgePolicy.retrieval_enabled === true ? 'on' : 'off'} · max {typeof knowledgePolicy.max_results === 'number' ? knowledgePolicy.max_results : '—'}</li>
        <li>Budgets: <Mono>{Object.entries(budgetPolicy).map(([k, v]) => `${k}=${String(v)}`).join(' · ') || '—'}</Mono></li>
      </ul>
    </DetailSection>
  );
}

function ChannelsTab({ template }: { template: RegistryTemplate }) {
  const declared = template.bindings.channels.channels;
  const live = useChannels();
  return (
    <DetailSection>
      <h3>Channels + caps</h3>
      {declared.length === 0 ? (
        <p><Muted>No channel bindings.</Muted></p>
      ) : (
        <ul>
          {declared.map((channel) => {
            // Declared names match live accounts by platform, id, or display
            // name — whichever the channel plane keyed them under.
            const account = (live.data ?? []).find((a) => a.platform === channel || a.id === channel || a.displayName === channel);
            return (
              <li key={channel}>
                <Mono>{channel}</Mono>
                {live.isPending ? (
                  <> — <Muted>checking live state…</Muted></>
                ) : live.isError ? (
                  <> — <Muted>live state unreachable</Muted> <button type="button" onClick={() => void live.refetch()}>Retry</button></>
                ) : account ? (
                  <> — connected{account.status ? ` (${account.status})` : ''}</>
                ) : (
                  <> — <Muted>not connected</Muted></>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <p><Link to="/agent-studio/channels" search={{ returnTo: undefined, assistantId: undefined }}>Connect a channel to serve this template →</Link></p>
    </DetailSection>
  );
}

function EvaluationTab({ template, showAllCases, onToggleCases }: { template: RegistryTemplate; showAllCases: boolean; onToggleCases: () => void }) {
  const ref = template.evalRef;
  if (!ref) {
    return (
      <DetailSection>
        <h3>Evaluation</h3>
        <p><Muted>No eval reference ships with this template.</Muted></p>
      </DetailSection>
    );
  }
  const cases = ref.cases ?? [];
  const visible = showAllCases ? cases : cases.slice(0, 5);
  return (
    <DetailSection>
      <h3>Evaluators</h3>
      <ul>
        {(ref.evaluators?.evaluators ?? []).map((evaluator) => (
          <li key={`${evaluator.name}@${evaluator.version}`}>
            <Mono>{evaluator.name}@{evaluator.version}</Mono> ({evaluator.kind}): {(evaluator.checks ?? []).join(', ')}
          </li>
        ))}
      </ul>
      {ref.rubric_markdown && (
        <>
          <h3>Rubric</h3>
          <Rubric>
            {/* The rubric is authored as a standalone doc (top-level `#`);
                demote its headings so they nest under this section's h3
                instead of emitting a second page-level h1. */}
            <MarkdownText text={ref.rubric_markdown} headingShift={3} />
          </Rubric>
        </>
      )}
      <h3>Seed cases ({cases.length})</h3>
      <ul>
        {visible.map((c, i) => (
          <li key={i}>{c.input}</li>
        ))}
      </ul>
      {cases.length > 5 && (
        <p>
          <Muted>+{cases.length - 5} more — the full set seeds the install dataset.</Muted>{' '}
          <button type="button" onClick={onToggleCases}>{showAllCases ? 'Show fewer' : 'Show all'}</button>
        </p>
      )}
    </DetailSection>
  );
}

/**
 * Human-readable sentence for a release-policy required check (P3-4).
 * String checks render as-is; object checks like
 * {"regression_no_worse_than": 0.02} become "Regression no worse than 0.02".
 */
function describeReleaseCheck(check: string | Record<string, unknown>): string {
  if (typeof check === 'string') return check;
  return Object.entries(check)
    .map(([key, value]) => {
      const words = key.split('_');
      const tail = words.slice(-3).join('_');
      if (tail === 'no_worse_than') {
        const subject = words.slice(0, -3).join(' ');
        return `${subject.charAt(0).toUpperCase() + subject.slice(1)} no worse than ${String(value)}`;
      }
      const label = words.map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w)).join(' ');
      return `${label}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`;
    })
    .join('; ');
}

function ReleaseTab({ template }: { template: RegistryTemplate }) {
  const policy = template.releasePolicy;
  if (!policy) {
    return (
      <DetailSection>
        <h3>Release policy</h3>
        <p><Muted>No release policy — legacy posture (BLOCK gate only).</Muted></p>
      </DetailSection>
    );
  }
  return (
    <DetailSection>
      <h3>Release policy (v{policy.release_policy_version ?? '?'})</h3>
      <p>Required checks (a fresh PASS on the content hash must exist before publish):</p>
      <ul>
        {(policy.required ?? []).map((check, i) => (
          <li key={i}>{describeReleaseCheck(check)}</li>
        ))}
      </ul>
      {policy.thresholds && (
        <p>Thresholds: <Mono>{Object.entries(policy.thresholds).map(([k, v]) => `${k}≥${v}`).join(' · ')}</Mono></p>
      )}
      {(policy.critical_failures ?? []).length > 0 && (
        <p>Critical failures (any occurrence BLOCKs release): <Mono>{(policy.critical_failures ?? []).join(', ')}</Mono></p>
      )}
    </DetailSection>
  );
}
