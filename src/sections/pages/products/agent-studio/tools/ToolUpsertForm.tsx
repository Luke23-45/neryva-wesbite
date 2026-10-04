import { useState } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { Wrench } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { Panel } from '@components/common/ui/Panel';
import { TextInput } from '@components/common/ui/TextInput';
import { TextArea } from '@components/common/ui/TextArea';
import { ActionButton } from '@components/common/ui/ActionButton';
import { Dropdown } from '@components/common/ui/Dropdown';
import { pageItem } from '@styles/motion';
import {
  useUpsertTool,
  TOOL_EFFECT_CLASSES,
  TOOL_APPROVAL_REQUIREMENTS,
  TOOL_NAME_PATTERN,
  type ToolCatalogEntry,
} from '@hooks/studio/useSetupTools';
import { useDirtyGuard } from '@/sections/pages/products/agent-studio/StudioShell/useDirtyGuard';
import { SectionBackRow } from './SectionBackRow';

const Mono = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
`;

const FieldLabel = styled.label`
  font-size: 13px;
  display: block;
`;


const ActionsRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
`;

const DEFAULT_SCHEMA_TEXT = '{\n  "type": "object",\n  "properties": {},\n  "additionalProperties": false\n}';

/**
 * Register / edit tool form — dedicated section replacing the UpsertModal
 * (O-1). Validation, copy, permission implications, and the save payload are
 * byte-identical to the modal version:
 *
 * - Name is path-authoritative and lowercased (locked on edit — the engine
 *   PUT addresses tools/:name).
 * - Endpoint URL + credential are create-only and sealed (the engine never
 *   returns the credential); edits omit both and the engine preserves the
 *   existing binding and sealed credential.
 * - A4-60 — fields the form does not render (output schema, execution
 *   environment, egress allowlist, annotations) round-trip on edit so a
 *   save only changes what was shown.
 * - A4-66 — the engine PUT is an upsert: a colliding name replaces the row
 *   in place with no conflict error. The amber warning says so.
 * - NG-MT-1 — rate limit per run is optional; blank omits it (create →
 *   platform cap; edit → the engine preserves the stored value).
 *
 * On success the section navigates back to the tools list (the modal's
 * onClose equivalent).
 */
