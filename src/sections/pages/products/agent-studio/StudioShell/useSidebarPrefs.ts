import { useState } from 'react';

const COLLAPSE_KEY = 'neryva.sidebar.collapsed';

/**
 * Sidebar chrome prefs (SIDEBAR_LEDGER.md §3). Collapse persists per account.
 * The level-1 pin is derived, not stored: `pinLevel1()` records the CURRENT
 * pathname, and any navigation changes the pathname — so the pin clears
 * itself with no effect, no subscription, and no stale state after back/forward.
 */
function readBool(key: string, fallback: boolean): boolean {
  try {
    if (typeof window === 'undefined') return fallback;
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : raw === '1';
  } catch {
    return fallback;
  }
}

export function useSidebarPrefs(pathname: string) {
  const [collapsed, setCollapsed] = useState(() => readBool(COLLAPSE_KEY, false));
  const [pinnedPath, setPinnedPath] = useState<string | null>(null);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      } catch {
        // Private mode etc: prefs degrade to session-only, never crash.
      }
      return next;
    });
  };

  return {
    collapsed,
    toggleCollapsed,
    pinnedLevel1: pinnedPath !== null && pinnedPath === pathname,
    pinLevel1: () => setPinnedPath(pathname),
  };
}
