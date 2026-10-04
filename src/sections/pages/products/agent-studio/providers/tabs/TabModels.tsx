/**
 * TabModels — Tab C: Models (organization model governance center).
 *
 * Two execution supergroups (doc 19 §3), never conflated:
 *   [1] Platform Managed — grouped by platform provider.
 *   [2] BYOK & Custom Endpoints — grouped by verified credential card
 *       (key label + secret fingerprint in the header).
 *
 * Per-model toggle → `POST /console/org/:orgId/models/toggles` via
 * `useModelToggles` (optimistic update + rollback on error; every write is
 * audited server-side). The same model served by both supergroups renders as
 * two distinct rows with explicit source labels.
 *
 * Honest tier gating (doc 19 §5): the full catalog is visible to every tier —
 * nothing is hidden. Models above the org's tier render a disabled toggle,
 * an explanatory tooltip, and an Upgrade CTA pointing at Settings → Pricing
 * (the page that owns plan purchase). While the tier is 'unknown' the switch
 * stays interactive and the server gates the write.
 *
 * Reasoning presets (doc 19 §9): the engine toggle endpoint (N-6) accepts
 * ONLY {supergroup, provider, model_id, credential_id, enabled} — there is
 * no engine field for an org-wide reasoning default. The presets and the
 * thinking-budget range therefore render as display-only with honest
 * "per-assistant in the builder" copy; nothing here is sent to the server.
 * Persisting lives in model_params.reasoning_budget_tokens on the assistant
 * (builder scope), versioned with its snapshot.
 */
import { useMemo, useState } from 'react';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { useOrg } from '@/Context/OrgContext';
import { Panel } from '@/components/common/ui/Panel';
import { Switch } from '@/components/common/ui/Switch';
import { Tooltip } from '@/components/common/ui/Tooltip';
import { EmptyState } from '@/components/common/ui/EmptyState';
import { Skeleton } from '@/components/common/ui/Skeleton/Skeleton';
import type { ModelGroupView, ModelRowView, Supergroup } from '../api';
import { useGroupedModels, useModelToggles, type GroupedModels } from '../hooks/useGroupedModels';
import { useOrgTier, tierCovers } from '../hooks/useOrgTier';
import { BlastRadiusConfirm } from '../components/BlastRadiusConfirm';
import { colors } from '../components/styles';

// ---------------------------------------------------------------------------
// Pure helpers (exported for tests)
// ---------------------------------------------------------------------------

/** Engine `reasons[]` codes rendered as human text (doc 19 §13).
 * Keys are the engine's real reason vocabulary: availability/N-5
 * (model-catalog.service.ts), template compatibility (templates.service.ts),
 * and the free-demo judgments (demo-policy.service.ts). Unknown codes fall
 * back to the raw snake_case words — never invented. */
function humanizeReason(reason: string): string {
  const known: Record<string, string> = {
    // Availability / N-5 (model-catalog.service.ts)
    subscription_required:
      'Not covered by your current plan — upgrade your plan to enable this model.',
    provider_not_enabled:
      'The provider behind this row is not enabled for your organization.',
    residency_unknown:
      'The data region for this model is not confirmed, so it stays unavailable until the region is known.',
    residency_incompatible:
      'This model is not available in your organization\u2019s data residency region.',
    model_disabled_by_org:
      'Disabled for this organization — turn the switch on to make it available again.',
    // Template compatibility (templates.service.ts)
    provider_credential_missing:
      'No verified provider credential is attached — connect a key before enabling.',
    // Free demo (demo-policy.service.ts)
    demo_provider_disabled: 'The free demo is currently turned off.',
    demo_conversation_limit_reached:
      'The weekly demo conversation allowance for this organization is used up.',
    demo_unavailable_with_credit_balance:
      'Demo replies are only offered to organizations without a credit balance.',
    demo_unavailable_with_provider_credential:
      'Demo replies are not offered while a verified provider key is connected.',
  };
  return known[reason] ?? reason.replace(/_/g, ' ');
}

/** `$2.50 / $10.00 per 1M tokens` — absent when the row is unpriced (never invented).
 * Operator-declared prices (PRV-035) are labeled as such, never presented
 * as verified catalog prices (Law VII). */
function priceLabel(model: ModelRowView): string | null {
  if (!model.pricing) return null;
  const base = `$${model.pricing.input_per_1m} / $${model.pricing.output_per_1m} per 1M tokens`;
  return model.pricing_source === 'operator_declared' ? `${base} (operator-declared)` : base;
}

const CAPABILITY_LABELS = {
  tools: 'Tools',
  vision: 'Vision',
  reasoning: 'Reasoning',
  structured_output: 'Structured output',
} as const;

