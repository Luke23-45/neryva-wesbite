import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { useNavigate } from '@tanstack/react-router';
import { Zap } from 'lucide-react';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { Panel } from '@components/common/ui/Panel';
import { TextInput } from '@components/common/ui/TextInput';
import { ActionButton } from '@components/common/ui/ActionButton';
import { QueryView } from '@components/common/ui/AsyncStates';
import { pageItem } from '@styles/motion';
import {
  useToolCatalog,
  useToolTemplates,
  useToolFromTemplate,
} from '@hooks/studio/useSetupTools';
import { canSetup } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import { useDirtyGuard } from '@/sections/pages/products/agent-studio/StudioShell/useDirtyGuard';
import { SectionBackRow } from './SectionBackRow';

const TOOLS_PATH = '/agent-studio/tools';

/** Full route id (child of agentStudioToolsRoute, path '/instantiate'). */
export const TOOL_INSTANTIATE_ROUTE_ID = '/agent-studio/tools/instantiate' as const;

const ActionsRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
`;

const FieldWrap = styled.div`
  margin-top: 12px;
`;

const Label = styled.label`
  font-size: 13px;
  display: block;
`;

const Select = styled.select`
  display: block;
  width: 100%;
  margin-top: 4px;
`;

const CollideWarn = styled.p`
  font-size: 12px;
  color: #fbbf24;
  margin-top: 12px;
`;

const Muted = styled.span`
  opacity: 0.55;
