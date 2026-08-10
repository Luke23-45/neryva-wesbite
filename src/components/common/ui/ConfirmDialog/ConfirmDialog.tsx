import { Modal } from '../Modal';
import { DangerButton, GhostButton } from './ConfirmDialog.styles';

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive,
  onConfirm,
  onCancel,
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
          <DangerButton type="button" $destructive={destructive} onClick={onConfirm}>
            {confirmLabel}
          </DangerButton>
        </>
      }
    >
      <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: 'rgba(229,231,235,0.78)' }}>
        {message}
      </p>
    </Modal>
  );
}
