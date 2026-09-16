/**
 * Auth domain hooks (session/account/login) — the per-domain submodule for
 * everything sign-in shaped. Server state via TanStack Query (`['auth', …]`
 * keys); session tokens via the zustand OP session store (memory-first).
 */
export { useSessionStatus, useSessionAccount, useIsAuthenticated } from './useSession';
export { useLoginProviders, type LoginProvider } from './useLoginProviders';
export { useAccount, type EngineAccount } from './useAccount';
export { useLogout } from './useLogout';
