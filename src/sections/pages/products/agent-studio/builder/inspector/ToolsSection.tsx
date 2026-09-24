import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { TextInput } from '@components/common/ui/TextInput';
import { Switch } from '@components/common/ui/Switch';
import { Segmented } from '@components/common/ui/Segmented';
import { ApiError } from '@lib/engine/client';
import { setupDeniedCopy } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import {
  useSaveDraftVersion,
  useUpdateDraftVersion,
  type AgentDefinition,
} from '@hooks/studio/useAgentAuthoring';
import {
  BUILT_IN_TOOLS,
  useToolCatalog,
  type ToolCatalogEntry,
} from '@hooks/studio/useSetupTools';
import type { ConsumerApproval, ConsumerTool, ToolAccess, ToolExecutionMode } from '@lib/engine/agent-payload';
import { checkDefinitionCaps } from '@lib/engine/setup-caps';
import { buildDraftPayload } from '../lib/draft-save';
import { useDraftAutosave } from '../lib/use-draft-autosave';
import {
  approvalMode,
  canBind,
  isBuiltinTool,
  pinState,
  perimeterView,
  repinHash,
  validateEntries,
  APPROVAL_PREVIEW_COPY,
  DRIFT_COPY,
  LINT_EFFECTFUL_COPY,
  SHADOW_COPY,
  TOOLS_MAX,
  UNBIND_COPY,
  SKIP_COPY,
} from '../lib/tools-model';
import { ConflictDialog } from './ConflictDialog';
import { StatusDot } from '../canvas/nodes/SlotNode.styles';
import { EmptyState, SectionLabel, Whisper, Wrap } from './InstructionsSection.styles';
import { StaticLabel, StaticRow } from './BrainSection.styles';
import {
  ControlLabel,
  ControlRow,
  FilterRow,
  MutedButton,
  RowGrid,
  TextButton,
  ToolActions,
  ToolCard,
  ToolFix,
  ToolHead,
  ToolMeta,
  ToolState,
  ToolTitle,
} from './ToolsSection.styles';

export interface ToolsSectionProps {
  assistantId: string;
  definition: AgentDefinition | null;
  versionId: string | null;
  versionHash: string | null;
  isDraft: boolean;
  canAuthor: boolean;
  onDirtyChange: (dirty: boolean) => void;
}

interface ConflictState {
  expectedHash: string;
  currentHash: string | null;
  attempted: string;
  attemptedDef: AgentDefinition;
}

function readEntries(definition: AgentDefinition): ConsumerTool[] {
  return definition.tools.map((t) => ({ ...t }));
}

/**
 * C06 mount — bound entries, catalog binding, perimeter consequence, approvals
 * consequence; the proven save machine (debounce, PUT/POST, 409 adopt, 412
 * dialog, dirty flag). Catalog authoring stays in the Tools library — the
 * builder binds entries and flips entry-local switches only.
 */
