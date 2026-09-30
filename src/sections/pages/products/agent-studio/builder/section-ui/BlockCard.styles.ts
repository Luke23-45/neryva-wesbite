import styled from 'styled-components';

/**
 * Block card styles — the collapsed field card shared by Instructions,
 * Role, and Brand.
 *
 * SPEC_BLUE / SPEC_LINK are intentional: they are the SVG design's own
 * blues (the Write button fill and the link blue, which matches
 * MarkdownText's hard-coded link color). Everything else is theme tokens.
 */

/** Spec: primary button blue from the SVG design. */
export const SPEC_BLUE = '#2b6cb0';
/** Spec: link blue from the SVG design. */
export const SPEC_LINK = '#7aa7ff';

export const Card = styled.div`
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s2};
  cursor: pointer;
  transition: border-color ${({ theme }) => theme.transitions.fast},
    background ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.app.border.hover};
    background: ${({ theme }) => theme.app.surface.tint};
  }

  &:focus-visible {
    outline: none;
    box-shadow: ${({ theme }) => theme.app.focusRing};
  }
`;

export const CardHead = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s2};
`;

export const CardTitle = styled.span`
  font-size: 13px;
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.tight};
  color: ${({ theme }) => theme.app.text.primary};
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/** "128 chars" pill. */
export const CharPill = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.app.text.secondary};
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  border-radius: 4px;
  padding: 2px 6px;
  white-space: nowrap;
  font-variant-numeric: ${({ theme }) => theme.app.numeric};
`;

export const IconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: ${({ theme }) => theme.app.text.secondary};
  cursor: pointer;
  flex: 0 0 auto;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.app.surface.hover};
    color: ${({ theme }) => theme.app.text.primary};
  }

  &:focus-visible {
    outline: none;
    box-shadow: ${({ theme }) => theme.app.focusRing};
  }
`;

export const CardHelper = styled.p`
  margin: 0;
  font-size: 12px;
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
  color: ${({ theme }) => theme.app.text.secondary};
`;

/* ── Empty state ─────────────────────────────────────────────── */

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 6px;
  padding: 22px 12px 18px;
`;

export const EmptyIcon = styled.span`
  display: inline-flex;
  color: ${({ theme }) => theme.app.text.faint};
  margin-bottom: 2px;
`;

export const EmptyTitle = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const EmptyHint = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.app.text.muted};
  max-width: 380px;
  line-height: 1.55;
`;

export const EmptyActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s3};
  margin-top: 6px;
`;

export const InsertLink = styled.button`
  border: 0;
  background: none;
  padding: 0;
  font: inherit;
  font-size: 12px;
  color: ${SPEC_LINK};
  cursor: pointer;

  &:hover {
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  &:focus-visible {
    outline: none;
    box-shadow: ${({ theme }) => theme.app.focusRing};
    border-radius: 4px;
  }
`;

export const WriteButton = styled.button`
  border: 0;
  border-radius: 6px;
  background: ${SPEC_BLUE};
  color: ${({ theme }) => theme.app.text.primary};
  font-size: 12px;
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  padding: 7px 16px;
  cursor: pointer;
  transition: filter ${({ theme }) => theme.transitions.fast};

  &:hover {
    filter: brightness(1.12);
  }

  &:focus-visible {
    outline: none;
    box-shadow: ${({ theme }) => theme.app.focusRing};
  }
`;

/* ── Filled preview ──────────────────────────────────────────── */

export const PreviewWrap = styled.div`
  position: relative;
  overflow: hidden;
`;

export const PreviewText = styled.div<{ $mono?: boolean }>`
  font-size: 12px;
  line-height: 20px;
  color: ${({ theme }) => theme.app.text.secondary};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
  white-space: pre-line;
  /* Fade the second line into the card — a mask avoids matching the card fill. */
  -webkit-mask-image: linear-gradient(to bottom, black 55%, transparent 100%);
  mask-image: linear-gradient(to bottom, black 55%, transparent 100%);
  ${({ $mono, theme }) => ($mono ? `font-family: ${theme.typography.fonts.mono}; font-size: 11px;` : '')}
`;

export const PreviewCaption = styled.div`
  font-size: 10px;
  color: ${({ theme }) => theme.app.text.muted};
`;

/* ── List-field chips (Role list cards) ──────────────────────── */

export const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-height: 40px;
  overflow: hidden;
  position: relative;
`;

export const Chip = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.app.text.secondary};
  background: ${({ theme }) => theme.app.surface.tint};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 999px;
  padding: 3px 10px;
  white-space: nowrap;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const ChipMore = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.app.text.muted};
  align-self: center;
`;

/* ── Sample entry point ──────────────────────────────────────── */

export const SampleEntry = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.s3};
  width: 100%;
  border: 1px dashed ${({ theme }) => theme.app.border.strong};
  border-radius: 10px;
  background: transparent;
  padding: 12px 14px;
  cursor: pointer;
  text-align: left;
  transition: border-color ${({ theme }) => theme.transitions.fast},
    background ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.app.border.hover};
    background: ${({ theme }) => theme.app.surface.subtle};
  }

  &:focus-visible {
    outline: none;
    box-shadow: ${({ theme }) => theme.app.focusRing};
  }
`;

export const SampleEntryText = styled.span`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const SampleEntryTitle = styled.span`
  font-size: 12px;
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.app.text.primary};
`;

export const SampleEntryHint = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.app.text.muted};
`;

export const SampleEntryChevron = styled.span`
  display: inline-flex;
  color: ${({ theme }) => theme.app.text.muted};
`;