export function ToolUpsertForm({
  mode,
  initial,
  existingNames,
}: {
  mode: 'new' | 'edit';
  /** Null on register; the resolved catalog row on edit. */
  initial: ToolCatalogEntry | null;
  existingNames: string[];
}) {
  const navigate = useNavigate();
  const upsert = useUpsertTool();
  const editing = mode === 'edit';

  const [name, setName] = useState(initial?.name ?? '');
  const [version, setVersion] = useState(initial?.version ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [effectClass, setEffectClass] = useState<string>(initial?.effectClass ?? 'READ_ONLY');
  const [approval, setApproval] = useState<string>(initial?.approvalRequirement ?? 'NONE');
  const [inputSchema, setInputSchema] = useState(
    initial?.inputSchema ? JSON.stringify(initial.inputSchema, null, 2) : DEFAULT_SCHEMA_TEXT,
  );
  // A4-69 — custom tools need an endpoint to be invocable. Without a URL the
  // row is registered schema-only (external_gateway, no endpoint, no egress).
  const [endpointUrl, setEndpointUrl] = useState('');
  const [credential, setCredential] = useState('');
  const urlTrimmed = endpointUrl.trim();
  const urlProblem = !editing && urlTrimmed !== '' && !/^https:\/\//.test(urlTrimmed) ? 'Must be an https URL.' : null;
  // NG-MT-1 — rate limit per run: mirrors the From-template modal input
  // (same bounds, same copy). Optional; blank omits it (create → platform
  // cap; edit → the engine preserves the stored value when omitted).
  const [rateLimit, setRateLimit] = useState(initial?.rateLimitPerRun != null ? String(initial.rateLimitPerRun) : '');
  const rateTrimmed = rateLimit.trim();
  const rateProblem = rateTrimmed === '' ? null : !Number.isFinite(Number(rateTrimmed)) || Number(rateTrimmed) < 1 ? 'Must be a number ≥ 1.' : null;

  const normalized = name.trim().toLowerCase();
  const nameProblem = !normalized ? 'Name is required.' : !TOOL_NAME_PATTERN.test(normalized) ? 'Must match ^[a-z][a-z0-9_]{1,63}$ (letter first, 2–64 chars).' : null;
  // A4-66 — the engine PUT is an upsert: a colliding name replaces the row
  // in place (schema, version, hash) with no conflict error. Say so.
  const collides = !editing && !nameProblem && existingNames.includes(normalized);
  let schemaProblem: string | null = null;
  let schemaParsed: Record<string, unknown> | null = null;
  try {
    const parsed: unknown = JSON.parse(inputSchema);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      schemaProblem = 'Must be a JSON Schema object.';
    } else {
      schemaParsed = parsed as Record<string, unknown>;
    }
  } catch {
    schemaProblem = 'Must be valid JSON.';
  }

  const valid = !nameProblem && !schemaProblem && !urlProblem && !rateProblem;

  // Dirty guard: block navigation while the form has unsent content.
  const initialVersion = initial?.version ?? '';
  const initialDescription = initial?.description ?? '';
  const initialEffectClass = initial?.effectClass ?? 'READ_ONLY';
  const initialApproval = initial?.approvalRequirement ?? 'NONE';
  const initialSchemaText = initial?.inputSchema ? JSON.stringify(initial.inputSchema, null, 2) : DEFAULT_SCHEMA_TEXT;
  const initialRateLimit = initial?.rateLimitPerRun != null ? String(initial.rateLimitPerRun) : '';
  const dirty = editing
    ? version !== initialVersion ||
      description !== initialDescription ||
      effectClass !== initialEffectClass ||
      approval !== initialApproval ||
      inputSchema !== initialSchemaText ||
      rateLimit !== initialRateLimit
    : name.trim() !== '' ||
      version.trim() !== '' ||
      description.trim() !== '' ||
      endpointUrl.trim() !== '' ||
      credential !== '' ||
      effectClass !== 'READ_ONLY' ||
      approval !== 'NONE' ||
      rateLimit.trim() !== '' ||
      inputSchema !== DEFAULT_SCHEMA_TEXT;
  const { dialog: dirtyDialog } = useDirtyGuard(
    dirty,
    editing
      ? 'You have unsent tool changes. Leaving now discards them.'
      : 'You have an unsent tool draft. Leaving now discards it.',
  );

  const submit = () => {
    if (!valid || !schemaParsed || upsert.isPending) {
      return;
    }
    const rate = rateLimit.trim() === '' ? undefined : Number(rateLimit);
    upsert.mutate(
      {
        name: normalized,
        effectClass,
        approvalRequirement: approval,
        inputSchema: schemaParsed,
        // A4-60 — clearing Version while editing keeps the current
        // version; omitting it would let the server reset to 1.0.0.
        version: version.trim() ? version.trim() : editing ? (initial?.version ?? undefined) : undefined,
        ...(description.trim() ? { description: description.trim() } : {}),
        // A4-60 — fields the modal does not render round-trip
        // unchanged so an edit only changes what was edited.
        ...(editing && initial?.outputSchema ? { outputSchema: initial.outputSchema } : {}),
        ...(editing && initial?.executionEnvironment ? { executionEnvironment: initial.executionEnvironment } : {}),
        ...(editing && initial?.allowedEgressDomains ? { allowedEgressDomains: initial.allowedEgressDomains } : {}),
        ...(editing && initial?.annotations ? { annotations: initial.annotations } : {}),
        // A4-69 — create-only: endpoint binding + credential so a
        // custom tool can actually be invoked. Edits omit both; the
        // engine preserves the existing binding and sealed
        // credential when absent.
        ...(!editing && urlTrimmed ? { httpBindingUrl: urlTrimmed } : {}),
        ...(!editing && credential.trim() ? { credential: credential.trim() } : {}),
        // NG-MT-1 — mirrors the From-template modal input: bounded
        // int ≥ 1; omitted when blank (create → platform cap, edit
        // → the engine preserves the stored value).
        ...(rate !== undefined && Number.isFinite(rate) ? { rateLimitPerRun: Math.max(1, Math.round(rate)) } : {}),
      },
      {
        onSuccess: () => {
          navigate({ to: '/agent-studio/tools' });
        },
      },
    );
  };

  return (
    <ViewShell>
      {dirtyDialog}
      <SectionBackRow to="/agent-studio/tools">
        <span aria-hidden="true">‹</span> Tools
      </SectionBackRow>
      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewHeader>
          <ViewTitle>
            {editing ? `Edit tool ${initial?.name ?? ''}` : 'Register a tool'}
          </ViewTitle>
          <ViewSubtitle>
            {editing
              ? 'Only the fields shown here change — the endpoint binding and sealed credential stay as-is.'
              : 'Name is path-authoritative and lowercased. Endpoint URL and credential are create-only and seal on arrival.'}
          </ViewSubtitle>
        </ViewHeader>
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <Panel title="Tool" subtitle={editing ? 'Editable fields — everything else round-trips unchanged.' : 'Name, endpoint binding, and input schema.'}>
          {editing && (
            <p style={{ fontSize: 12, opacity: 0.7 }}>
              Saving updates the row in place, re-enables it, and re-hashes — pinned versions drift until re-pinned.
              Only the fields shown here change; the perimeter (execution environment, egress allowlist), endpoint
              binding, annotations, and output schema are preserved as-is.
            </p>
          )}
          {collides && (
            <p style={{ fontSize: 12, color: '#fbbf24', marginBottom: 8 }} role="alert">
              A tool named “{normalized}” already exists — saving replaces its schema, version, and hash in place
              (re-enables it too). Pinned versions on the old schema drift until re-pinned.
            </p>
          )}
          <TextInput label="Name (path-authoritative, lowercased)" name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="lookup_ticket" autoFocus={!editing} disabled={editing} error={nameProblem ?? undefined} />
          <div style={{ marginTop: 12 }}>
            <TextInput label="Version (bump on breaking schema changes)" name="version" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.0.0" />
          </div>
          <div style={{ marginTop: 12 }}>
            <TextInput label="Description (optional, ≤2048)" name="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this tool does" />
          </div>
          {!editing && (
            <>
              <div style={{ marginTop: 12 }}>
                <TextInput
                  label="Endpoint URL (optional — https)"
                  name="endpointUrl"
                  value={endpointUrl}
                  onChange={(e) => setEndpointUrl(e.target.value)}
                  placeholder="https://…"
                  error={urlTrimmed ? (urlProblem ?? undefined) : undefined}
                />
                <p style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                  Without an endpoint the tool registers schema-only (external_gateway, no egress) and can never be
                  invoked — versions can pin it, but no run can call it. With an endpoint it binds like a template tool.
                </p>
              </div>
              <div style={{ marginTop: 12 }}>
                <TextInput
                  label="Credential (optional — sealed per-tool, never returned)"
                  name="credential"
                  type="password"
                  value={credential}
                  onChange={(e) => setCredential(e.target.value)}
                  placeholder="…"
                  autoComplete="off"
                />
              </div>
            </>
          )}
          {editing && (
            <p style={{ fontSize: 12, opacity: 0.7, marginTop: 12 }}>
              The endpoint binding and credential are preserved as-is — this form cannot change them. To rotate the
              credential or re-point the endpoint, re-instantiate from a template (or re-register with the same name).
            </p>
          )}
          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <FieldLabel style={{ flex: 1 }}>
              Effect class
              <div style={{ marginTop: 4 }}>
                <Dropdown
                  variant="select"
                  aria-label="Effect class"
                  value={effectClass}
                  onChange={(v) => setEffectClass(v)}
                  items={TOOL_EFFECT_CLASSES.map((value) => ({ value, label: value }))}
                />
              </div>
            </FieldLabel>
            <FieldLabel style={{ flex: 1 }}>
              Approval requirement
              <div style={{ marginTop: 4 }}>
                <Dropdown
                  variant="select"
                  aria-label="Approval requirement"
                  value={approval}
                  onChange={(v) => setApproval(v)}
                  items={TOOL_APPROVAL_REQUIREMENTS.map((value) => ({ value, label: value }))}
                />
              </div>
            </FieldLabel>
          </div>
          <div style={{ marginTop: 12 }}>
            {/*
              NG-MT-1 (console field audit): the engine validates, stores, and
              enforces rate_limit_per_run, but the old register modal never
              exposed it — only the From-template modal did. Same bounds and
              copy as that input. On edit the stored value prefills; clearing
              the field leaves the stored limit unchanged (the engine
              preserves it when omitted).
            */}
            <TextInput label="Rate limit per run (optional)" name="rateLimit" type="number" value={rateLimit} onChange={(e) => setRateLimit(e.target.value)} placeholder="unset = platform cap" error={rateTrimmed ? (rateProblem ?? undefined) : undefined} />
            {editing && initial?.rateLimitPerRun != null && (
              <p style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                Currently {initial.rateLimitPerRun}/run — clearing the field leaves the stored limit unchanged.
              </p>
            )}
          </div>
          <div style={{ marginTop: 12 }}>
            {/*
              Gap #21 (console field audit): the engine enforces a 16 KiB
              serialized-size limit and a 32-level nesting limit on input_schema
              (`assertInputSchemaShape` → 400). Disclose them here so an oversized
              schema fails client-side expectations, not server-side surprise.
            */}
            <TextArea
              label="Input schema (JSON Schema object)"
              name="inputSchema"
              value={inputSchema}
              onChange={(e) => setInputSchema(e.target.value)}
              rows={8}
              hint="The engine enforces a 16 KiB serialized-size limit and a 32-level nesting limit (400 beyond)."
            />
            {schemaProblem && <p style={{ fontSize: 12, color: '#f87171' }}>{schemaProblem}</p>}
          </div>
          {/*
            Gaps #24/#25 (console field audit): execution_environment and
            allowed_egress_domains are API-managed — the console cannot author
            them. New tools default to external_gateway with egress limited to the
            binding host (schema-only tools get no egress); edits round-trip the
            stored values. The effective perimeter is shown in the tool's detail
            drawer. State this so the absence of fields reads as deliberate, not
            missing.
          */}
          <p style={{ fontSize: 12, opacity: 0.65, marginTop: 12 }}>
            Execution environment and egress allowlist are set via the API: new tools run as{' '}
            <Mono>external_gateway</Mono> with egress limited to the binding host (schema-only tools get no egress).
            The effective perimeter is shown in the tool&apos;s detail drawer.
          </p>
          <ActionsRow>
            <ActionButton variant="secondary" onClick={() => navigate({ to: '/agent-studio/tools' })}>
              Cancel
            </ActionButton>
            <ActionButton disabled={!valid || upsert.isPending} onClick={submit}>
              <Wrench size={13} strokeWidth={1.8} />
              Save tool
            </ActionButton>
          </ActionsRow>
        </Panel>
      </motion.div>
    </ViewShell>
  );
}
