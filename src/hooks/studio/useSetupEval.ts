/**
 * Eval harness (team_setup_ledger.md F-E2) over the EXACT contract
 * (`engine/src/modules/knowledge/harness-parity.controller.ts`,
 * `eval.service.ts`, `eval.schema.ts`, assistants `evaluateVersion`):
 *
 * - POST eval/datasets {name, description?} → {dataset};
 *   GET eval/datasets → {datasets};
 * - POST eval/datasets/:id/cases {cases! non-empty array} → service result;
 * - POST eval/runs {dataset_id!, assistant_version_id!, attempts_per_case?
 *   (clamped 1..5)} → {run} — DRAFT + PUBLISHED evaluate (R-2); RETIRED
 *   refuses; cross-org datasets 404;
 * - GET eval/runs?dataset_id? → {runs} (newest-first, cap 100);
 * - POST eval/runs/:id/results — eval-worker ONLY (no UI surface);
 * - POST eval/datasets/:d/candidates/:c/promote|reject (owner/admin);
 * - GET eval/datasets/:id/recall?k= (default 5, +reader);
 * - version-scoped POST assistants/:a/versions/:v/evaluate
 *   {dataset_id?, environment?, attempts_per_case?} → {eval_run_id}
 *   (template dataset auto-resolves `template:<slug>@<version>`).
 *
 * Runs: {id, dataset_id, assistant_version_id, state
 * pending|running|completed|failed, attempts_per_case, results, score,
 * started_by/at, finished_at, provenance (FULL — template slug@version,
 * definition hash, dataset hash, evaluator versions, model/catalog refs,
 * tool-catalog snapshot hash, knowledge pins, guardrail ref, compiler
 * version, environment, seed), decision PASS|WARN|BLOCK|null,
 * release_policy_version}.
 */
import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { engine } from '@lib/engine/client';
import { toastEngineError } from '@lib/engine/errors';
import { useOrg } from '@/Context/OrgContext';

const EVAL_KEY = ['studio', 'setup', 'eval'] as const;

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

export interface EvalDataset {
  id: string;
  name: string;
  description: string | null;
  createdAt: string | null;
}

export function parseDatasets(raw: unknown): EvalDataset[] {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(raw) ? raw : Array.isArray(record.datasets) ? record.datasets : [];
  return list
    .map((entry): EvalDataset | null => {
      if (typeof entry !== 'object' || entry === null) {
        return null;
      }
      const item = entry as Record<string, unknown>;
      const id = str(item.id);
      if (!id) {
        return null;
      }
      return {
        id,
        name: str(item.name) ?? 'Untitled dataset',
        description: str(item.description),
        createdAt: str(item.createdAt) ?? str(item.created_at),
      };
    })
    .filter((d): d is EvalDataset => d !== null);
}

