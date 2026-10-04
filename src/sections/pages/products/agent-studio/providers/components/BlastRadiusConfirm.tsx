/**
 * BlastRadiusConfirm — SHARED alert-class confirm (Providers Tab C now,
 * agent builder Model picker in Phase 6 — doc 20 §3.3).
 *
 * Rendered when toggling OFF / removing a model that is pinned by one or
 * more assistants (`pinned_by[]` from N-5). Lists every affected assistant
 * with its pinned version and requires explicit confirmation — there is no
 * confirm-on-blur or default-accept path.
 *
 * Pinning invariant (stated in the copy): runs keep running on their pinned
 * versions; disabling the model only removes it from the enabled set for
 * future picks and publishes.
 *
 * Alert-class confirm dialogs are allowed under the zero-content-modals
 * directive (user-set 2026-09-29). Pure props, zero data fetching, zero
 * page-specific imports.
 */
import styled from 'styled-components';
import { ConfirmDialog } from '@/components/common/ui/ConfirmDialog';

export interface BlastRadiusAffected {
  assistant_id: string;
  version: number;
  assistant_name?: string;
}

export interface BlastRadiusConfirmProps {
  affected: BlastRadiusAffected[];
  /** e.g. "Disable model" — labels the destructive action. */
  actionLabel: string;
  /**
   * Override the default org-disable consequence copy. The builder (Phase 6)
   * passes draft-pipeline-specific copy — removing from a draft never touches
   * the org's enabled set. Tab C keeps the default.
   */
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const List = styled.ul`
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
  max-height: 220px;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
`;

const Row = styled.li`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 9px 12px;
  font-size: 13px;
  color: rgba(229, 231, 235, 0.9);

  & + & {
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }
`;

const Name = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Version = styled.span`
  flex: none;
  font-size: 11.5px;
  color: rgba(229, 231, 235, 0.6);
  font-variant-numeric: tabular-nums;
`;

const Invariant = styled.p`
  margin: 12px 0 0;
  font-size: 12.5px;
  line-height: 1.55;
  color: rgba(229, 231, 235, 0.62);
`;

export function BlastRadiusConfirm({ affected, actionLabel, message, onConfirm, onCancel }: BlastRadiusConfirmProps) {
  const count = affected.length;
  const assistantNoun = count === 1 ? 'assistant' : 'assistants';
  const defaultMessage = `${count} published ${assistantNoun} currently pin${count === 1 ? 's' : ''} this model. ${actionLabel}ing it removes it from the org's enabled set immediately.`;
  return (
    <ConfirmDialog
      open
      title={`${actionLabel} — ${count} pinned ${assistantNoun}`}
      message={message ?? defaultMessage}
      confirmLabel={actionLabel}
      cancelLabel="Keep enabled"
      destructive
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <List aria-label="Affected assistants">
        {affected.map((a) => (
          <Row key={`${a.assistant_id}:${a.version}`}>
            <Name>{a.assistant_name ?? a.assistant_id}</Name>
            <Version>v{a.version}</Version>
          </Row>
        ))}
      </List>
      <Invariant>
        Pinning invariant: runs already in flight — and any run replayed from history — keep running on
        their pinned versions. Only new picks and publishes are affected.
      </Invariant>
    </ConfirmDialog>
  );
}
