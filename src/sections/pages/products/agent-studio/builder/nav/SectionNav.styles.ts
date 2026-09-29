import styled from 'styled-components';

/**
 * Section navigation chrome (configure-first redesign).
 *
 * Dark app system, quiet selection: the selected row gets a neutral fill —
 * never a blue border or overlay. Scrollbars are never painted (wheel, touch
 * and keyboard scrolling keep working).
 */

export const Nav = styled.nav`
  width: 264px;
  flex: none;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.app.bg.raised};
  border-right: 1px solid ${({ theme }) => theme.app.border.hairline};

  /* Tablet and below: Main stacks vertically — the nav becomes a
     full-width, capped-height strip above the main pane instead of a
     narrow column that would squeeze the content. */
  ${({ theme }) => theme.media.tablet} {
    width: auto;
    border-right: none;
    border-bottom: 1px solid ${({ theme }) => theme.app.border.hairline};
  }
`;

export const NavScroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 12px 10px 16px;
  /* Hidden scrollbars — Figma-style: scrolling still works via
     wheel/touch/keyboard, the bar itself is never painted. */
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

export const OverviewRow = styled.button<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 36px;
  padding: 0 10px;
  margin-bottom: 14px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme, $selected }) => ($selected ? theme.app.surface.active : 'transparent')};
  color: ${({ theme }) => theme.app.text.primary};
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ $selected }) => ($selected ? 600 : 500)};
  cursor: pointer;
  text-align: left;

  &:hover {
    background: ${({ theme, $selected }) => ($selected ? theme.app.surface.active : theme.app.surface.hover)};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: -2px;
  }
`;

export const GroupLabel = styled.div`
  padding: 10px 10px 4px;
  font-size: ${({ theme }) => theme.app.type.micro};
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.faint};
`;

export const SectionRow = styled.button<{ $selected: boolean; $locked: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 34px;
  padding: 0 10px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme, $selected }) => ($selected ? theme.app.surface.active : 'transparent')};
  color: ${({ theme, $locked }) => ($locked ? theme.app.text.ghost : theme.app.text.body)};
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ $selected }) => ($selected ? 600 : 450)};
  cursor: ${({ $locked }) => ($locked ? 'not-allowed' : 'pointer')};
  text-align: left;

  &:hover {
    background: ${({ theme, $selected, $locked }) =>
      $locked ? 'transparent' : $selected ? theme.app.surface.active : theme.app.surface.hover};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: -2px;
  }
`;

export const RowGlyph = styled.span`
  display: inline-flex;
  flex: none;
  color: ${({ theme }) => theme.app.text.muted};
  svg {
    display: block;
  }
`;

export const RowLabel = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const RowBadge = styled.span`
  display: inline-flex;
  flex: none;
`;