export function useEvalDatasets(options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...EVAL_KEY, orgId, 'datasets'],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/eval/datasets`),
    enabled: (options?.enabled ?? true) && !!orgId,
    staleTime: 30_000,
    select: parseDatasets,
  });
}

export function useCreateEvalDataset() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; description?: string }) =>
      engine(`/console/org/${orgId}/eval/datasets`, {
        method: 'POST',
        body: { name: input.name, ...(input.description ? { description: input.description } : {}) },
        idempotent: true,
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...EVAL_KEY, orgId, 'datasets'] }),
    onError: (error) => toastEngineError(error, 'Could not create the dataset'),
  });
}

export function useAddEvalCases() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { datasetId: string; cases: unknown[] }) =>
      engine(`/console/org/${orgId}/eval/datasets/${input.datasetId}/cases`, {
        method: 'POST',
        body: { cases: input.cases },
        idempotent: true,
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...EVAL_KEY, orgId] }),
    onError: (error) => toastEngineError(error, 'Could not add the cases'),
  });
}

export type EvalDecision = 'PASS' | 'WARN' | 'BLOCK';
export type EvalState = 'pending' | 'running' | 'completed' | 'failed';

export interface EvalRun {
  id: string;
  datasetId: string | null;
  assistantVersionId: string | null;
  state: EvalState | string;
  attemptsPerCase: number | null;
  decision: EvalDecision | string | null;
  score: string | null;
  startedBy: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  releasePolicyVersion: number | null;
  provenance: Record<string, unknown> | null;
  /** P5 shadow rows observe drift and never gate (C10 badges them). */
  isShadow: boolean;
  /** Worker report (cases/checks/critical/metrics) — C10 failing-case anatomy. */
  results: Record<string, unknown> | null;
  environment: string | null;
}

export function parseEvalRuns(raw: unknown): EvalRun[] {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(raw) ? raw : Array.isArray(record.runs) ? record.runs : [];
  return list
    .map((entry): EvalRun | null => {
      if (typeof entry !== 'object' || entry === null) {
        return null;
      }
      const item = entry as Record<string, unknown>;
      const id = str(item.id);
      if (!id) {
        return null;
      }
      return {
        id,
        datasetId: str(item.datasetId) ?? str(item.dataset_id),
        assistantVersionId: str(item.assistantVersionId) ?? str(item.assistant_version_id),
        state: str(item.state) ?? 'pending',
        attemptsPerCase: typeof item.attemptsPerCase === 'number' ? item.attemptsPerCase : typeof item.attempts_per_case === 'number' ? (item.attempts_per_case as number) : null,
        decision: str(item.decision),
        score: item.score !== null && item.score !== undefined ? String(item.score) : null,
        startedBy: str(item.startedBy) ?? str(item.started_by),
        startedAt: str(item.startedAt) ?? str(item.started_at),
        finishedAt: str(item.finishedAt) ?? str(item.finished_at),
        releasePolicyVersion: typeof item.releasePolicyVersion === 'number' ? item.releasePolicyVersion : typeof item.release_policy_version === 'number' ? (item.release_policy_version as number) : null,
        provenance: typeof item.provenance === 'object' && item.provenance !== null ? (item.provenance as Record<string, unknown>) : null,
        isShadow: item.isShadow === true || item.is_shadow === true,
        results: typeof item.results === 'object' && item.results !== null ? (item.results as Record<string, unknown>) : null,
        environment: str(item.environment),
      };
    })
    .filter((r): r is EvalRun => r !== null);
}

export interface EvalCaseResult {
  caseId: string;
  attempt: number | null;
  passed: boolean;
  score: number | null;
  failureReason: string | null;
  /** Engine-truncated excerpt (≤512) — never the full output. */
  responseExcerpt: string | null;
}

export interface EvalCheckResult {
  name: string;
  passed: boolean;
}

export interface EvalResultsView {
  cases: EvalCaseResult[];
  checks: EvalCheckResult[];
  criticalFailures: string[];
  metrics: Record<string, number>;
}

function resultNum(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * Worker-report parser (`evalResultsSchema` — cases/checks/critical/
 * metrics, all tolerant). Case inputs are NOT here (no list endpoint) —
 * anatomy rows show ids + reasons + excerpts, never invented inputs.
 */
export function parseEvalResults(raw: unknown): EvalResultsView {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const cases: EvalCaseResult[] = [];
  if (Array.isArray(record.cases)) {
    for (const entry of record.cases) {
      if (typeof entry !== 'object' || entry === null) continue;
      const item = entry as Record<string, unknown>;
      const caseId = str(item.case_id) ?? str(item.caseId);
      if (!caseId) continue;
      cases.push({
        caseId,
        attempt: typeof item.attempt === 'number' ? item.attempt : null,
        passed: item.passed === true,
        score: resultNum(item.score),
        failureReason: str(item.failure_reason) ?? str(item.failureReason),
        responseExcerpt: str(item.response_excerpt) ?? str(item.responseExcerpt),
      });
    }
  }
  const checks: EvalCheckResult[] = [];
  if (Array.isArray(record.checks)) {
    for (const entry of record.checks) {
      if (typeof entry !== 'object' || entry === null) continue;
      const item = entry as Record<string, unknown>;
      const name = str(item.name);
      if (!name) continue;
      checks.push({ name, passed: item.passed === true });
    }
  }
  const criticalFailures = Array.isArray(record.critical_failures)
    ? (record.critical_failures as unknown[]).filter((v): v is string => typeof v === 'string')
    : [];
  const metrics: Record<string, number> = {};
  if (typeof record.metrics === 'object' && record.metrics !== null) {
    for (const [key, value] of Object.entries(record.metrics as Record<string, unknown>)) {
      const num = resultNum(value);
      if (num !== null) metrics[key] = num;
    }
  }
  return { cases, checks, criticalFailures, metrics };
}

export function useEvalRuns(datasetId?: string, options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...EVAL_KEY, orgId, 'runs', datasetId ?? null],
    queryFn: () =>
      engine<unknown>(`/console/org/${orgId}/eval/runs`, {
        query: datasetId ? { dataset_id: datasetId } : {},
      }),
    enabled: (options?.enabled ?? true) && !!orgId,
    staleTime: 10_000,
    select: parseEvalRuns,
  });
}

/**
 * Tracks an in-flight run to its terminal state (10s cadence, 3 min
 * budget — the EvaluatePanel pattern, shared so both surfaces poll the
 * same query once). `refetch` must be referentially stable.
 */
export function useEvalRunPolling(active: boolean, refetch: () => void): void {
  useEffect(() => {
    if (!active) {
      return;
    }
    const timer = window.setInterval(() => refetch(), 10_000);
    const stop = window.setTimeout(() => window.clearInterval(timer), 180_000);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(stop);
    };
  }, [active, refetch]);
}

export function useStartEvalRun() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { datasetId: string; assistantVersionId: string; attemptsPerCase?: number }) =>
      engine<{ run?: { id?: string }; id?: string }>(`/console/org/${orgId}/eval/runs`, {
        method: 'POST',
        body: {
          dataset_id: input.datasetId,
          assistant_version_id: input.assistantVersionId,
          ...(typeof input.attemptsPerCase === 'number' ? { attempts_per_case: Math.min(Math.max(1, Math.round(input.attemptsPerCase)), 5) } : {}),
        },
        idempotent: true,
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...EVAL_KEY, orgId, 'runs'] }),
    onError: (error) => toastEngineError(error, 'Could not start the eval run'),
  });
}

export function usePromoteCandidate() {
  const { orgId } = useOrg();
  return useMutation({
    mutationFn: async (input: { datasetId: string; caseId: string }) =>
      engine(`/console/org/${orgId}/eval/datasets/${input.datasetId}/candidates/${input.caseId}/promote`, { method: 'POST', idempotent: true }),
    onError: (error) => toastEngineError(error, 'Could not promote the candidate'),
  });
}

export function useRejectCandidate() {
  const { orgId } = useOrg();
  return useMutation({
    mutationFn: async (input: { datasetId: string; caseId: string }) =>
      engine(`/console/org/${orgId}/eval/datasets/${input.datasetId}/candidates/${input.caseId}/reject`, { method: 'POST', idempotent: true }),
    onError: (error) => toastEngineError(error, 'Could not reject the candidate'),
  });
}

/**
 * Retrieval recall@k over a dataset (live-verified shape):
 * {k, scored_cases, mean_recall, cases: [{case_id, recall, retrieved_document_ids}]}.
 * recall is null per case when the case declares no expected document_ids.
 */
export interface RecallCase {
  caseId: string;
  recall: number | null;
  retrievedDocumentIds: string[];
}

export interface RecallResult {
  k: number;
  scoredCases: number | null;
  meanRecall: number | null;
  cases: RecallCase[];
  raw: Record<string, unknown>;
}

function recallNum(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function useDatasetRecall(datasetId: string | null, k: number, options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...EVAL_KEY, orgId, 'recall', datasetId, k],
    queryFn: () => engine<Record<string, unknown>>(`/console/org/${orgId}/eval/datasets/${datasetId}/recall`, { query: { k } }),
    enabled: (options?.enabled ?? true) && !!orgId && !!datasetId,
    staleTime: 60_000,
    select: (raw): RecallResult => {
      const list = Array.isArray(raw.cases) ? raw.cases : [];
      const cases: RecallCase[] = [];
      for (const entry of list) {
        if (typeof entry !== 'object' || entry === null) {
          continue;
        }
        const item = entry as Record<string, unknown>;
        const caseId = typeof item.case_id === 'string' ? item.case_id : typeof item.caseId === 'string' ? (item.caseId as string) : '';
        if (!caseId) {
          continue;
        }
        cases.push({
          caseId,
          recall: recallNum(item.recall),
          retrievedDocumentIds: Array.isArray(item.retrieved_document_ids)
            ? (item.retrieved_document_ids as unknown[]).filter((id): id is string => typeof id === 'string')
            : [],
        });
      }
      return {
        k,
        scoredCases: recallNum(raw.scored_cases),
        meanRecall: recallNum(raw.mean_recall),
        cases,
        raw,
      };
    },
  });
}
