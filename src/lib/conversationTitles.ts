/**
 * Display titles for conversations (shared-shell pass).
 *
 * Conversations with no real title arrive as "Untitled conversation" (or
 * blank) from the list/detail endpoints — several in a row are
 * indistinguishable. The engine's list surface exposes no message preview,
 * so a first-user-message snippet is not available here; the honest
 * fallback is the relative update time, which is always present on
 * listed conversations. Display-only: titles are never renamed server-side.
 */

/** Titles the server (or a client fallback) emits for untitled threads. */
export function isGenericConversationTitle(title: string): boolean {
  const normalized = title.toLowerCase().trim();
  return normalized === 'untitled conversation' || normalized === 'untitled' || normalized === '';
}

/**
 * Relative time with the clock time always included ("Today · 2:14 PM"):
 * several untitled conversations created on the same day would otherwise
 * render identically.
 */
export function formatConversationRelativeDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `Just now · ${time}`;
  if (diffDays === 0) return `Today · ${time}`;
  if (diffDays === 1) return `Yesterday · ${time}`;
  if (diffDays < 7) return `${diffDays}d ago · ${time}`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks === 1 ? '1w' : `${weeks}w`} ago · ${time}`;
  }
  return `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · ${time}`;
}

/**
 * The title to render for a conversation row/header. Real titles pass
 * through untouched; generic ones gain the relative time so they can be
 * told apart. `updatedAt` may be null (unlisted/legacy records) — then the
 * bare fallback is the best honest label available.
 */
export function displayConversationTitle(title: string, updatedAt: string | null): string {
  if (!isGenericConversationTitle(title)) {
    return title;
  }
  if (updatedAt) {
    return `Untitled conversation · ${formatConversationRelativeDate(updatedAt)}`;
  }
  return 'Untitled conversation';
}
