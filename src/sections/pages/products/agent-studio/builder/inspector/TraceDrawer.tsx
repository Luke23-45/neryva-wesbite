import { Link } from '@tanstack/react-router';
import { Drawer } from '@components/common/ui/Drawer';
import type { RunNotice, TryTurnStatus } from '@hooks/studio/useChat';
import {
  TRY_COPY,
  describeGuardrailRow,
  extractReportedHits,
  extractReportedVerdicts,
  type TryStop,
} from '../lib/try-model';
import { EmptyState, SectionLabel } from './InstructionsSection.styles';
import { PreviewItem, PreviewList, PreviewMeta } from './MemorySection.styles';
import { TextButton } from './ToolsSection.styles';
import { Chip, ChipRow, Note, StopBlock, StopDetail, StopHeadline } from './TraceDrawer.styles';

export type TraceEditTarget = 'purpose' | 'brain' | 'knowledge' | 'tools' | 'guardrails' | 'budget';

export interface TraceTurnView {
  prompt: string;
  status: TryTurnStatus;
  notices: RunNotice[];
  stop: TryStop | null;
  rawEvents: string[];
}

export interface TraceGuardrailPolicy {
  input: string;
  output: string;
  mode: 'blocking' | 'logging';
}

export interface TraceDrawerProps {
  open: boolean;
  onClose: () => void;
  turn: TraceTurnView | null;
  versionLabel: string;
  /** Draft instructions excerpt source — null when the version has none. */
  directiveText: string | null;
  guardrailPolicy: TraceGuardrailPolicy | null;
  /** Builder surface: jumps select the slot. Detail surface: links out. */
  onEditJump?: (target: TraceEditTarget) => void;
  builderHref?: string;
  /** Null while a run is busy — re-ask is a fresh draft-pinned run. */
  onReask: (() => void) | null;
}

function parsePayloads(rawEvents: string[]): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for (const raw of rawEvents) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) {
        out.push(parsed as Record<string, unknown>);
      }
    } catch {
      // Non-JSON tails carry no structured trace — skipped, never guessed.
    }
  }
  return out;
}

function EditLink({
  target,
  label,
  onEditJump,
  builderHref,
}: {
  target: TraceEditTarget;
  label: string;
  onEditJump?: (target: TraceEditTarget) => void;
  builderHref?: string;
}) {
  if (onEditJump) {
    return <TextButton onClick={() => onEditJump(target)}>{label}</TextButton>;
  }
  if (builderHref) {
    return <Link to={builderHref}>{label}</Link>;
  }
  return null;
}

/**
 * Shared trace drawer (C13 owns it; C10/C15 reuse it, never fork it).
 * Every row traces to a reported event, the draft, or a stated absence —
 * the drawer synthesizes nothing (SPEC correction D4).
 */