`;

/**
 * Instantiate a tool from a prebuilt template — dedicated section replacing
 * the FromTemplateModal. Byte-faithful to the modal: template select,
 * A4-66 collision warning (instantiation upserts by template name),
 * https-URL validation, optional sealed credential, optional per-run rate
 * limit, Cancel / "Instantiate" (disabled until valid). Success returns to
 * the tools list, where the invalidated catalog shows the new row.
 *
 * Deliberate deviation (same as ToolNewSection): the collision set includes
 * disabled rows (includeDisabled: true). The old modal only warned when the
 * colliding tool was visible in the list (toggle-dependent); the engine
 * upserts the row regardless, so the warning now fires whenever a replace
 * would actually happen. Advisory only — it never blocks instantiation.
 */
export function ToolInstantiateSection() {
  const { role } = useOrg();
  const navigate = useNavigate();
  const canWrite = canSetup(role, 'setup:author');

  const templates = useToolTemplates({ enabled: canWrite });
  const catalog = useToolCatalog({ enabled: canWrite, includeDisabled: true });
  const instantiate = useToolFromTemplate();

  const [templateId, setTemplateId] = useState('');
  const [url, setUrl] = useState('');
  const [credential, setCredential] = useState('');
  const [rateLimit, setRateLimit] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Focus the heading on mount (preventScroll) — matches shell announcement pattern.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  // Non-author roles land here directly — bounce to the list (server gates
  // too). Nothing renders before the gate.
  useEffect(() => {
    if (!canWrite) {
      navigate({ to: TOOLS_PATH });
    }
  }, [canWrite, navigate]);

  // Dirty guard: unsent form content. Released on submit (submitted flag) —
  // after a committed instantiation there is nothing unsaved, so the
  // post-submit return must not trip the leave dialog.
  const dirty =
    !submitted && (templateId !== '' || url !== '' || credential !== '' || rateLimit !== '');
  const { dialog: dirtyDialog } = useDirtyGuard(dirty, 'You have an unsent tool instantiation. Leaving now discards it.');

  if (!canWrite) {
    return null;
  }

  const urlProblem = !url.trim() ? 'An https URL is required.' : !/^https:\/\//.test(url.trim()) ? 'Must be an https URL.' : null;
  const rateTrimmed = rateLimit.trim();
  const rateProblem = rateTrimmed === '' ? null : !Number.isFinite(Number(rateTrimmed)) || Number(rateTrimmed) < 1 ? 'Must be a number ≥ 1.' : null;
  const valid = templateId !== '' && !urlProblem && !rateProblem;
  // A4-66 — instantiation upserts by template name: warn before overwriting.
  const templateName = (templates.data ?? []).find((t) => t.id === templateId)?.name ?? null;
  const collides = templateName !== null && (catalog.data ?? []).map((t) => t.name).includes(templateName);

  const submit = () => {
    if (!valid || instantiate.isPending) {
      return;
    }
    const rate = rateLimit.trim() === '' ? undefined : Number(rateLimit);
    setSubmitted(true);
    instantiate.mutate(
      {
        templateId,
        url: url.trim(),
        ...(credential.trim() ? { credential: credential.trim() } : {}),
        ...(rate !== undefined && Number.isFinite(rate) ? { rateLimitPerRun: Math.max(1, Math.round(rate)) } : {}),
      },
      {
        onSuccess: () => navigate({ to: TOOLS_PATH }),
        // A failed instantiation leaves the form intact — restore the dirty
        // guard so the user's unsent input stays protected.
        onError: () => setSubmitted(false),
      },
    );
  };

  return (
    <ViewShell>
      {dirtyDialog}
      <SectionBackRow to={TOOLS_PATH}>
        <span aria-hidden="true">‹</span> Tools
      </SectionBackRow>
      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewHeader>
          <ViewTitle ref={headingRef} tabIndex={-1}>Instantiate from template</ViewTitle>
          <ViewSubtitle>
            Pick a prebuilt tool template, point it at an endpoint, and pin it into the catalog.
            Instantiation upserts by template name — re-instantiating replaces the row in place.
          </ViewSubtitle>
        </ViewHeader>
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <Panel title="Prebuilt tool" subtitle="The endpoint URL is create-only; the credential is sealed per tool, never in the manifest.">
          <QueryView query={templates}>
            {(rows) =>
              rows.length === 0 ? (
                <Muted>No prebuilt tool templates published.</Muted>
              ) : (
                <>
                  <Label>
                    Template
                    <Select value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                      <option value="">Pick a template…</option>
                      {rows.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} — {t.effectClass} / {t.approvalRequirement}
                        </option>
                      ))}
                    </Select>
                  </Label>
                  {collides && (
                    <CollideWarn role="alert">
                      A tool named “{templateName}” already exists — instantiating replaces its schema, binding, and hash in
                      place (re-enables it too). Pinned versions on the old schema drift until re-pinned.
                    </CollideWarn>
                  )}
                  <FieldWrap>
                    <TextInput label="Endpoint URL (https)" name="instantiate-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" error={url.trim() ? (urlProblem ?? undefined) : undefined} />
                  </FieldWrap>
                  <FieldWrap>
                    <TextInput
                      label="Credential (optional — sealed per-tool, never in the manifest)"
                      name="instantiate-credential"
                      type="password"
                      value={credential}
                      onChange={(e) => setCredential(e.target.value)}
                      placeholder="…"
                      autoComplete="off"
                    />
                  </FieldWrap>
                  <FieldWrap>
                    <TextInput label="Rate limit per run (optional)" name="instantiate-rate-limit" type="number" value={rateLimit} onChange={(e) => setRateLimit(e.target.value)} placeholder="unset = platform cap" error={rateTrimmed ? (rateProblem ?? undefined) : undefined} />
                  </FieldWrap>
                  <ActionsRow>
                    <ActionButton variant="secondary" onClick={() => navigate({ to: TOOLS_PATH })}>
                      Cancel
                    </ActionButton>
                    <ActionButton disabled={!valid || instantiate.isPending} onClick={submit}>
                      <Zap size={13} strokeWidth={1.8} />
                      {instantiate.isPending ? 'Instantiating…' : 'Instantiate'}
                    </ActionButton>
                  </ActionsRow>
                </>
              )
            }
          </QueryView>
        </Panel>
      </motion.div>
    </ViewShell>
  );
}
