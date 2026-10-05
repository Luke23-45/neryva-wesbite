import type { ReactNode } from 'react';
import { Modal } from '../Modal';
import { DangerButton, GhostButton } from './ConfirmDialog.styles';

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  /**
   * Round 4 P2: disables the confirm button while an async confirm is in
   * flight — prevents double-submit (e.g. double rotate/revoke firing
   * mutate twice). The label flip ("Rotating…") already existed; the button
   * stayed clickable.
   */
  confirmDisabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** Optional extra controls rendered under the message (e.g. incident fields). */
  children?: ReactNode;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive,
  confirmDisabled,
  onConfirm,
  onCancel,
  children,
}: Props) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <GhostButton type="button" onClick={onCancel}>
            {cancelLabel}
          </GhostButton>
          <DangerButton
            type="button"
            $destructive={destructive}
            onClick={onConfirm}
            disabled={confirmDisabled}
          >
            {confirmLabel}
          </DangerButton>
        </>
      }
    >
      <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: 'rgba(229,231,235,0.78)' }}>
        {message}
      </p>
      {children}
    </Modal>
  );
}
