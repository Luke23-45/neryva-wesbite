import { useEffect } from 'react';

/**
 * Removes the inline boot splash (index.html) once React has painted its
 * first frame. createRoot normally clears #root's children on mount, but
 * this is the deterministic fallback — the effect runs after paint, so
 * the splash stays visible until real content replaces it (no blank flash).
 */
export function BootSplashCleaner() {
  useEffect(() => {
    document.getElementById('boot-splash')?.remove();
  }, []);
  return null;
}
