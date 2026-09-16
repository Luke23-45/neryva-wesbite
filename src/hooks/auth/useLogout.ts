/**
 * Sign-out mutation — revokes server sessions, clears locally with
 * logout-everywhere broadcast, and ends the OP session (full-page).
 */
import { useMutation } from '@tanstack/react-query';
import { logout } from '@lib/engine/auth';

export function useLogout() {
  return useMutation({
    mutationKey: ['auth', 'logout'],
    mutationFn: () => logout(),
  });
}