export function ToolsSection({
  assistantId,
  definition,
  versionId,
  versionHash,
  isDraft,
  canAuthor,
  onDirtyChange,
}: ToolsSectionProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { role } = useOrg();
  const denied = setupDeniedCopy(role, 'setup:author');

  // A4-67 — pin state must see disabled rows (a disabled bound tool is
  // "disabled", not "missing"). The bind picker below stays enabled-only.
  const catalog = useToolCatalog({ includeDisabled: true });

  const sourceKey = `${versionId ?? 'none'}:${versionHash ?? 'none'}`;
  const [docKey, setDocKey] = useState(sourceKey);
  const [entries, setEntries] = useState<ConsumerTool[]>(() => (definition ? readEntries(definition) : []));
  const [filter, setFilter] = useState('');
  const [conflict, setConflict] = useState<ConflictState | null>(null);
  const [adopting, setAdopting] = useState<string | null>(null);
  const sendHashRef = useRef('');

  const saveDraft = useSaveDraftVersion(canAuthor ? assistantId : null);
  const updateDraft = useUpdateDraftVersion(canAuthor ? assistantId : null, versionId);

  const source = useMemo(() => (definition ? readEntries(definition) : []), [definition]);
  const current = useMemo(() => JSON.stringify(entries), [entries]);
  const dirty = current !== JSON.stringify(source);

  if (docKey !== sourceKey && !dirty) {
    setDocKey(sourceKey);
    setEntries(source);
  } else if (docKey !== sourceKey) {
    setDocKey(sourceKey);
  }

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  const rows = useMemo(() => {
    const all = catalog.data ?? [];
    const byName = new Map(all.map((row) => [row.name, row]));
    // A4-67 — the bind picker offers enabled rows only; pin state (byName)
    // still resolves disabled rows so bound entries show "disabled".
    return { byName, list: all.filter((row) => row.enabled !== false) };
  }, [catalog.data]);

  const buildNext = useCallback((): AgentDefinition | null => {
    if (!definition) return null;
    return buildDraftPayload(definition, { tools: entries.map((e) => ({ ...e })) });
  }, [definition, entries]);

  const heldMessages = useMemo(() => {
    const messages: string[] = [];
    const check = validateEntries(entries);
    if (!check.ok) messages.push(check.message);
    const next = buildNext();
    if (next) {
      messages.push(
        ...checkDefinitionCaps(next)
          .filter((issue) => issue.path === 'tools' || issue.path.startsWith('tools[') || issue.path === 'secrets')
          .map((i) => i.message),
      );
    }
    return messages;
  }, [entries, buildNext]);
  const blocked = heldMessages.length > 0;
  const pending = saveDraft.isPending || updateDraft.isPending;

  const sourcePolicyJson = useMemo(
    () => (definition ? JSON.stringify({ tools: definition.tools }) : null),
    [definition],
  );
  const adoptingActive = adopting !== null && sourcePolicyJson !== adopting;

  const doSave = useCallback(() => {
    const next = buildNext();
    if (!canAuthor || !next || blocked || conflict) return;
    if (isDraft && versionId && versionHash) {
      sendHashRef.current = versionHash;
      updateDraft.mutate(
        { definition: next, expectedHash: versionHash },
        {
          onSuccess: () => undefined,
          onError: (error) => {
            if (error instanceof ApiError && error.status === 412) {
              const details =
                typeof error.details === 'object' && error.details !== null
                  ? (error.details as Record<string, unknown>)
                  : {};
              setConflict({
                expectedHash: versionHash,
                currentHash: typeof details.current === 'string' ? details.current : null,
                attempted: JSON.stringify({ tools: next.tools }),
                attemptedDef: next,
              });
            }
          },
        },
      );
      return;
    }
    saveDraft.mutate(next, {
      onSuccess: () => undefined,
      onError: (error) => {
        if (error instanceof ApiError && error.status === 409) {
          void queryClient.invalidateQueries({ queryKey: ['studio', 'assistants'] });
          toast.success('A draft opened elsewhere — resumed it. Your tools stay; the next save writes to it.');
        }
      },
    });
  }, [canAuthor, buildNext, blocked, conflict, isDraft, versionId, versionHash, updateDraft, saveDraft, queryClient]);

  // A2-23: shared autosave — 8s debounce plus an unmount flush so switching
  // sections persists pending edits instead of silently dropping them.
  useDraftAutosave(
    { canAuthor, dirty, blocked, conflict, adoptingActive, pending, definition },
    doSave,
    [current],
  );

  const patchEntry = useCallback((name: string, patch: Partial<ConsumerTool>) => {
    setEntries((prev) => prev.map((e) => (e.name === name ? { ...e, ...patch } : e)));
  }, []);

  const unbind = useCallback((name: string) => {
    setEntries((prev) => prev.filter((e) => e.name !== name));
    toast.success(`Unbound “${name}”. ${UNBIND_COPY}`);
  }, []);

  const bindRow = useCallback(
    (row: ToolCatalogEntry) => {
      const hold = canBind(entries.length);
      if (!hold.ok) {
        toast.error(hold.message);
        return;
      }
      if (entries.some((e) => e.name === row.name)) return;
      setEntries((prev) => [
        ...prev,
        {
          name: row.name,
          access: 'read',
          approval: 'never',
          ...(row.hash ? { schema_hash: row.hash } : {}),
          execution_mode: 'live',
        },
      ]);
      toast.success(`Bound “${row.name}”${row.hash ? ' with hash pin' : ' — no hash on the row yet, pin it when published'} — saves with the draft.`);
    },
    [entries],
  );

  const bindBuiltin = useCallback(
    (name: string) => {
      const hold = canBind(entries.length);
      if (!hold.ok) {
        toast.error(hold.message);
        return;
      }
      if (entries.some((e) => e.name === name)) return;
      setEntries((prev) => [...prev, { name, access: 'read', approval: 'never', execution_mode: 'live' }]);
      toast.success(`Bound “${name}” (built-in, no row needed) — saves with the draft.`);
    },
    [entries],
  );

  if (!definition) {
    return (
      <Wrap>
        <EmptyState>Loading the draft…</EmptyState>
      </Wrap>
    );
  }

  const q = filter.trim().toLowerCase();
  const visibleRows = rows.list.filter(
    (row) =>
      q === '' ||
      row.name.toLowerCase().includes(q) ||
      (row.effectClass ?? '').toLowerCase().includes(q) ||
      (row.approvalRequirement ?? '').toLowerCase().includes(q),
  );
  const visibleBuiltins = BUILT_IN_TOOLS.filter((name) => q === '' || name.toLowerCase().includes(q));

  const approvalRequired = entries.filter((entry) => {
    const row = rows.byName.get(entry.name) ?? null;
    return approvalMode(entry.approval, row?.approvalRequirement ?? null).mode === 'required';
  });

  return (
    <Wrap
      onKeyDown={(event) => {
        if (event.key === 'Escape' && event.target instanceof HTMLElement) {
          event.target.blur();
        }
      }}
    >
      {/* Block A · bound entries */}
      <div>
        <SectionLabel>
          BOUND · {entries.length} / {TOOLS_MAX}
        </SectionLabel>
        {entries.length === 0 ? (
          <ToolMeta>{SKIP_COPY}</ToolMeta>
        ) : (
          entries.map((entry) => {
            const builtin = isBuiltinTool(entry.name, BUILT_IN_TOOLS);
            const row = rows.byName.get(entry.name) ?? null;
            const pin = pinState(entry.schema_hash, row ? { hash: row.hash, version: row.version, enabled: row.enabled } : null, builtin);
            const verdict = approvalMode(entry.approval, row?.approvalRequirement ?? null);
            const tone = pin.kind === 'missing' || pin.kind === 'disabled' || pin.kind === 'stale' ? 'attention' : pin.kind === 'unpinned' ? 'info' : 'ok';
            const shadow = entry.execution_mode === 'shadow';
            return (
              <ToolCard key={entry.name} $tone={tone}>
                <ToolHead>
                  <StatusDot $status={tone === 'ok' ? 'ready' : tone} aria-hidden="true" />
                  <ToolTitle>{entry.name}</ToolTitle>
                  <ToolState>
                    {pin.kind === 'builtin' ? 'built-in' : pin.kind === 'ready' ? `${pin.version ?? '?'} ✓` : pin.kind === 'stale' ? 'stale' : pin.kind}
                  </ToolState>
                </ToolHead>
                <ToolMeta>
                  {builtin ? 'built-in · in_process, no egress' : (row?.effectClass ?? 'effect unknown')}
                  {' · '}approval {verdict.mode}
                  {verdict.source === 'catalog' ? ' (row escalates)' : verdict.source === 'entry' ? ' (entry asks)' : ''}
                  {' · '}{shadow ? 'shadow' : 'live'}{' · '}{entry.access}
                </ToolMeta>
                {shadow && <ToolFix>{SHADOW_COPY}</ToolFix>}
                {pin.kind === 'stale' && (
                  <ToolFix>
                    {`${DRIFT_COPY} Catalog is at ${pin.liveVersion ?? 'an unknown version'}.`}
                  </ToolFix>
                )}
                {pin.kind === 'missing' && (
                  <ToolFix>Not in the catalog or built-ins — publish refuses. Bind from the catalog or unbind it.</ToolFix>
                )}
                {pin.kind === 'disabled' && (
                  <ToolFix>The catalog row is disabled — publish refuses. Enable it in the Tools library or unbind it.</ToolFix>
                )}
                {pin.kind === 'unpinned' && <ToolFix>Pin discipline: no hash pin — legal, but the next catalog change drifts it silently.</ToolFix>}
                {canAuthor ? (
                  <>
                    <ControlRow>
                      <ControlLabel>Approval</ControlLabel>
                      <Segmented
                        options={[
                          { value: 'never', label: 'Never' },
                          { value: 'on_effect', label: 'On effect' },
                          { value: 'always', label: 'Always' },
                        ]}
                        value={entry.approval}
                        onChange={(value) => patchEntry(entry.name, { approval: value as ConsumerApproval })}
                        size="sm"
                        ariaLabel={`Approval for ${entry.name}`}
                      />
                    </ControlRow>
                    <ControlRow>
                      <ControlLabel>Access</ControlLabel>
                      <Segmented
                        options={[
                          { value: 'read', label: 'Read' },
                          { value: 'write', label: 'Write' },
                        ]}
                        value={entry.access}
                        onChange={(value) => patchEntry(entry.name, { access: value as ToolAccess })}
                        size="sm"
                        ariaLabel={`Access for ${entry.name}`}
                      />
                      <Switch
                        checked={shadow}
                        onChange={(next) => patchEntry(entry.name, { execution_mode: (next ? 'shadow' : 'live') as ToolExecutionMode })}
                        label={`Shadow ${entry.name}`}
                        id={`shadow-${entry.name}`}
                      />
                      <ControlLabel>Shadow</ControlLabel>
                    </ControlRow>
                    <ToolActions>
                      <MutedButton type="button" onClick={() => unbind(entry.name)} title={UNBIND_COPY}>
                        Unbind
                      </MutedButton>
                      {pin.kind === 'stale' && (() => {
                        const target = repinHash(row ? { hash: row.hash, version: row.version, enabled: row.enabled } : null);
                        return target ? (
                          <TextButton type="button" onClick={() => patchEntry(entry.name, { schema_hash: target })}>
                            {`Re-pin to ${row?.version ?? 'live'}`}
                          </TextButton>
                        ) : null;
                      })()}
                    </ToolActions>
                  </>
                ) : (
                  <ToolMeta>
                    {entry.approval} · {entry.access} · {shadow ? 'shadow' : 'live'}
                  </ToolMeta>
                )}
              </ToolCard>
            );
          })
        )}
        <ToolMeta>{UNBIND_COPY}</ToolMeta>
      </div>

      {/* Block B · bind from catalog */}
      <div>
        <SectionLabel>BIND FROM CATALOG</SectionLabel>
        {canAuthor ? (
          <>
            <FilterRow>
              <TextInput
                aria-label="Filter catalog"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder="Filter by name, effect, approval…"
              />
            </FilterRow>
            {catalog.isPending ? (
              <ToolMeta>Loading the catalog…</ToolMeta>
            ) : catalog.isError ? (
              <Whisper $tone="red">The catalog is unreachable — bound entries above still save; binding resumes on reload.</Whisper>
            ) : (
              <RowGrid>
                {visibleBuiltins
                  .filter((name) => !entries.some((e) => e.name === name))
                  .map((name) => (
                    <ToolCard key={name} $tone="info">
                      <ToolHead>
                        <ToolTitle>{name}</ToolTitle>
                        <ToolState>built-in</ToolState>
                      </ToolHead>
                      <ToolMeta>in_process · no egress · no row needed</ToolMeta>
                      <ToolActions>
                        <TextButton type="button" onClick={() => bindBuiltin(name)}>
                          Bind
                        </TextButton>
                      </ToolActions>
                    </ToolCard>
                  ))}
                {visibleRows
                  .filter((row) => !entries.some((e) => e.name === row.name))
                  .slice(0, 30)
                  .map((row) => (
                    <ToolCard key={row.name} $tone={row.enabled === false ? 'error' : 'info'}>
                      <ToolHead>
                        <ToolTitle>{row.name}</ToolTitle>
                        <ToolState>v{row.version ?? '?'}</ToolState>
                      </ToolHead>
                      <ToolMeta>
                        {row.effectClass ?? 'effect unknown'} · approval {row.approvalRequirement ?? 'unknown'}
                        {row.enabled === false ? ' · DISABLED — binding it publishes nothing' : ''}
                      </ToolMeta>
                      <ToolActions>
                        <TextButton type="button" disabled={row.enabled === false} title={row.enabled === false ? 'Disabled rows refuse publish — enable it in the Tools library first.' : `Bind ${row.name} with hash pin`} onClick={() => bindRow(row)}>
                          Bind with hash pin
                        </TextButton>
                      </ToolActions>
                    </ToolCard>
                  ))}
                {visibleBuiltins.length === 0 && visibleRows.length === 0 && (
                  <ToolMeta>No catalog rows match — register one in the Tools library.</ToolMeta>
                )}
              </RowGrid>
            )}
            <ToolMeta>Entry names: 2–64, lowercase/digits/underscores — no leading-letter rule. Catalog names keep their own rule.</ToolMeta>
          </>
        ) : (
          <StaticRow>
            <StaticLabel>Catalog</StaticLabel>
            <span>Binding needs an owner, admin, or developer — {denied}</span>
          </StaticRow>
        )}
      </div>

      {/* Block C · perimeter */}
      <div>
        <SectionLabel>PERIMETER · PINNED AT PUBLISH</SectionLabel>
        {entries.length === 0 ? (
          <ToolMeta>Nothing bound — nothing to perimeter.</ToolMeta>
        ) : (
          entries.map((entry) => {
            const builtin = isBuiltinTool(entry.name, BUILT_IN_TOOLS);
            const row = rows.byName.get(entry.name) ?? null;
            const view = perimeterView(
              row
                ? { executionEnvironment: row.executionEnvironment, allowedEgressDomains: row.allowedEgressDomains, bindingHost: row.bindingHost }
                : null,
              builtin,
            );
            return (
              <ToolCard key={entry.name} $tone="info">
                <ToolHead>
                  <ToolTitle>{entry.name}</ToolTitle>
                </ToolHead>
                {view.kind === 'builtin' ? (
                  <ToolMeta>in_process · no egress surface — platform-implemented.</ToolMeta>
                ) : view.kind === 'none' ? (
                  <ToolMeta>in_process · no egress surface — pure compute over arguments.</ToolMeta>
                ) : (
                  <>
                    <ToolMeta>
                      {view.environment}
                      {row?.executionEnvironment == null ? ' (catalog default — historical posture, not in_process)' : ''} · egress:{' '}
                      {view.domains.length === 0 ? (view.bindingCovered === null ? 'resolving…' : 'none declared') : view.domains.join(', ')}
                    </ToolMeta>
                    {view.bindingCovered === true && <ToolFix>Binding host covered ✓ · authorize denies on drift.</ToolFix>}
                    {view.bindingCovered === false && <ToolFix>Binding host NOT covered — the catalog row is invalid; fix it in the Tools library.</ToolFix>}
                  </>
                )}
              </ToolCard>
            );
          })
        )}
        <ToolMeta>Environments, egress, and enablement are catalog writes — owner/admin in the Tools library. Authorize denies on drift.</ToolMeta>
      </div>

      {/* Block D · approvals consequence */}
      <div>
        <SectionLabel>APPROVALS</SectionLabel>
        {approvalRequired.length === 0 ? (
          <ToolMeta>No entry requires approval — calls run without pausing. Effectful-without-approval rows are legal but linted: every call runs ungated.</ToolMeta>
        ) : (
          <>
            {approvalRequired.map((entry) => (
              <ToolCard key={entry.name} $tone="info">
                <ToolHead>
                  <ToolTitle>{entry.name}</ToolTitle>
                  <ToolState>approval required</ToolState>
                </ToolHead>
                <ToolFix>{APPROVAL_PREVIEW_COPY}</ToolFix>
              </ToolCard>
            ))}
            <ToolActions>
              <TextButton type="button" onClick={() => navigate({ to: '/agent-studio/approvals' })}>
                Open Approvals →
              </TextButton>
            </ToolActions>
          </>
        )}
        {entries.some((entry) => {
          const row = rows.byName.get(entry.name) ?? null;
          return !isBuiltinTool(entry.name, BUILT_IN_TOOLS) && row && row.effectClass !== null && row.effectClass !== 'READ_ONLY' && approvalMode(entry.approval, row.approvalRequirement).mode !== 'required';
        }) && <Whisper $tone="amber">{LINT_EFFECTFUL_COPY}</Whisper>}
      </div>

      {heldMessages.map((message) => (
        <Whisper key={message} $tone="red" role="alert">
          {message} Autosave held — fix it and saving resumes on its own.
        </Whisper>
      ))}

      {conflict && (
        <ConflictDialog
          assistantId={assistantId}
          attempted={conflict.attempted}
          expectedHash={conflict.expectedHash}
          currentHash={conflict.currentHash}
          pending={pending}
          selectTheirs={(live) => JSON.stringify({ tools: live.tools })}
          onReloadTheirs={(theirs) => {
            try {
              const parsed = JSON.parse(theirs) as { tools?: unknown };
              if (Array.isArray(parsed.tools)) {
                setEntries(
                  parsed.tools
                    .filter((t): t is Record<string, unknown> => typeof t === 'object' && t !== null)
                    .map((t) => ({
                      name: typeof t.name === 'string' ? t.name : '',
                      access: t.access === 'write' ? 'write' : ('read' as ToolAccess),
                      approval: (['never', 'on_effect', 'always'] as const).includes(t.approval as ConsumerApproval)
                        ? (t.approval as ConsumerApproval)
                        : ('never' as ConsumerApproval),
                      ...(typeof t.schema_hash === 'string' ? { schema_hash: t.schema_hash } : {}),
                      execution_mode: (t.execution_mode === 'shadow' ? 'shadow' : 'live') as ToolExecutionMode,
                    }))
                    .filter((e) => e.name !== ''),
                );
              }
            } catch {
              // Unparseable theirs: leave local state, still refetch below.
            }
            setConflict(null);
            setAdopting(theirs);
            void queryClient.invalidateQueries({ queryKey: ['studio', 'assistants'] });
            toast('Reloaded their version — review it, then keep editing or close.');
          }}
          onSaveMine={(freshHash) => {
            updateDraft.mutate(
              { definition: conflict.attemptedDef, expectedHash: freshHash },
              {
                onSuccess: () => {
                  toast.success('Saved over the latest version');
                  setConflict(null);
                },
                onError: (error) => {
                  if (error instanceof ApiError && error.status === 412) {
                    const details =
                      typeof error.details === 'object' && error.details !== null
                        ? (error.details as Record<string, unknown>)
                        : {};
                    setConflict({
                      expectedHash: freshHash,
                      currentHash: typeof details.current === 'string' ? details.current : conflict.currentHash,
                      attempted: conflict.attempted,
                      attemptedDef: conflict.attemptedDef,
                    });
                  }
                },
              },
            );
          }}
          onClose={() => setConflict(null)}
        />
      )}
    </Wrap>
  );
}
