import { redirect } from '@tanstack/react-router';

export function requireAuth() {
  const token =
    localStorage.getItem('accessToken') ||
    sessionStorage.getItem('accessToken');

  if (!token) {
    throw redirect({ to: '/auth' });
  }
}
