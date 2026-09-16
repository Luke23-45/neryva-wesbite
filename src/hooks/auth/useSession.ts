/**
 * Session selectors — thin zustand accessors so views never touch the
 * session store shape directly.
 */
import { useSessionStore, type SessionAccount } from '@lib/engine/auth';

export function useSessionStatus(): 'unknown' | 'authenticated' | 'anonymous' {
  return useSessionStore((s) => s.status);
}

export function useSessionAccount(): SessionAccount | null {
  return useSessionStore((s) => s.account);
}

export function useIsAuthenticated(): boolean {
  return useSessionStore((s) => s.status === 'authenticated');
}
