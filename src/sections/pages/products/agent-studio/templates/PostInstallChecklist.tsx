import { Link } from '@tanstack/react-router';
import styled from 'styled-components';
import { AlertTriangle, Check, X } from 'lucide-react';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { ActionButton } from '@components/common/ui/ActionButton';
import { useAssistantDefinition } from '@hooks/studio/useAgentAuthoring';
import { useDocuments } from '@hooks/studio/useSetupKnowledge';
import { BUILT_IN_TOOLS, useToolCatalog } from '@hooks/studio/useSetupTools';
import { useModelAvailability } from '@hooks/studio/useSetupModels';
import type { RegistryTemplate } from '@hooks/studio/useSetupTemplates';
import { canSetup } from '@lib/engine/capabilities';
import type { OrgRole } from '@/Context/OrgContext';

const CheckRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 10px 0;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.strong};

  &:last-child {
    border-bottom: 0;
  }
`;

const CheckIcon = styled.span<{ $ok: boolean }>`
  color: ${({ $ok, theme }) => ($ok ? theme.app.status.success.fg : theme.app.status.warning.fg)};
  display: inline-flex;
  margin-top: 2px;
`;

const CheckBody = styled.div`
  flex: 1;
  font-size: 13px;
  line-height: 1.55;
`;

const CheckTitle = styled.div`
  font-weight: 600;
  margin-bottom: 2px;
`;

const Mono = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
`;

const Muted = styled.span`
  opacity: 0.55;
`;

export interface PostInstallChecklistProps {
  template: RegistryTemplate;
  assistantId: string;
  role: OrgRole | null;
}

function isBuiltIn(name: string): boolean {
  return (BUILT_IN_TOOLS as readonly string[]).includes(name);
}

/**
 * Shared post-install fulfillment checklist (C11 owns it; the gallery
 * wizard and the builder banner reuse it, never fork it). Reads LIVE
 * inputs — catalog, documents, models, the assistant's own entries —
 * and renders each row in exactly one state:
 *
 *   loading → skeleton (never a red X before truth arrives);
 *   error → retry row (never a gap);
 *   done / missing / disabled / changed / unbound + fix action.
 *
 * Governing model: template = contract, pins = fulfillment, eval = proof.
 * Nothing prefilled is ever re-asked.
 */
