import styled from 'styled-components';

/**
 * InlineRetry — shared link-styled retry button for inline error rows.
 *
 * Used by section error branches that offer a one-tap retry without a
 * full error panel (e.g. Evaluation runs, Samples registry). Tokens only.
 */
export const InlineRetry = styled.button`
  background: none;
  border: none;
  padding: 0 4px;
  /* 44px hit area without changing the link treatment — the text stays
   * inline-size, vertically centered in the taller target. */
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  font: inherit;
  cursor: pointer;
  color: ${({ theme }) => theme.app.text.link};
  text-decoration: underline;
  text-underline-offset: ${({ theme }) => theme.spacing.px2};

  &:hover {
    color: ${({ theme }) => theme.app.text.linkHover};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;
