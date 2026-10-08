import { useBlocker } from '@tanstack/react-router';
import { ConfirmDialog } from '@components/common/ui/ConfirmDialog';

/**
 * Dirty-guard for builder surfaces (SIDEBAR_LEDGER.md §4.8). Covers every
 * router-level navigation (sidebar rows, back row, breadcrumbs, palette,
 * browser back/forward) plus reload/tab-close via enableBeforeUnload.
 * Custom product-toned dialog — never window.confirm.
 *
 * Accepts a plain boolean (re-evaluated every render, as before) or a
 * getter for cases where the decision must be read at navigation time:
 * a successful submit disarms the guard synchronously (via ref) BEFORE
 * navigating, which a render-scoped boolean cannot do without racing the
 * blocker's stale closure.
 */
export function useDirtyGuard(
  dirty: boolean | (() => boolean),
  message = 'You have unsaved changes. Leaving now loses them — autosave only runs while the draft is shippable.',
) {
  const shouldBlockFn = typeof dirty === 'function' ? dirty : () => dirty;
  // enableBeforeUnload takes a plain boolean: evaluate once per render. A
  // stale unload prompt is harmless (it only asks); the router blocker
  // above stays exact because it reads the getter at navigation time.
  const unloadArmed = typeof dirty === 'function' ? dirty() : dirty;
  const { proceed, reset, status } = useBlocker({
    shouldBlockFn,
    withResolver: true,
    enableBeforeUnload: unloadArmed,
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
