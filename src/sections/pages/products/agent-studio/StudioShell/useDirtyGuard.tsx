import { useBlocker } from '@tanstack/react-router';
import { ConfirmDialog } from '@components/common/ui/ConfirmDialog';

/**
 * Dirty-guard for builder surfaces (SIDEBAR_LEDGER.md §4.8). Covers every
 * router-level navigation (sidebar rows, back row, breadcrumbs, palette,
 * browser back/forward) plus reload/tab-close via enableBeforeUnload.
 * Custom product-toned dialog — never window.confirm.
 */
export function useDirtyGuard(
  dirty: boolean,
  message = 'You have unsaved changes. Leaving now loses them — autosave only runs while the draft is shippable.',
) {
  const { proceed, reset, status } = useBlocker({
    shouldBlockFn: () => dirty,
    withResolver: true,
    enableBeforeUnload: dirty,
  });

  const dialog = (
    <ConfirmDialog
      open={status === 'blocked'}
      title="Leave without saving?"
      message={message}
      confirmLabel="Leave"
      cancelLabel="Stay"
      onConfirm={() => proceed?.()}
      onCancel={() => reset?.()}
    />
  );

  return { dialog };
}
