import { Link } from '@tanstack/react-router';
import { Panel } from '@components/common/ui/Panel';
import { StatusPill } from '@components/common/ui/StatusPill';
import { useAssistantDefinition } from '@hooks/studio/useAgentAuthoring';
import { useModelCosts } from '@hooks/studio/useSetupModels';
import {
  CAP_LABELS,
  ESTIMATE_COPY,
  FAIL_CLOSED_COPY,
  PUBLISH_COPY,
  cachedPriceLine,
  describeCap,
  estimateRun,
  formatEstimate,
  formatRatePer1k,
  gradeBudget,
  type BudgetCapKey,
} from '@/sections/pages/products/agent-studio/builder/lib/budget-model';
import { EmptyNote, LOADING_POLICY_COPY, SpecItem, SpecList, Whisper } from './primitives';

const CAP_KEYS: BudgetCapKey[] = ['max_cost_cents', 'max_total_tokens', 'max_tool_calls', 'max_model_calls', 'wall_clock_seconds'];

/**
 * Read-only budget panel on the agent detail page (C09 PLAN §6, approved mock
 * `design_budget_panel_dark.svg`): caps with unset-vs-zero resolution, rough
 * estimate lines per allowed model, fail-closed note. READ-ONLY — edits live
 * in the builder budget satellite and the editor; this panel deep-links out
 * and never forks them. Estimates are labeled rough; measured spend lives in
 * Usage (linked, never duplicated).
 */
export function BudgetPanel({ agentId }: { agentId: string }) {
  const form = useAssistantDefinition(agentId, { prefer: 'active' });
  const costs = useModelCosts();
  const definition = form.data?.definition ?? null;

  const budget = definition?.budget ?? {};
  const allowed = definition?.model_policy.allowed_models ?? [];
  const costsByRef = new Map((costs.data ?? []).map((c) => [c.ref, c]));
  // Estimate scale: the agent's own token cap when set (worst-case run),
  // else a 20k reference scale, labeled as such.
  const estimateTokens = budget.max_total_tokens ?? 20_000;
  const estimateScaleNote =
    budget.max_total_tokens !== undefined
      ? `per ${estimateTokens.toLocaleString()}-token run (your cap)`
      : 'per 20k-token run (reference scale)';
  const pricedFor = (ref: string) => {
    const cost = costsByRef.get(ref);
    if (!cost) return null;
    return {
      ref,
      costMicrosPer1kInput: cost.costMicrosPer1kInput,
      costMicrosPer1kOutput: cost.costMicrosPer1kOutput,
      costMicrosPer1kCachedInput: cost.costMicrosPer1kCachedInput,
    };
  };
  const singlePriced = allowed.length === 1 ? pricedFor(allowed[0]) : null;
  const estimateMicros = singlePriced ? (estimateRun(estimateTokens, singlePriced)?.micros ?? null) : null;
  const grade = gradeBudget(budget, estimateMicros);
  const capped = budget.max_cost_cents !== undefined && budget.max_cost_cents > 0;

  return (
    <Panel
      title="Budget"
      subtitle="Cost and time guardrails for every run."
    >
      {!definition ? (
        <EmptyNote>{LOADING_POLICY_COPY}</EmptyNote>
      ) : (
        <>
          <p style={{ margin: '0 0 8px' }}>
            <StatusPill tone={capped ? 'success' : 'warning'} dot={false}>
              {grade.subtitle}
            </StatusPill>
          </p>
          <SpecList>
            {CAP_KEYS.map((key) => {
              const described = describeCap(key, budget[key]);
              const loud = key === 'max_cost_cents' && !capped;
              return (
                <SpecItem key={key}>
                  <StatusPill tone={loud ? 'warning' : 'success'} dot={false}>
                    {CAP_LABELS[key]}
                  </StatusPill>
                  <span>
                    {described.state}{described.whisper !== '' ? ` — ${described.whisper}` : ''}
                  </span>
                </SpecItem>
              );
            })}
          </SpecList>
          <Whisper>{ESTIMATE_COPY}</Whisper>
          <SpecList>
            {allowed.length === 0 ? (
              <SpecItem>
                <span>Pick a model in Brain — estimates need a priced model, never a fake $0.</span>
              </SpecItem>
            ) : (
              allowed.map((ref) => {
                const cost = costsByRef.get(ref);
                if (!cost) {
                  return (
                    <SpecItem key={ref}>
                      <StatusPill tone="neutral" dot={false}>
                        {ref}
                      </StatusPill>
                      <span>{costs.isPending ? 'loading prices…' : 'unpriced'}</span>
                    </SpecItem>
                  );
                }
                const cached = cachedPriceLine({
                  ref,
                  costMicrosPer1kInput: cost.costMicrosPer1kInput,
                  costMicrosPer1kOutput: cost.costMicrosPer1kOutput,
                  costMicrosPer1kCachedInput: cost.costMicrosPer1kCachedInput,
                });
                const estimate =
                  allowed.length === 1
                    ? estimateRun(estimateTokens, {
                        ref,
                        costMicrosPer1kInput: cost.costMicrosPer1kInput,
                        costMicrosPer1kOutput: cost.costMicrosPer1kOutput,
                        costMicrosPer1kCachedInput: cost.costMicrosPer1kCachedInput,
                      })
                    : null;
                return (
                  <SpecItem key={ref}>
                    <StatusPill tone="info" dot={false}>
                      {ref}
                    </StatusPill>
                    <span>
                      in {cost.costMicrosPer1kInput !== null ? formatRatePer1k(cost.costMicrosPer1kInput) : 'unpriced'}
                      {cached ? ` · ${cached}` : ''} · out{' '}
                      {cost.costMicrosPer1kOutput !== null ? formatRatePer1k(cost.costMicrosPer1kOutput) : 'unpriced'}
                      {estimate ? ` → ${formatEstimate(estimate.micros)} ${estimateScaleNote}` : ''}
                    </span>
                  </SpecItem>
                );
              })
            )}
          </SpecList>
          <Whisper>{FAIL_CLOSED_COPY}</Whisper>
          <Whisper>{PUBLISH_COPY}</Whisper>
          <Whisper>
            <Link to="/agent-studio/usage">Open Usage (measured) →</Link>
          </Whisper>
        </>
      )}
    </Panel>
  );
}
