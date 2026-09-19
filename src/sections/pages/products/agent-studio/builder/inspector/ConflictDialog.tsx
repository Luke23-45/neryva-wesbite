import { ActionButton } from '@components/common/ui/ActionButton';
import { Modal } from '@components/common/ui/Modal';
import { useAssistantDefinition, type AgentDefinition } from '@hooks/studio/useAgentAuthoring';
import {
  ConflictDiff,
  ConflictLabel,
  ConflictPane,
  ConflictText,
} from './InstructionsSection.styles';

export interface ConflictDialogProps {
  assistantId: string;
  /** The field text being saved (instructions, brand voice, …). */
  attempted: string;
  expectedHash: string;
  currentHash: string | null;
  pending: boolean;
  /** Selects the conflicting field from the live server definition. */
  selectTheirs: (definition: AgentDefinition) => string;
  onReloadTheirs: (theirs: string) => void;
  onSaveMine: (freshHash: string) => void;
  onClose: () => void;
}

/**
 * Shared 412 merge-or-reload (Room copy skeleton). One dialog, every field:
 * callers differ only in which text they diff. Copy parity across surfaces
 * beats forked dialogs — this wording matches the Engine Room verbatim.
 */
export function ConflictDialog({
  assistantId,
  attempted,
  expectedHash,
  currentHash,
  pending,
  selectTheirs,
  onReloadTheirs,
  onSaveMine,
  onClose,
}: ConflictDialogProps) {
  const form = useAssistantDefinition(assistantId);
  const theirs = form.data ? selectTheirs(form.data.definition) : '';
  const freshHash = form.data?.hash ?? null;

  return (
    <Modal
      open
      onClose={onClose}
      title="Someone saved first — merge or reload"
      width={640}
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>
            Keep editing (autosave stays off)
          </ActionButton>
          <ActionButton variant="secondary" disabled={pending} onClick={() => onReloadTheirs(theirs)}>
            Reload theirs
          </ActionButton>
          <ActionButton
            disabled={pending || !freshHash}
            title={freshHash ? 'Retry your save against the fresh hash' : 'Waiting for the fresh version…'}
            onClick={() => freshHash && onSaveMine(freshHash)}
          >
            Save mine over theirs
          </ActionButton>
        </>
      }
    >
      <p style={{ fontSize: 13, opacity: 0.8 }}>
        Your save carried hash {expectedHash.slice(0, 12) || '—'}; the server is at {currentHash?.slice(0, 12) ?? 'unknown'}.
        Nothing was overwritten. Their text against your attempt:
      </p>
      <ConflictDiff>
        <ConflictPane>
          <ConflictLabel>THEIRS (SERVER)</ConflictLabel>
          <ConflictText>{theirs.slice(0, 800) || '(empty)'}</ConflictText>
        </ConflictPane>
        <ConflictPane>
          <ConflictLabel>YOURS (ATTEMPTED)</ConflictLabel>
          <ConflictText>{attempted.slice(0, 800) || '(empty)'}</ConflictText>
        </ConflictPane>
      </ConflictDiff>
      {currentHash === null && (
        <p style={{ fontSize: 12, color: '#f87171' }}>
          The refusal carried no current hash — reload theirs before retrying.
        </p>
      )}
    </Modal>
  );
}
