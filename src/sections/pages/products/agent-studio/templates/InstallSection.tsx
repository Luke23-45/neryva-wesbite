import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { Link, useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { Panel } from '@components/common/ui/Panel';
import { TextInput } from '@components/common/ui/TextInput';
import { ActionButton } from '@components/common/ui/ActionButton';
import { QueryView } from '@components/common/ui/AsyncStates';
import { pageItem } from '@styles/motion';
import { useCreateAssistant } from '@hooks/studio/useAgentAuthoring';
import { TEMPLATES_QUERY_KEY, useAssistantTemplates, type TemplateListEntry } from '@hooks/studio/useSetupTemplates';
import { canSetup } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import { describeBlockExpiry, matchTemplateBlock, useControlBlocks } from '@hooks/studio/useSetupOperate';
import { TEMPLATE_COPY, describeInstallOutcome, validateTemplateName } from '../builder/lib/template-model';
import { buildAgentBuildPath } from '../builder/lib/slot-model';
import { PostInstallChecklist } from './PostInstallChecklist';
import { BlockedBanner } from './TemplatesView.styles';
import { SectionBackRow } from './SectionBackRow';

const GALLERY_PATH = '/agent-studio/templates';

/** Full route id (child of agentStudioTemplatesRoute, path '/$templateId/install'). */
export const TEMPLATE_INSTALL_ROUTE_ID = '/agent-studio/templates/$templateId/install' as const;

/**
 * A-14 reveal-style markers: `templates:install:revealed:<assistantId>`
 * is written the moment the install succeeds, plus a per-template pointer
 * `templates:install:latest:<slug>` so a refresh can find the completed
 * install id (the assistant id is only known after the POST). A refresh
 * after success lands on an explicit "already completed" notice — the
 * checklist is never silently re-shown. Both keys are cleared on Done
 * (Close / Open in builder), so the next visit starts a clean form.
 */
const revealedKey = (installId: string) => `templates:install:revealed:${installId}`;
const latestKey = (slug: string) => `templates:install:latest:${slug}`;

function readInstalledId(slug: string): string | null {
  try {
    const latest = sessionStorage.getItem(latestKey(slug));
    if (!latest) return null;
    return sessionStorage.getItem(revealedKey(latest)) !== null ? latest : null;
  } catch {
    return null;
  }
}

function writeInstalled(slug: string, installId: string) {
  try {
    sessionStorage.setItem(revealedKey(installId), installId);
    sessionStorage.setItem(latestKey(slug), installId);
  } catch {
    /* storage blocked — the checklist still renders this mount */
  }
}

function clearInstalled(slug: string, installId: string | null) {
  try {
    if (installId) sessionStorage.removeItem(revealedKey(installId));
    sessionStorage.removeItem(latestKey(slug));
  } catch {
    /* storage blocked */
  }
}

const ActionsRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
`;

const BodyP = styled.p`
  font-size: 13px;
  opacity: 0.75;
`;

const AdvisoryP = styled.p`
  font-size: 13px;
`;

const ConfirmBox = styled.div`
  margin-top: 12px;
  font-size: 13px;
`;

const FieldWrap = styled.div`
  margin-top: 12px;
`;

const NoteP = styled.p`
  font-size: 12px;
  opacity: 0.65;
  margin-top: 8px;
`;

const OutcomeBox = styled.div`
  margin-top: 12px;
  font-size: 13px;
`;

/**
 * Install a template — dedicated section replacing the InstallWizard modal
 * (R-1). Byte-faithful to the modal: validated agent name (autofocused),
 * incompatibility advisory + control-block banner, re-install duplication
 * confirm, Cancel / "Install as draft" (disabled until valid), and the
 * post-install success state (PostInstallChecklist + Close / "Open in
 * builder — try the draft").
 *
 * R-1 return contract: the gallery "Install" and the builder banner update
 * CTA thread ?returnTo=<originating context>, guarded to /agent-studio/*
 * at every hop. Cancel/Close honor the guarded returnTo and fall back to
 * the gallery. Unknown template ids bounce to the gallery (server gates
 * the write too; the id can only arrive from a stale link).
 */
export function InstallSection() {
  const { role } = useOrg();
  const navigate = useNavigate();
  const canWrite = canSetup(role, 'setup:author');
  // Strict-from now that the route is registered in routes.tsx.
  const params = useParams({ from: TEMPLATE_INSTALL_ROUTE_ID });
  const search = useSearch({ strict: false }) as { returnTo?: unknown };
  const returnTo =
    typeof search.returnTo === 'string' && search.returnTo.startsWith('/agent-studio/')
      ? search.returnTo
      : null;

  const templates = useAssistantTemplates({ enabled: canWrite });
  const templateId = params.templateId ?? '';
  const entry = (templates.data ?? []).find((e) => e.template.slug === templateId) ?? null;
  const unknownId = !templates.isPending && !templates.isError && entry === null;

  // Role gate + unknown-id bounce before render (never denial panels).
  useEffect(() => {
    if (!canWrite) {
      navigate({ to: GALLERY_PATH });
    }
  }, [canWrite, navigate]);

  useEffect(() => {
    if (unknownId) {
      navigate({ to: GALLERY_PATH });
    }
  }, [unknownId, navigate]);

  if (!canWrite || unknownId) {
    return null;
  }

  return (
    <ViewShell>
      <SectionBackRow to={GALLERY_PATH}>
        <span aria-hidden="true">‹</span> Templates
      </SectionBackRow>
      <QueryView query={templates}>
        {(rows) => {
          const current = rows.find((e) => e.template.slug === templateId);
          return current ? (
            <InstallForm key={`${current.template.slug}@${current.template.version}`} entry={current} returnTo={returnTo} />
          ) : null;
        }}
      </QueryView>
    </ViewShell>
  );
}

function InstallForm({ entry, returnTo }: { entry: TemplateListEntry; returnTo: string | null }) {
  const { orgId, role } = useOrg();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const create = useCreateAssistant();
  const canReadBlocks = canSetup(role, 'setup:govern');
  const blocks = useControlBlocks({ enabled: canReadBlocks });
  const [name, setName] = useState(entry.template.slug);
  const [assistantId, setAssistantId] = useState<string | null>(null);
  const [confirmedReinstall, setConfirmedReinstall] = useState(false);
  // A refresh after a completed install lands here: the in-memory
  // assistantId is gone but the marker survives — explicit notice, never a
  // stale silent success.
  const [revealedId] = useState<string | null>(() => readInstalledId(entry.template.slug));

  const exitTarget = returnTo ?? GALLERY_PATH;
  const block = canReadBlocks && blocks.data
    ? matchTemplateBlock(blocks.data, entry.template.slug, entry.template.version)
    : null;
  const nameCheck = validateTemplateName(name);
  const nameProblem = nameCheck.ok ? null : nameCheck.error;
  const outcome = create.error ? describeInstallOutcome(create.error) : null;
  const needsConfirm = entry.installed && !confirmedReinstall && !assistantId;

  const done = (target: string) => {
    clearInstalled(entry.template.slug, assistantId ?? revealedId);
    navigate({ to: target });
  };

  const install = () => {
    if (nameProblem || create.isPending) {
      return;
    }
    create.mutate(
      { name: name.trim(), template: { slug: entry.template.slug, version: entry.template.version } },
      {
        onSuccess: (result) => {
          if (!result.assistantId) {
            toast.error('Install returned no assistant — try again.');
            return;
          }
          toast.success(`Installed ${entry.template.slug}@${entry.template.version} as a draft — never live`);
          writeInstalled(entry.template.slug, result.assistantId);
          setAssistantId(result.assistantId);
          // Installed flags live on the templates list — refresh them.
          void queryClient.invalidateQueries({ queryKey: [...TEMPLATES_QUERY_KEY, orgId, 'list'] });
        },
      },
    );
  };

  // R-1 parity: the old modal disabled Install for block-readers via the
  // block banner; install-time 409/403 stays the backstop.
  const installDisabled = block !== null || needsConfirm || nameProblem !== null || create.isPending;
  const installTitle = block !== null
    ? 'Install blocked — pick another template'
    : needsConfirm
      ? 'Confirm the duplication first'
      : nameProblem !== null
        ? nameProblem
        : 'Copy into a draft (one transaction)';

  const completedId = assistantId ?? revealedId;
  if (completedId && !assistantId) {
    // Already-revealed state (refresh after success): explicit notice with
    // safe recovery — the checklist is not silently re-shown.
    return (
      <>
        <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
          <ViewHeader>
            <ViewTitle>Install already completed</ViewTitle>
            <ViewSubtitle>
              {entry.template.slug}@{entry.template.version} was installed as a draft earlier this session — this
              confirmation was shown once. Nothing was re-installed.
            </ViewSubtitle>
          </ViewHeader>
        </ViewHeaderRow>
        <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
          <Panel title="Already completed" subtitle="The install finished before the refresh — pick up where you left off.">
            <ActionsRow>
              <ActionButton variant="secondary" onClick={() => done(exitTarget)}>
                Close
              </ActionButton>
              <ActionButton onClick={() => done(buildAgentBuildPath(completedId))}>
                Open in builder — try the draft
                <ArrowRight size={11} strokeWidth={1.8} />
              </ActionButton>
            </ActionsRow>
          </Panel>
        </motion.div>
      </>
    );
  }

  return (
    <>
      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewHeader>
          <ViewTitle>Install {entry.template.slug}@{entry.template.version}</ViewTitle>
          <ViewSubtitle>
            One transaction copies the template into a fresh assistant + DRAFT v0 + install row + provisioning outbox.
            The active pointer is untouched — nothing goes live.
          </ViewSubtitle>
        </ViewHeader>
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <Panel title="Install as draft" subtitle="The copy is the install — fulfillment rows bind afterward.">
          {!assistantId ? (
            <>
              <BodyP>
                One transaction copies the template into a fresh assistant + DRAFT v0 + install row + provisioning outbox. The active
                pointer is untouched — nothing goes live. {TEMPLATE_COPY.provisioningHonest}
              </BodyP>
              {!entry.compatible && (
                <AdvisoryP>
                  <AlertTriangle size={13} style={{ verticalAlign: -2 }} /> Incompatible at this org ({entry.reasons.map((r) => r.code).join(', ')}) —
                  unresolved tool pins block install; other rows are advisory. Resolve each row in the checklist, then install.
                </AdvisoryP>
              )}
              {block !== null && (
                <BlockedBanner>
                  Install blocked{block.reason ? ` — ${block.reason}` : ''} · {describeBlockExpiry(block.expiresAt)} · pick another template.
                </BlockedBanner>
              )}
              {needsConfirm && (
                <ConfirmBox>
                  <p>{TEMPLATE_COPY.reinstallConfirm}</p>
                  <ActionButton size="sm" variant="secondary" onClick={() => setConfirmedReinstall(true)}>
                    Install anyway — new assistant
                  </ActionButton>
                </ConfirmBox>
              )}
              <FieldWrap>
                <TextInput label="Agent name" name="install-agent-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={entry.template.slug} autoFocus error={nameProblem ?? undefined} hint="Unique per organization — duplicates refuse (409) with rename guidance." />
              </FieldWrap>
              <NoteP>{TEMPLATE_COPY.descriptionImmutable}</NoteP>
              {outcome && (
                <OutcomeBox role="alert">
                  <strong>{outcome.headline}</strong>
                  <p style={{ margin: '4px 0 0', opacity: 0.8 }}>{outcome.detail}</p>
                </OutcomeBox>
              )}
              <ActionsRow>
                <ActionButton variant="secondary" onClick={() => navigate({ to: exitTarget })}>
                  Cancel
                </ActionButton>
                <ActionButton disabled={installDisabled} title={installTitle} onClick={install}>
                  Install as draft
                </ActionButton>
              </ActionsRow>
            </>
          ) : (
            <>
              <PostInstallChecklist template={entry.template} assistantId={assistantId} role={role} />
              <NoteP>
                <Link to="/platform/audit">Recorded in Audit ›</Link>
              </NoteP>
              <ActionsRow>
                <ActionButton variant="secondary" onClick={() => done(exitTarget)}>
                  Close
                </ActionButton>
                <ActionButton onClick={() => done(buildAgentBuildPath(assistantId))}>
                  Open in builder — try the draft
                  <ArrowRight size={11} strokeWidth={1.8} />
                </ActionButton>
              </ActionsRow>
            </>
          )}
        </Panel>
      </motion.div>
    </>
  );
}