function rowKey(supergroup: Supergroup, group: ModelGroupView, model: ModelRowView): string {
  return `${supergroup}:${group.credential_id ?? 'platform'}:${group.provider}:${model.model_id}`;
}

// ---------------------------------------------------------------------------
// Styling (flat dark-console neutrals — providers surface palette)
// ---------------------------------------------------------------------------

const Root = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Lead = styled.p`
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: ${colors.textDim};
  max-width: 780px;
`;

const SectionHead = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
`;

const SourceBadge = styled.span<{ $byok?: boolean }>`
  flex: none;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ $byok }) => ($byok ? '#7cc4ff' : '#9ee6b8')};
  border: 1px solid
    ${({ $byok }) => ($byok ? 'rgba(124, 196, 255, 0.45)' : 'rgba(158, 230, 184, 0.45)')};
  border-radius: 999px;
  padding: 3px 10px;
`;

const GroupCard = styled.div`
  border: 1px solid ${colors.border};
  border-radius: 12px;
  overflow: hidden;
  margin-top: 12px;
  background: ${colors.surface};
`;

const GroupHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.025);
  border-bottom: 1px solid ${colors.borderSoft};
`;

const GroupTitle = styled.h4`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: ${colors.text};
`;

const Fingerprint = styled.span`
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  color: ${colors.textFaint};
`;

const RowList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
`;

const ModelRowItem = styled.li<{ $pending?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 13px 16px;
  opacity: ${({ $pending }) => ($pending ? 0.55 : 1)};

  & + & {
    border-top: 1px solid ${colors.borderSoft};
  }
`;

const RowMain = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;

const Identity = styled.div`
  flex: 1;
  min-width: 0;
`;

const DisplayName = styled.div`
  font-size: 13.5px;
  font-weight: 600;
  color: ${colors.text};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ModelId = styled.div`
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11.5px;
  color: ${colors.textFaint};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Badges = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
`;

const Badge = styled.span`
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: ${colors.textDim};
  border: 1px solid ${colors.border};
  border-radius: 999px;
  padding: 2px 9px;
  white-space: nowrap;
`;

const TierBadge = styled(Badge)<{ $gated?: boolean }>`
  color: ${({ $gated }) => ($gated ? colors.warning : colors.textDim)};
  border-color: ${({ $gated }) => ($gated ? 'rgba(210, 153, 34, 0.55)' : colors.border)};
`;

const NoToolsBadge = styled(Badge)`
  color: ${colors.warning};
  border-color: rgba(210, 153, 34, 0.5);
`;

const PriceBadge = styled(Badge)`
  color: rgba(158, 230, 184, 0.9);
  border-color: rgba(63, 185, 80, 0.35);
  font-variant-numeric: tabular-nums;
`;

const Reasons = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
`;

const ReasonItem = styled.li`
  font-size: 12.5px;
  line-height: 1.5;
  color: ${colors.warning};
  display: flex;
  gap: 8px;
  align-items: flex-start;

  &::before {
    content: '•';
    flex: none;
  }
`;

const UpgradeLink = styled.a`
  display: inline-block;
  font-size: 12.5px;
  font-weight: 600;
  color: ${colors.accent};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const ReasoningToggle = styled.button`
  align-self: flex-start;
  border: none;
  background: none;
  padding: 0;
  font-size: 12.5px;
  font-weight: 500;
  color: rgba(77, 159, 255, 0.9);
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

const ReasoningPanel = styled.div`
  border: 1px dashed ${colors.border};
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const PresetChips = styled.div`
  display: flex;
  gap: 8px;
`;

const PresetChip = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${colors.textFaint};
  border: 1px solid ${colors.border};
  border-radius: 999px;
  padding: 4px 12px;
`;

const HonestCopy = styled.p`
  margin: 0;
  font-size: 12.5px;
  line-height: 1.6;
  color: ${colors.textDim};
`;

const BudgetRange = styled.span`
  font-size: 12px;
  color: ${colors.textFaint};
  font-variant-numeric: tabular-nums;
`;

const LearnMoreButton = styled.button`
  border: none;
  background: none;
  padding: 0;
  margin-top: 4px;
  font-size: 12.5px;
  font-weight: 500;
  color: rgba(77, 159, 255, 0.9);
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

const AboutDetail = styled.div`
  margin-top: 8px;
`;

const ErrorBox = styled.div`
  border: 1px solid rgba(248, 81, 73, 0.4);
  border-radius: 12px;
  background: rgba(248, 81, 73, 0.08);
  padding: 16px;
  font-size: 13px;
  color: rgba(255, 200, 200, 0.9);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const RetryButton = styled.button`
  flex: none;
  border: 1px solid ${colors.border};
  border-radius: 8px;
  background: transparent;
  color: ${colors.text};
  font-size: 13px;
  font-weight: 600;
  padding: 7px 14px;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
  }
`;

