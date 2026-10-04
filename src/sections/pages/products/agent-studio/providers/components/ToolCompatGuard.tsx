/**
 * ToolCompatGuard — SHARED guard for model selection surfaces (Providers
 * Tab C now, agent builder Model picker in Phase 6 — doc 20 §3.2).
 *
 * Pure props, zero data fetching, zero page-specific imports. Renders nothing
 * unless pinned tools actually exceed the model's capabilities:
 *   pinnedToolCount > 0 && modelCapabilities.tools === false.
 *
 * Warn, don't forbid: the caller mounts this when a selection is about to
 * proceed anyway, and it makes the incompatibility explicit with an
 * unambiguous confirm step. The caller owns visibility; this component owns
 * the warning copy and the explicit confirm/cancel contract.
 */
import styled from 'styled-components';

export interface ToolCompatModelCapabilities {
  tools: boolean;
  vision?: boolean;
  reasoning?: boolean;
  structured_output?: boolean;
}

export interface ToolCompatGuardProps {
  modelCapabilities: ToolCompatModelCapabilities;
  pinnedToolCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

const Guard = styled.div`
  margin-top: 10px;
  border: 1px solid rgba(217, 119, 6, 0.55);
  border-radius: 10px;
  background: rgba(217, 119, 6, 0.1);
  padding: 12px 14px;
`;

const Badge = styled.span`
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #f5b04c;
  border: 1px solid rgba(245, 176, 76, 0.6);
  border-radius: 999px;
  padding: 2px 10px;
  margin-bottom: 8px;
`;

const Copy = styled.p`
  margin: 0 0 12px;
  font-size: 13px;
  line-height: 1.55;
  color: rgba(250, 214, 165, 0.92);
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
`;

const ConfirmButton = styled.button`
  border: 1px solid rgba(245, 176, 76, 0.7);
  border-radius: 8px;
  background: rgba(245, 176, 76, 0.16);
  color: #fbd9a0;
  font-size: 13px;
  font-weight: 600;
  padding: 7px 14px;
  cursor: pointer;

  &:hover {
    background: rgba(245, 176, 76, 0.26);
  }
`;

const CancelButton = styled.button`
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 8px;
  background: transparent;
  color: rgba(229, 231, 235, 0.85);
  font-size: 13px;
  font-weight: 500;
  padding: 7px 14px;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
  }
`;

export function ToolCompatGuard({
  modelCapabilities,
  pinnedToolCount,
  onConfirm,
  onCancel,
}: ToolCompatGuardProps) {
  const incompatible = pinnedToolCount > 0 && modelCapabilities.tools === false;
  if (!incompatible) return null;

  const toolNoun = pinnedToolCount === 1 ? 'tool' : 'tools';
  return (
    <Guard role="alert" aria-live="assertive">
      <Badge>Incompatible: no tool support</Badge>
      <Copy>
        This model has no native tool calling. {pinnedToolCount} pinned {toolNoun} cannot
        dispatch on it — any assistant that relies on {pinnedToolCount === 1 ? 'it' : 'them'} will
        fail at run time. Proceed only if you understand this trade-off.
      </Copy>
      <Actions>
        <ConfirmButton type="button" onClick={onConfirm}>
          Select anyway
        </ConfirmButton>
        <CancelButton type="button" onClick={onCancel}>
          Choose another
        </CancelButton>
      </Actions>
    </Guard>
  );
}
