import styled from 'styled-components';

/**
 * SectionBody chrome (configure-first redesign).
 *
 * The main content pane: the section's own real implementation, starting
 * immediately — no redundant header. The left sidebar already says where
 * the user is, so a repeated title + status line is slop. The only chrome
 * is a quiet utility row carrying the per-section Save button where a
 * real save exists behind it.
 */

export const SectionWrap = styled.div`
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
`;

/**
 * Minimal utility row — not a header. No title, no status line, no border.
 * Exists only to give the per-section Save button a quiet home; sections
 * without a real save render nothing here and their content starts at once.
 */
export const SectionActions = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 12px 28px 0;
`;

export const SectionPane = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 20px 28px 48px;
  /* Hidden scrollbars — wheel/touch/keyboard keep working. */
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

/**
 * Section content column (builder redesign).
 *
 * Form-density sections constrain to a readable measure — psychology:
 * a bounded line length lowers cognitive load and the page feels calm
 * instead of stretched. List/table-density sections pass $wide to take
 * the full pane.
 */
export const SectionContent = styled.div<{ $wide?: boolean }>`
  max-width: ${({ $wide }) => ($wide ? 'none' : '720px')};
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding-top: 8px;
`;