export function TraceDrawer({
  open,
  onClose,
  turn,
  versionLabel,
  directiveText,
  guardrailPolicy,
  onEditJump,
  builderHref,
  onReask,
}: TraceDrawerProps) {
  const payloads = turn ? parsePayloads(turn.rawEvents) : [];
  const hits = payloads.flatMap((p) => extractReportedHits(p));
  const verdicts = payloads.flatMap((p) => extractReportedVerdicts(p));
  const toolNotices = turn?.notices.filter((n) => n.kind === 'tool') ?? [];
  const usageNotices = turn?.notices.filter((n) => n.kind === 'usage') ?? [];
  const shadowReported = payloads.some((p) => p.shadow === true || p.execution_mode === 'shadow');

  return (
    <Drawer open={open} onClose={onClose} title="Trace" subtitle={`What the run saw — not proof of why · ${versionLabel}`}>
      {!turn ? (
        <EmptyState>No turn selected.</EmptyState>
      ) : (
        <>
          <SectionLabel>Retrieved · reported only</SectionLabel>
          {hits.length === 0 ? (
            <Note>No retrieval hits were reported for this run.</Note>
          ) : (
            <ChipRow>
              {hits.map((hit, index) => (
                <Chip key={`${hit.title ?? 'hit'}-${hit.chunk ?? index}`}>
                  {[hit.title, hit.chunk, hit.score !== null ? hit.score.toFixed(2) : null].filter((part) => part !== null).join(' · ')}
                </Chip>
              ))}
            </ChipRow>
          )}
          <Note>{TRY_COPY.reportedOnly}</Note>

          <SectionLabel>Directive · from the draft</SectionLabel>
          {directiveText ? (
            <>
              <PreviewList>
                <PreviewItem>“{directiveText.length > 280 ? `${directiveText.slice(0, 280)}…` : directiveText}”</PreviewItem>
              </PreviewList>
              <EditLink target="purpose" label="Edit in Purpose ›" onEditJump={onEditJump} builderHref={builderHref} />
            </>
          ) : (
            <Note>This version has no instructions — the run executed without a system prompt.</Note>
          )}

          <SectionLabel>Tool calls</SectionLabel>
          {toolNotices.length === 0 ? (
            <Note>No tool calls were reported.</Note>
          ) : (
            <PreviewList>
              {toolNotices.map((notice) => (
                <PreviewItem key={notice.id}>{notice.text}</PreviewItem>
              ))}
            </PreviewList>
          )}
          {shadowReported && <Note>A shadow-mode call ran simulated — it gated nothing.</Note>}
          {toolNotices.length > 0 && (
            <EditLink target="tools" label="Review in Tools ›" onEditJump={onEditJump} builderHref={builderHref} />
          )}

          <SectionLabel>Guardrails</SectionLabel>
          {guardrailPolicy ? (
            <PreviewList>
              <PreviewItem>
                {guardrailPolicy.input} · {guardrailPolicy.output} · {guardrailPolicy.mode}
                <PreviewMeta>Policy from the draft — verdicts below are Studio-reported.</PreviewMeta>
              </PreviewItem>
              {verdicts.map((verdict) => (
                <PreviewItem key={verdict.policy}>
                  {describeGuardrailRow({ policy: verdict.policy, mode: guardrailPolicy.mode, verdict: verdict.verdict })}
                </PreviewItem>
              ))}
            </PreviewList>
          ) : (
            <Note>No guardrail policy on this version.</Note>
          )}
          {guardrailPolicy && verdicts.length === 0 && (
            <Note>No per-run verdicts were reported — the mode above still applies.</Note>
          )}

          <SectionLabel>Model · tokens · cost</SectionLabel>
          {usageNotices.length === 0 ? (
            <Note>No usage was reported for this run.</Note>
          ) : (
            <PreviewList>
              {usageNotices.map((notice) => (
                <PreviewItem key={notice.id}>
                  {notice.text}
                  <PreviewMeta>Reported by Studio for this run.</PreviewMeta>
                </PreviewItem>
              ))}
            </PreviewList>
          )}
          <Note>{TRY_COPY.noBillRow}</Note>

          {turn.stop && turn.stop.kind !== 'none' && (
            <>
              <SectionLabel>Stop lines</SectionLabel>
              <StopBlock $tone={turn.stop.kind === 'reported' ? 'warning' : 'error'}>
                <StopHeadline $tone={turn.stop.kind === 'reported' ? 'warning' : 'error'}>{turn.stop.headline}</StopHeadline>
                <StopDetail>{turn.stop.detail}</StopDetail>
              </StopBlock>
            </>
          )}

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 16 }}>
            {onReask && <TextButton onClick={onReask}>Re-ask ↻</TextButton>}
            <EditLink target="purpose" label="Adjust in builder →" onEditJump={onEditJump} builderHref={builderHref} />
          </div>
          <Note>{TRY_COPY.draftIntact}</Note>
        </>
      )}
    </Drawer>
  );
}
