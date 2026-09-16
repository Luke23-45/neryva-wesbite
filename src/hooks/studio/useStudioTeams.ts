/**
 * @deprecated Team-loop consolidation: the only hook that lived here
 * (`useDeleteServiceAccount`) now lives in `@hooks/engine/mutations` with
 * step-up retry (the engine demands a fresh MFA proof on
 * `DELETE :orgId/service-accounts/:id`). This module re-exports it so older
 * imports keep working; new code must import from `@hooks/engine/mutations`.
 */
export { useDeleteServiceAccount } from '@hooks/engine/mutations';