interface BlastTarget {
  supergroup: Supergroup;
  group: ModelGroupView;
  model: ModelRowView;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function TabModels() {
  const { orgId } = useOrg();
  const tier = useOrgTier();
  const { data, isPending, isError, refetch } = useGroupedModels(orgId);
  const toggles = useModelToggles(orgId);

  const [blastTarget, setBlastTarget] = useState<BlastTarget | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [reasoningOpen, setReasoningOpen] = useState<Record<string, boolean>>({});
  const [aboutOpen, setAboutOpen] = useState(false);

  const groups: GroupedModels = useMemo(() => data ?? { platform: [], byok: [] }, [data]);

  const commitToggle = (
    supergroup: Supergroup,
    group: ModelGroupView,
    model: ModelRowView,
    enabled: boolean,
  ) => {
    const key = rowKey(supergroup, group, model);
    setPendingKey(key);
    toggles.mutate(
      [
        {
          supergroup,
          provider: group.provider,
          model_id: model.model_id,
          // Nil UUID for platform rows — the api/engine layer applies the
          // sentinel; callers pass undefined for platform per the contract.
          credential_id: supergroup === 'byok' ? group.credential_id : undefined,
          enabled,
        },
      ],
      {
        onError: () => {
          toast.error('Could not save the model toggle — your previous settings were restored.');
        },
        onSettled: () => setPendingKey(null),
      },
    );
  };

  const handleToggle = (
    supergroup: Supergroup,
    group: ModelGroupView,
    model: ModelRowView,
    next: boolean,
  ) => {
    // Toggle-OFF of a model pinned by a live assistant needs the
    // blast-radius confirm — no silent downgrade (doc 20 §3.3).
    if (!next && model.pinned_by.length > 0) {
      setBlastTarget({ supergroup, group, model });
      return;
    }
    commitToggle(supergroup, group, model, next);
  };

  const toggleReasoning = (key: string) =>
    setReasoningOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  const renderRow = (supergroup: Supergroup, group: ModelGroupView, model: ModelRowView) => {
    const key = rowKey(supergroup, group, model);
    const covers = tierCovers(tier, model.required_product);
    // 'unknown' tier: indeterminate — the server gates the write, so the
    // switch stays interactive and no upgrade CTA renders.
    const gated = covers === false;
    const disabled = gated || !model.usable;
    const price = priceLabel(model);
    // Invariant: the switch can never render ON alongside a cannot-enable
    // warning. The visual state derives from the same availability object
    // that decides whether the warning row renders (`model.usable`).
    const on = model.enabled && model.usable;

    const switchNode = (
      <Switch
        checked={on}
        disabled={disabled}
        onChange={(next) => handleToggle(supergroup, group, model, next)}
        label={`${on ? 'Disable' : 'Enable'} ${model.display_name} (${
          supergroup === 'byok' ? `BYOK${group.credential_label ? ` ${group.credential_label}` : ''}` : 'platform'
        })`}
      />
    );

    return (
      <ModelRowItem key={key} $pending={pendingKey === key}>
        <RowMain>
          {gated ? (
            <Tooltip label={`Requires ${model.required_product_label} plan to enable`}>
              {switchNode}
            </Tooltip>
          ) : (
            switchNode
          )}
          <Identity>
            <DisplayName>{model.display_name}</DisplayName>
            <ModelId>
              {model.model_id}
              {supergroup === 'byok' ? ' · BYOK' : ''}
            </ModelId>
          </Identity>
          <Badges>
            {(Object.keys(CAPABILITY_LABELS) as Array<keyof typeof CAPABILITY_LABELS>).map((cap) =>
              model.capabilities[cap] ? <Badge key={cap}>{CAPABILITY_LABELS[cap]}</Badge> : null,
            )}
            {!model.capabilities.tools && (
              <NoToolsBadge title="Models without native tool calling cannot run assistants that use tools">
                Incompatible: no tool support
              </NoToolsBadge>
            )}
            {price && <PriceBadge>{price}</PriceBadge>}
            <TierBadge $gated={gated}>{model.required_product_label}</TierBadge>
          </Badges>
        </RowMain>

        {gated && (
          <div>
            <UpgradeLink href="/agent-studio/settings/pricing">
              Upgrade plan to enable {model.display_name}
            </UpgradeLink>
          </div>
        )}

        {!model.usable && model.reasons.length > 0 && (
          <Reasons aria-label="Why this model cannot be used">
            {model.reasons.map((r) => (
              <ReasonItem key={r}>{humanizeReason(r)}</ReasonItem>
            ))}
          </Reasons>
        )}

        {model.capabilities.reasoning && (
          <div>
            <ReasoningToggle
              type="button"
              onClick={() => toggleReasoning(key)}
              aria-expanded={reasoningOpen[key] === true}
            >
              {reasoningOpen[key] ? 'Hide reasoning presets' : 'Reasoning presets'}
            </ReasoningToggle>
            {reasoningOpen[key] && (
              <ReasoningPanel>
                <PresetChips aria-label="Reasoning effort presets (display only)">
                  <PresetChip aria-disabled="true">Fast</PresetChip>
                  <PresetChip aria-disabled="true">Standard</PresetChip>
                  <PresetChip aria-disabled="true">Deep reasoning</PresetChip>
                </PresetChips>
                <BudgetRange>Thinking budget range: 1,000 – 32,000 tokens</BudgetRange>
                <HonestCopy>
                  Reasoning effort is set per assistant in the builder — it is stored in
                  model_params.reasoning_budget_tokens and versioned with the assistant
                  snapshot. There is no engine field for an org-wide reasoning default
                  (the toggle endpoint accepts enable/disable only), so this page cannot
                  set it.
                </HonestCopy>
              </ReasoningPanel>
            )}
          </div>
        )}
      </ModelRowItem>
    );
  };

  const renderGroup = (supergroup: Supergroup, group: ModelGroupView) => (
    <GroupCard key={`${supergroup}:${group.provider}:${group.credential_id ?? 'platform'}`}>
      <GroupHeader>
        <GroupTitle>
          {supergroup === 'byok' && group.credential_label
            ? `${group.provider_display_name} — ${group.credential_label}`
            : group.provider_display_name}
        </GroupTitle>
        {supergroup === 'byok' && group.credential_fingerprint && (
          <Fingerprint>{group.credential_fingerprint}</Fingerprint>
        )}
      </GroupHeader>
      <RowList>{group.models.map((m) => renderRow(supergroup, group, m))}</RowList>
    </GroupCard>
  );

  if (isPending) {
    return (
      <Root aria-busy="true">
        <Skeleton $h="18px" $r="6px" />
        <Skeleton $h="280px" $r="14px" />
        <Skeleton $h="200px" $r="14px" />
      </Root>
    );
  }

  if (isError) {
    return (
      <Root>
        <ErrorBox>
          <span>Could not load the model catalog. Check your connection and try again.</span>
          <RetryButton type="button" onClick={() => void refetch()}>
            Retry
          </RetryButton>
        </ErrorBox>
      </Root>
    );
  }

  return (
    <Root>
      <Lead>
        Turn models on or off for your organization — platform and BYOK sources are listed
        separately.
      </Lead>
      <div>
        <LearnMoreButton
          type="button"
          onClick={() => setAboutOpen((v) => !v)}
          aria-expanded={aboutOpen}
        >
          {aboutOpen ? 'Hide details' : 'Learn more'}
        </LearnMoreButton>
        {aboutOpen && (
          <AboutDetail>
            <Lead>
              The same model from both sources is two distinct rows, so billing and routing stay
              unambiguous. Every model is visible at every plan; models above your tier show an
              honest badge and an upgrade path instead of being hidden.
            </Lead>
          </AboutDetail>
        )}
      </div>

      <section aria-label="Platform Managed">
        <SectionHead>
          <SourceBadge>Platform Managed</SourceBadge>
        </SectionHead>
        <Panel
          title="Platform Managed"
          subtitle="Neryva-operated pool — inference is billed to your plan credits."
        >
          {groups.platform.length === 0 ? (
            <EmptyState
              title="No platform models"
              description="The current catalog snapshot contains no platform models."
            />
          ) : (
            groups.platform.map((g) => renderGroup('platform', g))
          )}
        </Panel>
      </section>

      <section aria-label="BYOK and custom endpoints">
        <SectionHead>
          <SourceBadge $byok>BYOK &amp; Custom</SourceBadge>
        </SectionHead>
        <Panel
          title="BYOK & Custom Endpoints"
          subtitle="Your own keys — inference is billed directly by the provider, plus the platform fee."
        >
          {groups.byok.length === 0 ? (
            <EmptyState
              title="No connected credentials"
              description="Connect a key to see its discovered models here."
            />
          ) : (
            groups.byok.map((g) => renderGroup('byok', g))
          )}
        </Panel>
      </section>

      {blastTarget && (
        <BlastRadiusConfirm
          affected={blastTarget.model.pinned_by}
          actionLabel={`Disable ${blastTarget.model.display_name}`}
          onConfirm={() => {
            const t = blastTarget;
            setBlastTarget(null);
            commitToggle(t.supergroup, t.group, t.model, false);
          }}
          onCancel={() => setBlastTarget(null)}
        />
      )}
    </Root>
  );
}

// React.lazy in ProvidersPage requires the default export.
export default TabModels;