export function PostInstallChecklist({ template, assistantId, role }: PostInstallChecklistProps) {
  const documents = useDocuments();
  const catalog = useToolCatalog();
  const models = useModelAvailability();
  const form = useAssistantDefinition(assistantId);

  const loading = documents.isPending || catalog.isPending || models.isPending || form.data === undefined;
  const failed = documents.isError || catalog.isError || models.isError || form.isError;

  if (loading) {
    return (
      <div aria-label="Checking fulfillment">
        <Skeleton $h="44px" $r="10px" />
        <div style={{ marginTop: 8 }}>
          <Skeleton $h="44px" $r="10px" />
        </div>
        <div style={{ marginTop: 8 }}>
          <Skeleton $h="44px" $r="10px" />
        </div>
      </div>
    );
  }

  if (failed) {
    const retry = () => {
      if (documents.isError) void documents.refetch();
      if (catalog.isError) void catalog.refetch();
      if (models.isError) void models.refetch();
      if (form.isError) void form.refetch();
    };
    return (
      <CheckRow>
        <CheckIcon $ok={false}>
          <AlertTriangle size={15} />
        </CheckIcon>
        <CheckBody>
          <CheckTitle>Fulfillment checks unreachable</CheckTitle>
          <div>
            <Muted>The catalog, documents, or models read failed — these rows are unknown, not gaps.</Muted>{' '}
            <ActionButton variant="ghost" size="sm" onClick={retry}>
              Retry
            </ActionButton>
          </div>
        </CheckBody>
      </CheckRow>
    );
  }

  // Knowledge: deterministic per slug — READY-first, then highest version.
  // Duplicates resolve to one row with the count stated (never silent
  // last-write-wins).
  const requiredSlugs = template.bindings.knowledge.required;
  const slugGroups = new Map<string, { state: string; latestVersion: number | null }[]>();
  for (const doc of documents.data ?? []) {
    if (!doc.sourceSlug) continue;
    const group = slugGroups.get(doc.sourceSlug) ?? [];
    group.push({ state: doc.state, latestVersion: doc.latestVersion });
    slugGroups.set(doc.sourceSlug, group);
  }
  const pickDoc = (slug: string): { state: string; duplicates: number } | null => {
    const group = slugGroups.get(slug);
    if (!group || group.length === 0) return null;
    const ordered = [...group].sort((a, b) => {
      const ready = (b.state === 'ready' ? 1 : 0) - (a.state === 'ready' ? 1 : 0);
      if (ready !== 0) return ready;
      return (b.latestVersion ?? -1) - (a.latestVersion ?? -1);
    });
    return { state: ordered[0].state, duplicates: group.length };
  };
  const missingSlugs = requiredSlugs.filter((slug) => pickDoc(slug) === null);
  const unreadySlugs = requiredSlugs.filter((slug) => {
    const found = pickDoc(slug);
    return found !== null && found.state !== 'ready';
  });
  const duplicateSlugs = requiredSlugs.filter((slug) => (pickDoc(slug)?.duplicates ?? 0) > 1);
  const knowledgeDone = missingSlugs.length === 0 && unreadySlugs.length === 0;

  // Tools: required names × assistant entries × live catalog rows.
  // Changed-state needs BOTH hashes (entry pin + live row) — without an
  // entry pin there is nothing to compare against, so those rows grade on
  // liveness only (resolved/missing/disabled).
  const requiredTools = template.bindings.tools.required;
  const entriesByName = new Map((form.data?.definition.tools ?? []).map((entry) => [entry.name, entry]));
  const catalogByName = new Map((catalog.data ?? []).map((tool) => [tool.name, tool]));
  type ToolGap = { name: string; state: 'missing' | 'disabled' | 'changed' | 'unbound' };
  const toolGaps: ToolGap[] = [];
  for (const tool of requiredTools) {
    if (tool.built_in || isBuiltIn(tool.name)) continue;
    const entry = entriesByName.get(tool.name);
    const row = catalogByName.get(tool.name);
    if (!entry) {
      toolGaps.push({ name: tool.name, state: 'unbound' });
    } else if (!row) {
      toolGaps.push({ name: tool.name, state: 'missing' });
    } else if (row.enabled !== true) {
      toolGaps.push({ name: tool.name, state: 'disabled' });
    } else if (entry.schema_hash && row.hash && entry.schema_hash !== row.hash) {
      toolGaps.push({ name: tool.name, state: 'changed' });
    }
  }
  const toolsDone = toolGaps.length === 0;

  // Models: usable wins; reasons render per row (credential gaps feed the
  // credentials row below — proven by the reason, never assumed).
  const allowedModels = (() => {
    const definition = template.definition as Record<string, unknown>;
    const policy = (definition.model_policy ?? {}) as Record<string, unknown>;
    return Array.isArray(policy.allowed_models) ? (policy.allowed_models as string[]) : [];
  })();
  const usableByRef = new Map((models.data ?? []).map((m) => [m.ref, m]));
  const modelGaps = allowedModels.filter((ref) => {
    const found = usableByRef.get(ref);
    return !found || !found.usable;
  });
  const credentialGaps = [...new Set(
    allowedModels.flatMap((ref) => {
      const found = usableByRef.get(ref);
      if (!found || found.usable) return [];
      return found.reasons.includes('provider_credential_missing') ? [ref] : [];
    }),
  )];
  // Credentials create = owner/admin tier (setup:govern mirrors it).
  const canConnect = canSetup(role, 'setup:govern');
  const credentialsDone = credentialGaps.length === 0;

  return (
    <div>
      <CheckRow>
        <CheckIcon $ok={knowledgeDone}>{knowledgeDone ? <Check size={15} /> : <X size={15} />}</CheckIcon>
        <CheckBody>
          <CheckTitle>Map knowledge ({requiredSlugs.length - missingSlugs.length}/{requiredSlugs.length} READY)</CheckTitle>
          {missingSlugs.length > 0 && (
            <div>Missing slugs: {missingSlugs.map((s) => <Mono key={s}>{s} </Mono>)} — <Link to="/agent-studio/knowledge">upload, rename, or connect</Link>.</div>
          )}
          {unreadySlugs.length > 0 && <div>Not READY yet: {unreadySlugs.join(', ')} — track ingestion in Knowledge.</div>}
          {duplicateSlugs.length > 0 && (
            <div><Muted>{duplicateSlugs.length} slug{duplicateSlugs.length === 1 ? '' : 's'} match multiple documents — showing the READY one (highest version).</Muted></div>
          )}
          {knowledgeDone && <Muted>{requiredSlugs.length === 0 ? 'No required sources.' : 'All required slugs resolve READY.'}</Muted>}
        </CheckBody>
      </CheckRow>
      <CheckRow>
        <CheckIcon $ok={toolsDone}>{toolsDone ? <Check size={15} /> : <X size={15} />}</CheckIcon>
        <CheckBody>
          <CheckTitle>Tool pins ({requiredTools.length - toolGaps.length}/{requiredTools.length} resolved)</CheckTitle>
          {toolGaps.length > 0 ? (
            <div>
              {toolGaps.map((gap) => (
                <div key={gap.name}>
                  <Mono>{gap.name}</Mono> —{' '}
                  {gap.state === 'missing' && 'no catalog row: instantiate from a tool template.'}
                  {gap.state === 'disabled' && 'catalog row disabled: enable it, or ask an admin.'}
                  {gap.state === 'changed' && 'pin drifted since install: re-pin to the live row.'}
                  {gap.state === 'unbound' && 'not bound on this assistant yet: bind it in the builder.'}
                </div>
              ))}{' '}
              <Link to="/agent-studio/tools">Open Tools →</Link>
            </div>
          ) : (
            <Muted>{requiredTools.length === 0 ? 'No required tools.' : 'Bound entries resolve against live, enabled catalog rows.'}</Muted>
          )}
        </CheckBody>
      </CheckRow>
      <CheckRow>
        <CheckIcon $ok={modelGaps.length === 0}>{modelGaps.length === 0 ? <Check size={15} /> : <X size={15} />}</CheckIcon>
        <CheckBody>
          <CheckTitle>Models ({allowedModels.length - modelGaps.length}/{allowedModels.length} usable)</CheckTitle>
          {modelGaps.length > 0 ? (
            <div>
              {modelGaps.map((ref) => {
                const reasons = usableByRef.get(ref)?.reasons ?? [];
                return (
                  <div key={ref}>
                    <Mono>{ref}</Mono>
                    {reasons.length > 0 && <> — {reasons.join(', ')}</>}
                  </div>
                );
              })}{' '}
              <Link to="/agent-studio/models">review reasons</Link> (credentials, enablements, residency).
            </div>
          ) : (
            <Muted>{allowedModels.length === 0 ? 'No declared models.' : 'Every declared model is usable at this org.'}</Muted>
          )}
        </CheckBody>
      </CheckRow>
      <CheckRow>
        <CheckIcon $ok={credentialsDone}>{credentialsDone ? <Check size={15} /> : <X size={15} />}</CheckIcon>
        <CheckBody>
          <CheckTitle>Credentials</CheckTitle>
          {credentialsDone ? (
            <Muted>No model is waiting on a credential.</Muted>
          ) : (
            <div>
              {credentialGaps.length} model{credentialGaps.length === 1 ? '' : 's'} need{credentialGaps.length === 1 ? 's' : ''} a provider credential.{' '}
              {canConnect ? (
                <Link to="/agent-studio/models">Connect in Models → Providers</Link>
              ) : (
                <Muted>Ask an owner or admin to connect it — credentials need elevated roles.</Muted>
              )}
            </div>
          )}
        </CheckBody>
      </CheckRow>
    </div>
  );
}
